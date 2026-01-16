-- Add filed_by_email column to claims table to track who filed the claim
-- This will be used to determine access permissions

ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS filed_by_email TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_claims_filed_by_email ON claims(filed_by_email);

-- Add comment explaining the field
COMMENT ON COLUMN claims.filed_by_email IS 'Email of the Property Manager or Centralized Member who filed this claim';










