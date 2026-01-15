-- Verify Enrollments RLS Policies for Centralized Members
-- This checks if centralized members can see all enrollments

-- Check current enrollments policies
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'enrollments' 
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Check if get_effective_user_role function exists
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname IN ('get_effective_user_role', 'get_effective_user_id')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test: What would a centralized member see?
-- (This will show the policy conditions, not actual data)
SELECT 
  'Policy Check' as test_type,
  CASE 
    WHEN qual::text LIKE '%get_effective_user_role%' AND qual::text LIKE '%centralized_member%' THEN '✅ Should allow centralized members'
    WHEN qual::text LIKE '%auth.user_role%' AND qual::text LIKE '%centralized_member%' THEN '✅ Should allow centralized members (optimized)'
    WHEN qual::text LIKE '%EXISTS%' AND qual::text LIKE '%centralized_member%' THEN '✅ Should allow centralized members (standard)'
    ELSE '❌ May not allow centralized members'
  END as centralized_member_access,
  policyname,
  qual as condition
FROM pg_policies 
WHERE tablename = 'enrollments' 
  AND schemaname = 'public'
  AND cmd = 'SELECT';

