-- Simple RLS Policy Viewer
-- Run this in Supabase SQL Editor to see all your policies

-- ============================================================
-- QUICK VIEW: All Policies by Table
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual::text LIKE '%get_effective_user_role%' THEN '✅ Impersonation-aware (uses effective role)'
    WHEN qual::text LIKE '%get_effective_user_id%' THEN '✅ Impersonation-aware (uses effective ID)'
    WHEN qual::text LIKE '%auth.user_role%' THEN '⚡ Optimized (uses cached role)'
    WHEN qual::text LIKE '%auth.uid()%' THEN '🔒 Standard (uses auth.uid)'
    WHEN qual::text = 'true' THEN '🌐 Public (no restrictions)'
    ELSE '📋 Custom condition'
  END as policy_type,
  LEFT(qual::text, 100) as condition_preview
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ============================================================
-- DETAILED VIEW: Full Policy Conditions
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd as operation,
  permissive,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ============================================================
-- SUMMARY: Tables with RLS Enabled
-- ============================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = 'public') as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;


