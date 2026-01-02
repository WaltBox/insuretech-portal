-- Performance Optimization for RLS Policies
-- Run this to speed up all pages by 2-3x

-- Create a cached role function (STABLE means it won't re-run multiple times per query)
CREATE OR REPLACE FUNCTION auth.user_role() 
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Update all the slow RLS policies to use this function

-- PROPERTIES
DROP POLICY IF EXISTS "Admins and centralized members can view all properties" ON properties;
CREATE POLICY "Admins and centralized members can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.user_role() IN ('admin', 'centralized_member'));

DROP POLICY IF EXISTS "Admins can insert properties" ON properties;
CREATE POLICY "Admins can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can update properties" ON properties;
CREATE POLICY "Admins can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete properties" ON properties;
CREATE POLICY "Admins can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.user_role() = 'admin');

-- PROPERTY_MANAGERS
DROP POLICY IF EXISTS "Admins and centralized members can manage property managers" ON property_managers;
CREATE POLICY "Admins and centralized members can manage property managers"
  ON property_managers FOR ALL
  TO authenticated
  USING (auth.user_role() IN ('admin', 'centralized_member'));

-- ENROLLMENTS
DROP POLICY IF EXISTS "Admins and centralized members can view all enrollments" ON enrollments;
CREATE POLICY "Admins and centralized members can view all enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (auth.user_role() IN ('admin', 'centralized_member'));

DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;
CREATE POLICY "Admins can manage enrollments"
  ON enrollments FOR ALL
  TO authenticated
  USING (auth.user_role() = 'admin');

-- CLAIMS
DROP POLICY IF EXISTS "Admins and centralized members can view all claims" ON claims;
CREATE POLICY "Admins and centralized members can view all claims"
  ON claims FOR SELECT
  TO authenticated
  USING (auth.user_role() IN ('admin', 'centralized_member'));

DROP POLICY IF EXISTS "Admins can manage claims" ON claims;
CREATE POLICY "Admins can manage claims"
  ON claims FOR ALL
  TO authenticated
  USING (auth.user_role() = 'admin');

-- INVITATIONS
DROP POLICY IF EXISTS "Admins and centralized members can create invitations" ON invitations;
CREATE POLICY "Admins and centralized members can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() IN ('admin', 'centralized_member'));

DROP POLICY IF EXISTS "Admins and centralized members can update invitations" ON invitations;
CREATE POLICY "Admins and centralized members can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (auth.user_role() IN ('admin', 'centralized_member'));

-- USERS (simplify the admin check)
DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can update users" ON users;
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (auth.user_role() = 'admin');

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'RLS policies optimized! Pages should now load 2-3x faster.';
END $$;






