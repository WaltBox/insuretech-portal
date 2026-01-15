-- Test query to see what TLL coverage_name values exist
-- Run this to diagnose why TLL count is showing 1000 instead of 1211

-- Show all distinct coverage_name values and their counts
SELECT 
  coverage_name,
  COUNT(*) as count,
  CASE 
    WHEN UPPER(TRIM(coverage_name)) = 'TLL' THEN '✅ Should be counted as TLL'
    WHEN coverage_name ILIKE '%TLL%' THEN '⚠️ Contains TLL but not exact match'
    ELSE '❌ Not TLL'
  END as status
FROM enrollments
WHERE coverage_name IS NOT NULL
GROUP BY coverage_name
ORDER BY count DESC;

-- Count TLL with case-insensitive matching (what the query should use)
SELECT 
  'TLL Count (case-insensitive, trimmed)' as metric,
  COUNT(*) as count
FROM enrollments
WHERE UPPER(TRIM(coverage_name)) = 'TLL';

-- Count exact 'TLL' (what current query matches)
SELECT 
  'TLL Count (exact match only)' as metric,
  COUNT(*) as count
FROM enrollments
WHERE coverage_name = 'TLL' OR coverage_name = 'tll';

-- Show the difference
SELECT 
  (SELECT COUNT(*) FROM enrollments WHERE UPPER(TRIM(coverage_name)) = 'TLL') as should_be_count,
  (SELECT COUNT(*) FROM enrollments WHERE coverage_name = 'TLL' OR coverage_name = 'tll') as current_count,
  (SELECT COUNT(*) FROM enrollments WHERE UPPER(TRIM(coverage_name)) = 'TLL') - 
  (SELECT COUNT(*) FROM enrollments WHERE coverage_name = 'TLL' OR coverage_name = 'tll') as missing_count;

