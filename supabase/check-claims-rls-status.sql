-- Diagnostic script to check Claims RLS status
-- Run this to see what's currently configured

-- 1. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'claims';

-- 2. List all current policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'claims' 
AND schemaname = 'public'
ORDER BY policyname;

-- 3. Check if filed_by_email column exists and has data
SELECT 
  COUNT(*) as total_claims,
  COUNT(filed_by_email) as claims_with_filed_by_email,
  COUNT(*) - COUNT(filed_by_email) as claims_without_filed_by_email
FROM claims;

-- 4. Show sample of claims with filed_by_email
SELECT 
  id,
  claim_number,
  filed_by_email,
  participant_email,
  property_id
FROM claims
LIMIT 10;


