-- View Your Current RLS Policies
-- This shows all policies for the tables you have RLS enabled on

-- ============================================================
-- ALL POLICIES: Complete List with Details
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual::text LIKE '%get_effective_user_role%' THEN '✅ Impersonation-aware'
    WHEN qual::text LIKE '%get_effective_user_id%' THEN '✅ Impersonation-aware'
    WHEN qual::text LIKE '%auth.user_role%' THEN '⚡ Optimized'
    WHEN qual::text LIKE '%auth.uid()%' THEN '🔒 Standard'
    WHEN qual::text = 'true' THEN '🌐 Public'
    ELSE '📋 Custom'
  END as policy_type,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('claims', 'enrollments', 'invitations', 'properties', 'property_managers', 'support_messages', 'support_tickets', 'users')
ORDER BY tablename, 
  CASE cmd 
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    WHEN 'ALL' THEN 5
  END,
  policyname;

-- ============================================================
-- SUMMARY BY TABLE: Quick Overview
-- ============================================================
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
  COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies,
  COUNT(*) FILTER (WHERE qual::text LIKE '%get_effective%') as impersonation_aware
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('claims', 'enrollments', 'invitations', 'properties', 'property_managers', 'support_messages', 'support_tickets', 'users')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================
-- POLICIES BY TABLE: Detailed Breakdown
-- ============================================================

-- CLAIMS (3 policies)
SELECT 
  'claims' as table_name,
  policyname,
  cmd as operation,
  LEFT(qual::text, 150) as condition
FROM pg_policies 
WHERE tablename = 'claims' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- ENROLLMENTS (3 policies)
SELECT 
  'enrollments' as table_name,
  policyname,
  cmd as operation,
  LEFT(qual::text, 150) as condition
FROM pg_policies 
WHERE tablename = 'enrollments' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- INVITATIONS (3 policies)
SELECT 
  'invitations' as table_name,
  policyname,
  cmd as operation,
  LEFT(qual::text, 150) as condition
FROM pg_policies 
WHERE tablename = 'invitations' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- PROPERTIES (5 policies)
SELECT 
  'properties' as table_name,
  policyname,
  cmd as operation,
  LEFT(qual::text, 150) as condition
FROM pg_policies 
WHERE tablename = 'properties' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- PROPERTY_MANAGERS (2 policies)
SELECT 
  'property_managers' as table_name,
  policyname,
  cmd as operation,
  LEFT(qual::text, 150) as condition
FROM pg_policies 
WHERE tablename = 'property_managers' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- SUPPORT_MESSAGES (4 policies)
SELECT 
  'support_messages' as table_name,
  policyname,
  cmd as operation,
  LEFT(qual::text, 150) as condition
FROM pg_policies 
WHERE tablename = 'support_messages' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- SUPPORT_TICKETS (4 policies)
SELECT 
  'support_tickets' as table_name,
  policyname,
  cmd as operation,
  LEFT(qual::text, 150) as condition
FROM pg_policies 
WHERE tablename = 'support_tickets' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- USERS (4 policies)
SELECT 
  'users' as table_name,
  policyname,
  cmd as operation,
  LEFT(qual::text, 150) as condition
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY cmd, policyname;

