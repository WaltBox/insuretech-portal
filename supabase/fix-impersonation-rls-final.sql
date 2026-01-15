-- Final fix for impersonation RLS
-- This ensures the context is set correctly and the functions work properly

-- Step 1: Ensure the table exists with correct schema
DROP TABLE IF EXISTS public._impersonation_context CASCADE;

CREATE TABLE IF NOT EXISTS public._impersonation_context (
  admin_user_id UUID PRIMARY KEY, -- Keyed by admin user ID
  impersonated_user_id UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_impersonation_context_admin ON public._impersonation_context(admin_user_id, expires_at);

-- Step 2: Recreate set_impersonation_context with better error handling
CREATE OR REPLACE FUNCTION public.set_impersonation_context(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id UUID;
BEGIN
  current_admin_id := auth.uid();
  IF current_admin_id IS NULL THEN
    RAISE EXCEPTION 'Cannot set impersonation context: no authenticated user.';
  END IF;

  -- Verify the user_id exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'Cannot set impersonation context: user % does not exist.', user_id;
  END IF;

  INSERT INTO public._impersonation_context (admin_user_id, impersonated_user_id, expires_at)
  VALUES (current_admin_id, user_id, NOW() + INTERVAL '5 minutes')
  ON CONFLICT (admin_user_id)
  DO UPDATE SET
    impersonated_user_id = EXCLUDED.impersonated_user_id,
    expires_at = EXCLUDED.expires_at;
END;
$$;

-- Step 3: Recreate get_effective_user_id with table alias to avoid ambiguity
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id UUID;
  result_user_id UUID;
BEGIN
  current_admin_id := auth.uid();
  IF current_admin_id IS NULL THEN
    RETURN NULL; -- No authenticated user
  END IF;

  SELECT ic.impersonated_user_id INTO result_user_id
  FROM public._impersonation_context ic
  WHERE ic.admin_user_id = current_admin_id
    AND ic.expires_at > NOW()
  LIMIT 1;

  IF result_user_id IS NOT NULL THEN
    RETURN result_user_id;
  ELSE
    RETURN current_admin_id;
  END IF;
END;
$$;

-- Step 4: Recreate get_effective_user_role with NULL handling
CREATE OR REPLACE FUNCTION public.get_effective_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  effective_id UUID;
  user_role TEXT;
BEGIN
  effective_id := public.get_effective_user_id();
  
  IF effective_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT role INTO user_role
  FROM public.users
  WHERE id = effective_id;
  
  RETURN user_role;
END;
$$;

-- Step 5: Recreate get_effective_user_email with NULL handling
CREATE OR REPLACE FUNCTION public.get_effective_user_email()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  effective_id UUID;
  user_email TEXT;
BEGIN
  effective_id := public.get_effective_user_id();
  
  IF effective_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT email INTO user_email
  FROM public.users
  WHERE id = effective_id;
  
  RETURN user_email;
END;
$$;

-- Step 6: Recreate clear_impersonation_context
CREATE OR REPLACE FUNCTION public.clear_impersonation_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id UUID;
BEGIN
  current_admin_id := auth.uid();
  IF current_admin_id IS NULL THEN
    RETURN; -- No authenticated user, nothing to clear
  END IF;

  DELETE FROM public._impersonation_context
  WHERE admin_user_id = current_admin_id;
END;
$$;

-- Step 7: Drop and recreate RLS policies with explicit checks
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'claims' 
        AND schemaname = 'public'
    ) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.claims';
    END LOOP;
END $$;

-- Policy 1: Admins and Centralized Members see ALL claims
-- This policy ONLY matches if the effective role is admin or centralized_member
CREATE POLICY "Admins and centralized members can view all claims"
  ON public.claims FOR SELECT
  TO authenticated
  USING (
    public.get_effective_user_role() IN ('admin', 'centralized_member')
    AND public.get_effective_user_role() IS NOT NULL
  );

-- Policy 2: Property Managers see ONLY claims where filed_by_email matches their email
-- This policy ONLY matches if:
-- 1. The effective role is property_manager
-- 2. filed_by_email is NOT NULL and NOT empty
-- 3. filed_by_email matches the effective user's email (case-insensitive)
CREATE POLICY "Property managers can view claims they filed"
  ON public.claims FOR SELECT
  TO authenticated
  USING (
    public.get_effective_user_role() = 'property_manager'
    AND public.get_effective_user_role() IS NOT NULL
    AND public.get_effective_user_email() IS NOT NULL
    AND claims.filed_by_email IS NOT NULL
    AND TRIM(claims.filed_by_email) != ''
    AND LOWER(TRIM(claims.filed_by_email)) = LOWER(TRIM(public.get_effective_user_email()))
  );

-- Policy 3: Admins can manage all claims (only actual admins, not impersonated)
CREATE POLICY "Admins can manage claims"
  ON public.claims FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Step 8: Verify everything
SELECT 'Functions created successfully' as status;

SELECT 
  'RLS Policies' as check_type,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'claims' 
AND schemaname = 'public'
ORDER BY policyname;









