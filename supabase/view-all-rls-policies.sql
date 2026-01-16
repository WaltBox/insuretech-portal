-- View ALL RLS Policies in the Database
-- Run this in your Supabase SQL editor to see all active RLS policies

-- ============================================================
-- OVERVIEW: All Tables with RLS Enabled
-- ============================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- ============================================================
-- ALL POLICIES: Complete List
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as operation, -- SELECT, INSERT, UPDATE, DELETE, or ALL
  permissive, -- PERMISSIVE or RESTRICTIVE
  roles, -- Who the policy applies to (usually authenticated)
  qual as using_expression, -- The condition that filters rows
  with_check as with_check_expression -- The condition for INSERT/UPDATE
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ============================================================
-- POLICIES BY TABLE: Detailed View
-- ============================================================

-- USERS TABLE
SELECT 
  'users' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- PROPERTIES TABLE
SELECT 
  'properties' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'properties' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- ENROLLMENTS TABLE
SELECT 
  'enrollments' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'enrollments' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- CLAIMS TABLE
SELECT 
  'claims' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'claims' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- PROPERTY_MANAGERS TABLE
SELECT 
  'property_managers' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'property_managers' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- INVITATIONS TABLE
SELECT 
  'invitations' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'invitations' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- SUPPORT_TICKETS TABLE (if exists)
SELECT 
  'support_tickets' as table_name,
  policyname,
  cmd,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'support_tickets' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- ============================================================
-- CHECK FOR IMPERSONATION-AWARE POLICIES
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual::text LIKE '%get_effective_user_role%' THEN '✅ Uses effective role (impersonation-aware)'
    WHEN qual::text LIKE '%get_effective_user_id%' THEN '✅ Uses effective ID (impersonation-aware)'
    WHEN qual::text LIKE '%auth.user_role%' THEN '⚠️ Uses cached role function'
    WHEN qual::text LIKE '%auth.uid()%' THEN '⚠️ Uses auth.uid() directly'
    ELSE '❓ Unknown pattern'
  END as policy_type,
  qual as policy_condition
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('properties', 'enrollments', 'claims', 'users', 'property_managers', 'invitations')
ORDER BY tablename, cmd, policyname;


