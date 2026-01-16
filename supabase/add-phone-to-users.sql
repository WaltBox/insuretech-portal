-- Add phone number column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for phone lookups (optional but helpful)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;










