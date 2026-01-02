-- Quick diagnostic: What are the RLS policies actually doing?
-- Run this while impersonating a PM

-- 1. What does get_effective_user_role() return?
SELECT 
  'Effective Role' as check,
  public.get_effective_user_role() as value;

-- 2. Does Policy 1 match? (Should be FALSE for PM)
SELECT 
  'Policy 1 Matches?' as check,
  public.get_effective_user_role() IN ('admin', 'centralized_member') as value,
  CASE 
    WHEN public.get_effective_user_role() IN ('admin', 'centralized_member') THEN '❌ PROBLEM: Policy 1 is matching!'
    ELSE '✅ Policy 1 correctly NOT matching'
  END as status;

-- 3. What's the PM's email?
SELECT 
  'PM Email' as check,
  public.get_effective_user_email() as value;

-- 4. How many claims have filed_by_email matching the PM?
SELECT 
  'Claims matching PM email' as check,
  COUNT(*) as count
FROM public.claims
WHERE filed_by_email IS NOT NULL
  AND TRIM(filed_by_email) != ''
  AND LOWER(TRIM(filed_by_email)) = LOWER(TRIM(public.get_effective_user_email()));

-- 5. How many claims are visible? (This respects RLS)
SELECT 
  'Total visible claims (RLS applied)' as check,
  COUNT(*) as count
FROM public.claims;

-- 6. Show sample of visible claims with their filed_by_email
SELECT 
  'Sample visible claims' as check,
  claim_number,
  filed_by_email,
  public.get_effective_user_email() as pm_email,
  CASE 
    WHEN filed_by_email IS NULL THEN 'NULL'
    WHEN TRIM(filed_by_email) = '' THEN 'EMPTY'
    WHEN LOWER(TRIM(filed_by_email)) = LOWER(TRIM(public.get_effective_user_email())) THEN '✅ MATCHES'
    ELSE '❌ NO MATCH'
  END as match_status
FROM public.claims
ORDER BY submitted_date DESC
LIMIT 10;



