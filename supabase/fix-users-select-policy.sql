-- Fix Users Table SELECT Policy
-- The current policy allows ALL authenticated users to see ALL users
-- This restores the proper restrictive policies: Admins see all, users see themselves

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "All authenticated users can view users" ON users;

-- Create proper restrictive policies
-- Policy 1: Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 2: Users can view themselves
CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Verify the policies
SELECT 
  policyname,
  cmd as operation,
  qual as condition
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Test: This should show 2 SELECT policies now
-- Expected result:
-- 1. "Admins can view all users" - with admin check
-- 2. "Users can view themselves" - with id = auth.uid() check


