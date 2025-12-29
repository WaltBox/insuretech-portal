-- Check what the RLS policies actually say
-- This will show if they're using get_effective_user_role() or old logic

SELECT 
  policyname,
  cmd,
  -- Show the USING clause (this is what filters rows)
  qual as policy_condition,
  -- Check if it uses get_effective_user_role
  CASE 
    WHEN qual::text LIKE '%get_effective_user_role%' THEN '✅ Uses effective role'
    WHEN qual::text LIKE '%auth.uid()%' THEN '❌ Uses auth.uid() directly (WRONG)'
    WHEN qual::text LIKE '%get_user_role%' THEN '⚠️ Uses old get_user_role() function'
    ELSE '⚠️ Unknown pattern'
  END as uses_correct_function
FROM pg_policies 
WHERE tablename = 'claims' 
AND schemaname = 'public'
ORDER BY policyname;

