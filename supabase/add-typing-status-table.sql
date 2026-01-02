-- Add typing status table for support tickets
-- This stores typing indicators so they persist across server restarts

CREATE TABLE IF NOT EXISTS support_typing_status (
  ticket_id UUID PRIMARY KEY REFERENCES support_tickets(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_support_typing_status_updated_at ON support_typing_status(updated_at);

-- Function to automatically clean up old typing status (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_status()
RETURNS void AS $$
BEGIN
  DELETE FROM support_typing_status
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE support_typing_status ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read typing status for tickets they have access to
CREATE POLICY "Users can view typing status for their tickets"
  ON support_typing_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = ticket_id
      AND (
        st.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      )
    )
  );

-- Allow admins to update typing status
CREATE POLICY "Admins can update typing status"
  ON support_typing_status FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );


