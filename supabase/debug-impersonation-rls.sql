-- Debug script to test impersonation RLS
-- Run this while impersonating a PM to see what's happening

-- 1. Check current auth context
SELECT 
  'Current auth.uid()' as check_type,
  auth.uid()::text as value;

-- 2. Check impersonation context table
SELECT 
  'Impersonation Context' as check_type,
  admin_user_id::text as admin_id,
  impersonated_user_id::text as impersonated_id,
  expires_at::text as expires
FROM public._impersonation_context
WHERE expires_at > NOW();

-- 3. Test effective user functions
SELECT 
  'Effective User ID' as check_type,
  public.get_effective_user_id()::text as value;

SELECT 
  'Effective User Role' as check_type,
  public.get_effective_user_role() as value;

SELECT 
  'Effective User Email' as check_type,
  public.get_effective_user_email() as value;

-- 4. Check what claims the PM should see (based on their email)
SELECT 
  'PM Email Claims' as check_type,
  COUNT(*) as claim_count
FROM public.claims
WHERE filed_by_email IS NOT NULL
  AND TRIM(filed_by_email) != ''
  AND LOWER(TRIM(filed_by_email)) = LOWER(TRIM(public.get_effective_user_email()));

-- 5. Check what claims are actually visible (what RLS allows)
SELECT 
  'Visible Claims Count' as check_type,
  COUNT(*) as claim_count
FROM public.claims;

-- 6. Show sample of visible claims with filed_by_email
SELECT 
  'Sample Visible Claims' as check_type,
  id,
  claim_id,
  filed_by_email,
  property_id
FROM public.claims
LIMIT 10;

-- 7. Check if RLS is enabled
SELECT 
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'claims';

-- 8. List all RLS policies
SELECT 
  'RLS Policies' as check_type,
  policyname,
  cmd,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'claims' 
AND schemaname = 'public';










