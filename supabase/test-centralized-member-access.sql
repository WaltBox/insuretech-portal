-- Test Centralized Member Access to Enrollments
-- Run this as a centralized member user to verify RLS is working

-- 1. Check what get_effective_user_role() returns for current user
SELECT 
  'Current User Role' as test,
  auth.uid()::text as user_id,
  public.get_effective_user_role() as effective_role,
  (SELECT role FROM users WHERE id = auth.uid()) as actual_role;

-- 2. Test if the policy condition evaluates correctly
SELECT 
  'Policy Condition Test' as test,
  public.get_effective_user_role() IN ('admin', 'centralized_member') as role_matches,
  public.get_effective_user_role() IS NOT NULL as role_not_null,
  (public.get_effective_user_role() IN ('admin', 'centralized_member') 
   AND public.get_effective_user_role() IS NOT NULL) as policy_allows_access;

-- 3. Try to count enrollments (this will use RLS)
SELECT 
  'Enrollment Count Test' as test,
  COUNT(*) as total_enrollments_visible,
  COUNT(*) FILTER (WHERE coverage_name = 'SDI') as sdi_count,
  COUNT(*) FILTER (WHERE coverage_name = 'TLL') as tll_count
FROM enrollments;

-- 4. Check if there are any enrollments at all
SELECT 
  'Total Enrollments in DB' as test,
  COUNT(*) as total_count
FROM enrollments;

-- 5. Verify the function exists and is accessible
SELECT 
  'Function Check' as test,
  proname as function_name,
  CASE 
    WHEN proname = 'get_effective_user_role' THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as status
FROM pg_proc 
WHERE proname = 'get_effective_user_role'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

