-- Fix Support Tickets RLS Policy
-- This ensures authenticated users can create their own support tickets

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create own tickets" ON support_tickets;

-- Recreate with a more permissive check
-- Allow any authenticated user to create a ticket where user_id matches their auth.uid()
CREATE POLICY "Users can create own tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Also ensure the SELECT policy works correctly
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'support_tickets'
ORDER BY policyname;








