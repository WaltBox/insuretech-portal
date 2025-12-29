-- Fix impersonation using PostgreSQL session variables
-- This ensures the context is available to RLS policies even with connection pooling

-- Step 1: Update set_impersonation_context to use session variables
CREATE OR REPLACE FUNCTION public.set_impersonation_context(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actual_user_id UUID;
BEGIN
  actual_user_id := auth.uid();
  IF actual_user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot set impersonation context: no authenticated user.';
  END IF;

  -- Verify the user_id exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'Cannot set impersonation context: user % does not exist.', user_id;
  END IF;

  -- Set session variables (available to RLS in the same connection)
  PERFORM set_config('app.impersonated_user_id', user_id::text, false);
  PERFORM set_config('app.impersonation_set_at', extract(epoch from now())::text, false);
  
  -- Also store in table for cross-connection access (fallback)
  INSERT INTO public._impersonation_context (admin_user_id, impersonated_user_id, expires_at)
  VALUES (actual_user_id, user_id, NOW() + INTERVAL '5 minutes')
  ON CONFLICT (admin_user_id)
  DO UPDATE SET
    impersonated_user_id = EXCLUDED.impersonated_user_id,
    expires_at = EXCLUDED.expires_at;
END;
$$;

-- Step 2: Update get_effective_user_id to use table (most reliable with connection pooling)
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id UUID;
  table_user_id UUID;
  session_user_id TEXT;
BEGIN
  current_admin_id := auth.uid();
  IF current_admin_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Try session variable first (if available in same connection)
  BEGIN
    session_user_id := current_setting('app.impersonated_user_id', true);
    IF session_user_id IS NOT NULL AND session_user_id != '' AND session_user_id != 'NULL' THEN
      RETURN session_user_id::UUID;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Session variable not set, continue to table lookup
      NULL;
  END;

  -- Check table (works across connections)
  SELECT ic.impersonated_user_id INTO table_user_id
  FROM public._impersonation_context ic
  WHERE ic.admin_user_id = current_admin_id
    AND ic.expires_at > NOW()
  LIMIT 1;

  IF table_user_id IS NOT NULL THEN
    RETURN table_user_id;
  END IF;

  -- No impersonation, return actual user
  RETURN current_admin_id;
END;
$$;

-- Step 3: Recreate get_effective_user_role (unchanged)
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

-- Step 4: Recreate get_effective_user_email (unchanged)
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

-- Step 5: Update clear_impersonation_context to clear session variables too
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
    RETURN;
  END IF;

  -- Clear session variables
  PERFORM set_config('app.impersonated_user_id', '', false);
  PERFORM set_config('app.impersonation_set_at', '', false);

  -- Clear table
  DELETE FROM public._impersonation_context
  WHERE admin_user_id = current_admin_id;
END;
$$;

-- Verify functions are created
SELECT 'Functions updated to use session variables' as status;

