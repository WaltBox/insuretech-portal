-- Diagnose TLL Count Issue
-- This will show what coverage_name values exist and how many of each

-- 1. Count all enrollments
SELECT 
  'Total Enrollments' as metric,
  COUNT(*) as count
FROM enrollments;

-- 2. Count by exact coverage_name values
SELECT 
  coverage_name,
  COUNT(*) as count
FROM enrollments
WHERE coverage_name IS NOT NULL
GROUP BY coverage_name
ORDER BY count DESC;

-- 3. Count TLL variations (case-insensitive)
SELECT 
  'TLL (case-insensitive)' as metric,
  COUNT(*) as count
FROM enrollments
WHERE UPPER(TRIM(coverage_name)) = 'TLL';

-- 4. Show TLL variations with exact values
SELECT 
  coverage_name,
  COUNT(*) as count,
  'Exact value' as note
FROM enrollments
WHERE UPPER(TRIM(coverage_name)) = 'TLL'
GROUP BY coverage_name
ORDER BY coverage_name;

-- 5. Check for TLL with spaces or other variations
SELECT 
  coverage_name,
  COUNT(*) as count,
  LENGTH(coverage_name) as length,
  'Has spaces or variations' as note
FROM enrollments
WHERE coverage_name ILIKE '%TLL%'
  AND UPPER(TRIM(coverage_name)) != 'TLL'
GROUP BY coverage_name, LENGTH(coverage_name)
ORDER BY count DESC;

-- 6. Count SDI for comparison
SELECT 
  'SDI (case-insensitive)' as metric,
  COUNT(*) as count
FROM enrollments
WHERE UPPER(TRIM(coverage_name)) = 'SDI';

-- 7. Show all coverage_name values that contain TLL
SELECT 
  coverage_name,
  COUNT(*) as count
FROM enrollments
WHERE coverage_name ILIKE '%TLL%'
GROUP BY coverage_name
ORDER BY count DESC;

-- 8. Check for NULL or empty coverage_name
SELECT 
  CASE 
    WHEN coverage_name IS NULL THEN 'NULL'
    WHEN TRIM(coverage_name) = '' THEN 'EMPTY'
    ELSE 'HAS_VALUE'
  END as coverage_status,
  COUNT(*) as count
FROM enrollments
GROUP BY 
  CASE 
    WHEN coverage_name IS NULL THEN 'NULL'
    WHEN TRIM(coverage_name) = '' THEN 'EMPTY'
    ELSE 'HAS_VALUE'
  END;

