-- Clear all data except admin user
-- Run this in Supabase SQL Editor
-- 
-- This script preserves the admin user:
-- id: 746157db-dc9d-4634-92a1-4c5b554ac10c
-- email: walt@beagleforpm.com

-- First, delete all data from child tables
-- (Order matters due to foreign key constraints)

-- Delete support messages (references support_tickets)
DELETE FROM support_messages;

-- Delete support tickets (references users)
DELETE FROM support_tickets;

-- Delete claims (references properties)
DELETE FROM claims;

-- Delete enrollments (references properties)
DELETE FROM enrollments;

-- Delete property_managers (references properties and users)
DELETE FROM property_managers;

-- Delete invitations (references users)
DELETE FROM invitations;

-- Delete properties (references users via created_by)
DELETE FROM properties;

-- Finally, delete all users except the admin user
DELETE FROM users 
WHERE id != '746157db-dc9d-4634-92a1-4c5b554ac10c';

-- Ensure the admin user has the correct data
-- (This will update if exists, or insert if it doesn't - though it should exist)
INSERT INTO users (id, email, role, first_name, last_name, created_at, updated_at, phone)
VALUES (
  '746157db-dc9d-4634-92a1-4c5b554ac10c',
  'walt@beagleforpm.com',
  'admin',
  'Walt',
  'Boxwell',
  '2025-12-22 22:47:42.373113+00',
  '2025-12-22 22:47:42.373113+00',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone;
  -- Note: created_at is preserved, updated_at will be set to current time by trigger

-- Verify the admin user exists with correct data
SELECT id, email, role, first_name, last_name, created_at, updated_at, phone 
FROM users 
WHERE id = '746157db-dc9d-4634-92a1-4c5b554ac10c';

