-- Create functions to get accurate counts (bypasses any query limits)
-- These functions will return the exact count regardless of Supabase limits

CREATE OR REPLACE FUNCTION get_tll_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM enrollments
  WHERE UPPER(coverage_name) = 'TLL';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_sdi_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM enrollments
  WHERE UPPER(coverage_name) = 'SDI';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_tll_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_sdi_count() TO authenticated;

