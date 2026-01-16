-- Delete all enrollments from the database
-- WARNING: This will permanently delete ALL enrollments from ALL properties

DELETE FROM enrollments;

-- Verify deletion
SELECT COUNT(*) as remaining_enrollments FROM enrollments;









