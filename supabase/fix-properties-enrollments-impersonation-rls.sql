-- Fix Properties and Enrollments RLS Policies for Impersonation
-- This ensures that when an admin impersonates a property manager,
-- the RLS policies filter data based on the impersonated user, not the admin
--
-- IMPORTANT: Make sure you've run impersonation-rls-support.sql first
-- to create the get_effective_user_id() and get_effective_user_role() functions

-- ============================================================
-- PROPERTIES TABLE RLS POLICIES
-- ============================================================

-- Drop ALL existing property SELECT policies to avoid conflicts
-- This includes any from optimize-rls.sql or other scripts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'properties' 
        AND schemaname = 'public'
        AND cmd = 'SELECT'
    ) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.properties';
    END LOOP;
END $$;

-- Policy 1: Admins and centralized members see ALL properties
-- Uses get_effective_user_role() to respect impersonation
CREATE POLICY "Admins and centralized members can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    public.get_effective_user_role() IN ('admin', 'centralized_member')
    AND public.get_effective_user_role() IS NOT NULL
  );

-- Policy 2: Property managers see ONLY their assigned properties
-- Uses get_effective_user_id() to respect impersonation
CREATE POLICY "Property managers can view assigned properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    public.get_effective_user_role() = 'property_manager'
    AND public.get_effective_user_role() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM property_managers pm
      WHERE pm.property_id = properties.id
      AND pm.user_id = public.get_effective_user_id()
    )
  );

-- Note: Admin-only policies (INSERT, UPDATE, DELETE) should still use auth.uid()
-- because only actual admins should be able to modify data, not impersonated users

-- ============================================================
-- ENROLLMENTS TABLE RLS POLICIES
-- ============================================================

-- Drop ALL existing enrollment SELECT policies to avoid conflicts
-- This includes any from optimize-rls.sql or other scripts
-- IMPORTANT: This must drop ALL policies, including ones using auth.user_role()
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- First, get all policy names
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'enrollments' 
        AND schemaname = 'public'
        AND cmd = 'SELECT'
    ) 
    LOOP
        -- Drop each policy
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.enrollments';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
    
    -- Also explicitly drop known policies that might exist
    DROP POLICY IF EXISTS "Admins and centralized members can view all enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "Property managers can view their property enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "Property managers can view their property enrollments" ON enrollments;
END $$;

-- Policy 1: Admins and centralized members see ALL enrollments
-- Uses get_effective_user_role() to respect impersonation
CREATE POLICY "Admins and centralized members can view all enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    public.get_effective_user_role() IN ('admin', 'centralized_member')
    AND public.get_effective_user_role() IS NOT NULL
  );

-- Policy 2: Property managers see ONLY enrollments for their assigned properties
-- Uses get_effective_user_id() to respect impersonation
CREATE POLICY "Property managers can view their property enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    public.get_effective_user_role() = 'property_manager'
    AND public.get_effective_user_role() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM property_managers pm
      WHERE pm.property_id = enrollments.property_id
      AND pm.user_id = public.get_effective_user_id()
    )
  );

-- ============================================================
-- FIX: Ensure _impersonation_context table is accessible
-- ============================================================

-- Make sure the table doesn't have RLS blocking access
ALTER TABLE IF EXISTS public._impersonation_context DISABLE ROW LEVEL SECURITY;

-- Grant SELECT access to authenticated users (needed for RLS functions)
GRANT SELECT ON public._impersonation_context TO authenticated;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Show updated policies and their USING clauses
SELECT 
  'Properties Policies' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'properties' 
AND schemaname = 'public'
AND cmd = 'SELECT'
ORDER BY policyname;

SELECT 
  'Enrollments Policies' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'enrollments' 
AND schemaname = 'public'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Verify the policies use get_effective_user functions
SELECT 
  'Policy Check' as check_type,
  CASE 
    WHEN qual::text LIKE '%get_effective_user_role%' THEN '✅ Uses effective role'
    WHEN qual::text LIKE '%get_effective_user_id%' THEN '✅ Uses effective ID'
    WHEN qual::text LIKE '%auth.uid()%' AND qual::text NOT LIKE '%get_effective%' THEN '❌ Uses auth.uid() (old)'
    ELSE '⚠️ Unknown'
  END as status,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename IN ('properties', 'enrollments')
AND schemaname = 'public'
AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- Test query to verify the policies work
-- This should show the effective user role and ID when impersonating
SELECT 
  'Impersonation Test' as test_name,
  auth.uid()::text as actual_user_id,
  public.get_effective_user_id()::text as effective_user_id,
  public.get_effective_user_role() as effective_role;

-- Diagnostic: Check what enrollment count would be returned
-- NOTE: This will return null in SQL editor because there's no impersonation cookie
-- To test properly, you need to check the app logs or add logging in the dashboard
-- 
-- To verify policies are updated, check the policy_condition column below
-- It should contain 'get_effective_user_role' or 'get_effective_user_id'

