-- Clear existing claims first
DELETE FROM claims;

-- Insert fake claims data for testing
-- Property Managers will see claims based on their assigned properties (via property_managers table)
-- Centralized Members will see ALL claims (regardless of property)

-- Claims for Cool Company property (Dallas, TX)
-- If waltboxwell@gmail.com is assigned as property manager to Cool Company, they'll see these claims
INSERT INTO claims (
  property_id,
  claim_number,
  claim_type,
  status,
  submitted_date,
  amount,
  participant_role,
  participant_first_name,
  participant_last_name,
  participant_email,
  participant_phone,
  participant_address,
  raw_data
) VALUES 
(
  (SELECT id FROM properties WHERE name = 'Cool Company' LIMIT 1),
  'CLM-2025-001',
  'Water Damage',
  'Under Review',
  '2025-12-15',
  2500.00,
  'Tenant',
  'Sarah',
  'Johnson',
  'sarah.johnson@tenant.com',
  '555-123-4567',
  '123 Cool Street, Unit 5A, Dallas, TX 75201',
  '{"incident_date": "2025-12-10", "description": "Burst pipe in kitchen caused water damage to cabinets and flooring", "filed_by": "Tenant"}'::jsonb
),
(
  (SELECT id FROM properties WHERE name = 'Cool Company' LIMIT 1),
  'CLM-2025-002',
  'Theft',
  'Approved',
  '2025-12-18',
  1200.00,
  'Tenant',
  'Michael',
  'Chen',
  'michael.chen@tenant.com',
  '555-234-5678',
  '123 Cool Street, Unit 8B, Dallas, TX 75201',
  '{"incident_date": "2025-12-16", "description": "Laptop and electronics stolen during break-in", "police_report": "DPD-2025-12345", "filed_by": "Tenant"}'::jsonb
),
(
  (SELECT id FROM properties WHERE name = 'Cool Company' LIMIT 1),
  'CLM-2025-003',
  'Fire Damage',
  'Pending',
  '2025-12-20',
  5000.00,
  'Tenant',
  'Jessica',
  'Martinez',
  'jessica.martinez@tenant.com',
  '555-345-6789',
  '123 Cool Street, Unit 12C, Dallas, TX 75201',
  '{"incident_date": "2025-12-19", "description": "Kitchen fire damaged appliances and walls", "fire_dept_report": "DFD-2025-6789", "filed_by": "Tenant"}'::jsonb
);

-- Claims for Test Property (Amarillo, TX)
-- If waltboxwell@gmail.com is assigned as property manager to Test Property, they'll see these claims too
INSERT INTO claims (
  property_id,
  claim_number,
  claim_type,
  status,
  submitted_date,
  amount,
  participant_role,
  participant_first_name,
  participant_last_name,
  participant_email,
  participant_phone,
  participant_address,
  raw_data
) VALUES 
(
  (SELECT id FROM properties WHERE name = 'Test Property' LIMIT 1),
  'CLM-2025-004',
  'Property Damage',
  'Under Review',
  '2025-12-19',
  800.00,
  'Tenant',
  'Robert',
  'Williams',
  'robert.williams@tenant.com',
  '555-456-7890',
  '1234 Test City, Unit 3A, Amarillo, TX 79101',
  '{"incident_date": "2025-12-17", "description": "Hail damage to windows during storm", "filed_by": "Tenant"}'::jsonb
),
(
  (SELECT id FROM properties WHERE name = 'Test Property' LIMIT 1),
  'CLM-2025-005',
  'Liability',
  'Approved',
  '2025-12-21',
  3500.00,
  'Tenant',
  'Emily',
  'Davis',
  'emily.davis@tenant.com',
  '555-567-8901',
  '1234 Test City, Unit 7D, Amarillo, TX 79101',
  '{"incident_date": "2025-12-20", "description": "Guest injured slipping on icy stairs, medical expenses", "witness": "true", "filed_by": "Tenant"}'::jsonb
),
(
  (SELECT id FROM properties WHERE name = 'Test Property' LIMIT 1),
  'CLM-2025-006',
  'Appliance Malfunction',
  'Rejected',
  '2025-12-10',
  600.00,
  'Tenant',
  'David',
  'Brown',
  'david.brown@tenant.com',
  '555-678-9012',
  '1234 Test City, Unit 15B, Amarillo, TX 79101',
  '{"incident_date": "2025-12-08", "description": "Refrigerator stopped working, food spoilage", "rejection_reason": "Pre-existing condition not covered", "filed_by": "Tenant"}'::jsonb
);

-- Additional recent claims across both properties
INSERT INTO claims (
  property_id,
  claim_number,
  claim_type,
  status,
  submitted_date,
  amount,
  participant_role,
  participant_first_name,
  participant_last_name,
  participant_email,
  participant_phone,
  participant_address,
  raw_data
) VALUES 
(
  (SELECT id FROM properties WHERE name = 'Cool Company' LIMIT 1),
  'CLM-2025-007',
  'Medical',
  'Under Review',
  '2025-12-22',
  4200.00,
  'Tenant',
  'Amanda',
  'Taylor',
  'amanda.taylor@tenant.com',
  '555-789-0123',
  '123 Cool Street, Unit 20A, Dallas, TX 75201',
  '{"incident_date": "2025-12-21", "description": "Carbon monoxide exposure, emergency room visit", "medical_records": "attached", "filed_by": "Tenant"}'::jsonb
),
(
  (SELECT id FROM properties WHERE name = 'Test Property' LIMIT 1),
  'CLM-2025-008',
  'Vandalism',
  'Approved',
  '2025-12-14',
  1500.00,
  'Tenant',
  'James',
  'Anderson',
  'james.anderson@tenant.com',
  '555-890-1234',
  '1234 Test City, Unit 9C, Amarillo, TX 79101',
  '{"incident_date": "2025-12-12", "description": "Graffiti and damage to front door", "police_report": "APD-2025-4567", "filed_by": "Tenant"}'::jsonb
);

-- Print summary
SELECT 
  'Claims Created Successfully!' as message,
  COUNT(*) as total_claims,
  COUNT(DISTINCT property_id) as properties_with_claims
FROM claims;

