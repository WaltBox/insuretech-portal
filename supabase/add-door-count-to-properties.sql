-- Add door_count column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS door_count INTEGER;

-- Add index for door_count if needed for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_properties_door_count ON properties(door_count) WHERE door_count IS NOT NULL;

