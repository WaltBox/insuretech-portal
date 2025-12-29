-- Test script to verify impersonation RLS is working
-- Run this while impersonating a Property Manager

-- 1. Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_effective_user_id',
    'get_effective_user_role',
    'get_effective_user_email',
    'set_impersonation_context',
    'clear_impersonation_context'
  )
ORDER BY routine_name;

-- 2. Check current impersonation context (as admin, you should see your entry)
SELECT 
  admin_user_id,
  impersonated_user_id,
  expires_at,
  NOW() as current_time,
  expires_at > NOW() as is_active
FROM public._impersonation_context;

-- 3. Test get_effective_user_id() - should return impersonated user ID if impersonating
SELECT 
  auth.uid() as actual_user_id,
  public.get_effective_user_id() as effective_user_id,
  public.get_effective_user_role() as effective_role,
  public.get_effective_user_email() as effective_email;

-- 4. Test what claims would be visible (this simulates what RLS sees)
-- This should show 0 claims if impersonating a PM with no matching filed_by_email
SELECT 
  COUNT(*) as visible_claims_count,
  COUNT(CASE WHEN filed_by_email IS NOT NULL THEN 1 END) as claims_with_filed_by_email,
  COUNT(CASE WHEN LOWER(TRIM(filed_by_email)) = LOWER(TRIM(public.get_effective_user_email())) THEN 1 END) as matching_claims
FROM claims
WHERE (
  -- Policy 1: Admin/CM see all
  public.get_effective_user_role() IN ('admin', 'centralized_member')
  OR
  -- Policy 2: PM see only matching
  (
    public.get_effective_user_role() = 'property_manager'
    AND filed_by_email IS NOT NULL
    AND TRIM(filed_by_email) != ''
    AND LOWER(TRIM(filed_by_email)) = LOWER(TRIM(public.get_effective_user_email()))
  )
);

