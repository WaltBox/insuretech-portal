-- Direct test of TLL count query
-- This mimics what the dashboard query does

-- Count TLL enrollments (exact match)
SELECT 
  'TLL Count (exact match)' as query_type,
  COUNT(*) as count
FROM enrollments
WHERE coverage_name = 'TLL';

-- Compare with total enrollments
SELECT 
  'Total Enrollments' as metric,
  COUNT(*) as count
FROM enrollments;

-- Count SDI for comparison
SELECT 
  'SDI Count (exact match)' as query_type,
  COUNT(*) as count
FROM enrollments
WHERE coverage_name = 'SDI';

-- Show breakdown by coverage_name
SELECT 
  coverage_name,
  COUNT(*) as count
FROM enrollments
WHERE coverage_name IS NOT NULL
GROUP BY coverage_name
ORDER BY count DESC;

