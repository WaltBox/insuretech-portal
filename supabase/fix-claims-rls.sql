-- Fix Claims RLS Policies for Property Managers
-- Run this to ensure property managers only see their assigned property claims

-- First, let's check current property manager assignments
SELECT 
  u.email,
  u.role,
  p.name as property_name,
  pm.property_id
FROM property_managers pm
JOIN users u ON u.id = pm.user_id
JOIN properties p ON p.id = pm.property_id
WHERE u.role = 'property_manager';

-- Drop and recreate the claims policies with better logic
DROP POLICY IF EXISTS "Property managers can view their property claims" ON claims;
DROP POLICY IF EXISTS "Admins and centralized members can view all claims" ON claims;

-- Recreate with proper ordering and logic
-- Policy 1: Admins and centralized members see ALL claims
CREATE POLICY "Admins and centralized members can view all claims"
  ON claims FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'centralized_member')
  );

-- Policy 2: Property managers see ONLY their assigned property claims
CREATE POLICY "Property managers can view their property claims"
  ON claims FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'property_manager'
    AND EXISTS (
      SELECT 1 
      FROM property_managers pm
      WHERE pm.user_id = auth.uid()
        AND pm.property_id = claims.property_id
    )
  );

-- Verify the policies are created
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













