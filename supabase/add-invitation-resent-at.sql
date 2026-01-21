-- Add last_resent_at column to track when invitations were resent
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMP WITH TIME ZONE;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND column_name = 'last_resent_at';
