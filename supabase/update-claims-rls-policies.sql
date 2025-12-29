-- Update Claims RLS Policies for new access rules
-- 
-- Rules:
-- 1. Centralized Members: Can view ALL claims
-- 2. Property Managers: Can ONLY view claims where filed_by_email matches their email
--    (filed_by_email is the email of the PM or CM who filed the claim from the Beagle API)

-- Ensure RLS is enabled on claims table
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Admins and centralized members can view all claims" ON claims;
DROP POLICY IF EXISTS "Property managers can view their property claims" ON claims;
DROP POLICY IF EXISTS "Property managers can view their claims" ON claims;
DROP POLICY IF EXISTS "Property managers can view claims matching their email" ON claims;
DROP POLICY IF EXISTS "Property managers can view claims they filed" ON claims;
DROP POLICY IF EXISTS "Admins can manage claims" ON claims;

-- Policy 1: Admins and Centralized Members see ALL claims
CREATE POLICY "Admins and centralized members can view all claims"
  ON claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'centralized_member')
    )
  );

-- Policy 2: Property Managers see ONLY claims where filed_by_email matches their email
-- This is the email of the PM/CM who filed the claim (fetched from Beagle API)
-- If filed_by_email is NULL or doesn't match, Property Managers see NOTHING
CREATE POLICY "Property managers can view claims they filed"
  ON claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'property_manager'
      AND claims.filed_by_email IS NOT NULL
      AND LOWER(TRIM(claims.filed_by_email)) = LOWER(TRIM(u.email))
    )
  );

-- Policy 3: Admins can manage (INSERT, UPDATE, DELETE) all claims
CREATE POLICY "Admins can manage claims"
  ON claims FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'claims'
ORDER BY policyname;

