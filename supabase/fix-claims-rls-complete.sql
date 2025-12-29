-- Complete fix for Claims RLS Policies
-- This script will drop ALL existing policies and recreate them correctly

-- Step 1: Ensure RLS is enabled
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies dynamically
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'claims' 
        AND schemaname = 'public'
    ) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.claims';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 3: Create Policy 1 - Admins and Centralized Members see ALL claims
-- Uses get_effective_user_role() to respect impersonation
CREATE POLICY "Admins and centralized members can view all claims"
  ON public.claims FOR SELECT
  TO authenticated
  USING (
    public.get_effective_user_role() IN ('admin', 'centralized_member')
  );

-- Step 4: Create Policy 2 - Property Managers see ONLY claims where filed_by_email matches their email
-- CRITICAL RULES:
-- 1. If filed_by_email is NULL → Property Managers see NOTHING (claim is hidden from PMs)
-- 2. If filed_by_email doesn't match PM's email → Property Managers see NOTHING
-- 3. Only if filed_by_email exactly matches PM's email → Property Managers can see it
-- Centralized Members can see ALL claims (including NULL filed_by_email) via Policy 1
-- Uses get_effective_user_role() and get_effective_user_email() to respect impersonation
CREATE POLICY "Property managers can view claims they filed"
  ON public.claims FOR SELECT
  TO authenticated
  USING (
    public.get_effective_user_role() = 'property_manager'
    AND claims.filed_by_email IS NOT NULL  -- NULL = hidden from PMs
    AND TRIM(claims.filed_by_email) != ''  -- Empty string = hidden from PMs
    AND LOWER(TRIM(claims.filed_by_email)) = LOWER(TRIM(public.get_effective_user_email()))  -- Must match exactly
  );

-- Step 5: Create Policy 3 - Admins can manage all claims
-- Uses get_effective_user_role() to respect impersonation (but only actual admins can manage)
CREATE POLICY "Admins can manage claims"
  ON public.claims FOR ALL
  TO authenticated
  USING (
    -- Only actual admins (not impersonated users) can manage
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    -- Only actual admins (not impersonated users) can manage
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Step 6: Verify policies are created
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'claims' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 7: Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'claims';

