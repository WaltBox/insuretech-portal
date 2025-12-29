-- Test what the RLS policies are actually evaluating to
-- Run this while impersonating a PM to see what's happening

-- First, let's see what the effective functions return
SELECT 
  'Function Results' as test,
  auth.uid()::text as actual_uid,
  public.get_effective_user_id()::text as effective_uid,
  public.get_effective_user_role() as effective_role,
  public.get_effective_user_email() as effective_email;

-- Now let's manually test Policy 1's condition
SELECT 
  'Policy 1 Test (Admins/CMs)' as test,
  public.get_effective_user_role() IN ('admin', 'centralized_member') as should_see_all_claims,
  public.get_effective_user_role() as current_role;

-- Now let's manually test Policy 2's condition for a specific claim
SELECT 
  'Policy 2 Test (PMs)' as test,
  public.get_effective_user_role() = 'property_manager' as is_pm,
  public.get_effective_user_role() IS NOT NULL as role_not_null,
  public.get_effective_user_email() IS NOT NULL as email_not_null,
  public.get_effective_user_email() as pm_email;

-- Test Policy 2 condition on actual claims
SELECT 
  'Policy 2 on Claims' as test,
  c.id,
  c.claim_number,
  c.filed_by_email,
  public.get_effective_user_role() = 'property_manager' as is_pm,
  c.filed_by_email IS NOT NULL as filed_by_not_null,
  TRIM(c.filed_by_email) != '' as filed_by_not_empty,
  LOWER(TRIM(c.filed_by_email)) = LOWER(TRIM(public.get_effective_user_email())) as email_matches,
  -- Full Policy 2 condition
  (
    public.get_effective_user_role() = 'property_manager'
    AND public.get_effective_user_role() IS NOT NULL
    AND public.get_effective_user_email() IS NOT NULL
    AND c.filed_by_email IS NOT NULL
    AND TRIM(c.filed_by_email) != ''
    AND LOWER(TRIM(c.filed_by_email)) = LOWER(TRIM(public.get_effective_user_email()))
  ) as policy_2_allows
FROM public.claims c
LIMIT 10;

-- Check what claims are actually visible (this will respect RLS)
SELECT 
  'Visible Claims (RLS Applied)' as test,
  COUNT(*) as visible_count
FROM public.claims;

-- Check the impersonation context
SELECT 
  'Impersonation Context' as test,
  admin_user_id::text as admin_id,
  impersonated_user_id::text as impersonated_id,
  expires_at > NOW() as is_active
FROM public._impersonation_context;

