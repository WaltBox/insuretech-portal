-- Migrate participant_email to filed_by_email
-- The participant_email field actually contains the email of the PM/CM who filed the claim

UPDATE claims
SET filed_by_email = participant_email
WHERE participant_email IS NOT NULL
  AND filed_by_email IS NULL;

-- Verify the migration
SELECT 
  COUNT(*) as total_claims,
  COUNT(filed_by_email) as claims_with_filed_by_email,
  COUNT(participant_email) as claims_with_participant_email
FROM claims;

-- Show sample of updated claims
SELECT 
  id,
  claim_number,
  filed_by_email,
  participant_email,
  property_id
FROM claims
LIMIT 10;









