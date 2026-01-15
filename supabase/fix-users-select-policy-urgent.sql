-- URGENT: Fix Users Table SELECT Policy
-- The current policy allows all authenticated users to see all users
-- But we need to ensure users can at least see themselves
-- This is critical for getCurrentUser() to work

-- First, check current policies
SELECT 
  policyname,
  cmd,
  qual as condition
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
  AND cmd = 'SELECT';

-- Drop all existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "All authenticated users can view users" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create a SECURITY DEFINER function to get user role without RLS recursion
-- This function runs with the privileges of the function creator, bypassing RLS
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role_safe() TO authenticated;

-- Ensure users can view themselves (CRITICAL for getCurrentUser to work)
-- This MUST be created first so users can query their own row
CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can view all users
-- Uses SECURITY DEFINER function to avoid infinite recursion
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (public.get_user_role_safe() = 'admin');

-- Verify the policies are created
SELECT 
  policyname,
  cmd,
  qual as condition
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
  AND cmd = 'SELECT'
ORDER BY policyname;

