-- Test if RLS can see the impersonation context
-- Run this while impersonating a PM

-- First, manually set the context (simulating what the API does)
DO $$
DECLARE
  current_admin_id UUID;
  impersonated_id UUID;
BEGIN
  current_admin_id := auth.uid();
  
  -- Get the impersonated user ID from the context table
  SELECT impersonated_user_id INTO impersonated_id
  FROM public._impersonation_context
  WHERE admin_user_id = current_admin_id
    AND expires_at > NOW()
  LIMIT 1;
  
  RAISE NOTICE 'Admin ID: %', current_admin_id;
  RAISE NOTICE 'Impersonated ID: %', impersonated_id;
END $$;

-- Now test what the functions return
SELECT 
  'Function Test' as test,
  auth.uid()::text as actual_uid,
  public.get_effective_user_id()::text as effective_uid,
  public.get_effective_user_role() as effective_role,
  public.get_effective_user_email() as effective_email;

-- Test Policy 1 condition directly
SELECT 
  'Policy 1 Test' as test,
  public.get_effective_user_role() as role,
  public.get_effective_user_role() IN ('admin', 'centralized_member') as policy_1_matches,
  public.get_effective_user_role() IS NOT NULL as role_not_null;

-- Test what claims are visible (this will use RLS)
SELECT 
  'Visible Claims' as test,
  COUNT(*) as total_visible,
  COUNT(CASE WHEN filed_by_email IS NOT NULL AND TRIM(filed_by_email) != '' THEN 1 END) as with_filed_by_email,
  COUNT(CASE 
    WHEN filed_by_email IS NOT NULL 
    AND TRIM(filed_by_email) != '' 
    AND LOWER(TRIM(filed_by_email)) = LOWER(TRIM(public.get_effective_user_email()))
    THEN 1 
  END) as matching_pm_email
FROM public.claims;

-- Show which claims are visible and why
SELECT 
  claim_number,
  filed_by_email,
  public.get_effective_user_role() as effective_role,
  public.get_effective_user_email() as pm_email,
  -- Test Policy 1
  (public.get_effective_user_role() IN ('admin', 'centralized_member') 
   AND public.get_effective_user_role() IS NOT NULL) as policy_1_allows,
  -- Test Policy 2
  (public.get_effective_user_role() = 'property_manager'
   AND public.get_effective_user_role() IS NOT NULL
   AND public.get_effective_user_email() IS NOT NULL
   AND filed_by_email IS NOT NULL
   AND TRIM(filed_by_email) != ''
   AND LOWER(TRIM(filed_by_email)) = LOWER(TRIM(public.get_effective_user_email()))) as policy_2_allows
FROM public.claims
ORDER BY submitted_date DESC
LIMIT 10;









