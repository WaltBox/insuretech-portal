-- Add metadata column to invitations table to store first_name, last_name, and property_ids
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Make property_id nullable since not all invitations are for property managers
ALTER TABLE invitations ALTER COLUMN property_id DROP NOT NULL;




