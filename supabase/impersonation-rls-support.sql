-- Support for impersonation in RLS policies
-- This allows RLS to respect impersonation when an admin is viewing as another user

-- Step 1: Create a table to store impersonation state per admin user
-- Keyed by actual user ID (admin doing impersonation) for reliability with connection pooling
CREATE TABLE IF NOT EXISTS public._impersonation_context (
  admin_user_id UUID PRIMARY KEY,  -- The admin who is impersonating
  impersonated_user_id UUID NOT NULL,  -- The user being impersonated
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for cleanup
CREATE INDEX IF NOT EXISTS idx_impersonation_expires ON public._impersonation_context(expires_at);

-- Step 2: Function to set impersonation context (called by application)
CREATE OR REPLACE FUNCTION public.set_impersonation_context(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actual_user_id UUID;
BEGIN
  -- Get the actual authenticated user (admin doing the impersonation)
  actual_user_id := auth.uid();
  
  -- Verify the actual user is an admin (security check)
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = actual_user_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can set impersonation context';
  END IF;
  
  -- Clean up old entries (older than 5 minutes)
  DELETE FROM public._impersonation_context 
  WHERE expires_at < NOW();
  
  -- Set impersonation for this admin
  INSERT INTO public._impersonation_context (admin_user_id, impersonated_user_id, expires_at)
  VALUES (actual_user_id, user_id, NOW() + INTERVAL '5 minutes')
  ON CONFLICT (admin_user_id) 
  DO UPDATE SET 
    impersonated_user_id = EXCLUDED.impersonated_user_id,
    expires_at = EXCLUDED.expires_at;
END;
$$;

-- Step 3: Create a function to get the effective user ID
-- This checks the impersonation context table, otherwise returns auth.uid()
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  actual_user_id UUID;
  result_user_id UUID;
BEGIN
  -- Get the actual authenticated user
  actual_user_id := auth.uid();
  
  -- Check for active impersonation for this admin
  SELECT ic.impersonated_user_id INTO result_user_id
  FROM public._impersonation_context ic
  WHERE ic.admin_user_id = actual_user_id
    AND ic.expires_at > NOW()
  LIMIT 1;
  
  -- If impersonation is active, return that user ID
  IF result_user_id IS NOT NULL THEN
    RETURN result_user_id;
  END IF;
  
  -- Otherwise return the actual authenticated user
  RETURN actual_user_id;
END;
$$;

-- Step 2: Create a function to get the effective user's role
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
  
  SELECT role INTO user_role
  FROM public.users
  WHERE id = effective_id;
  
  RETURN user_role;
END;
$$;

-- Step 3: Create a function to get the effective user's email
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
  
  SELECT email INTO user_email
  FROM public.users
  WHERE id = effective_id;
  
  RETURN user_email;
END;
$$;

-- Step 5: Function to clear impersonation context (called when stopping impersonation)
CREATE OR REPLACE FUNCTION public.clear_impersonation_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actual_user_id UUID;
BEGIN
  actual_user_id := auth.uid();
  
  -- Remove impersonation for this admin
  DELETE FROM public._impersonation_context 
  WHERE admin_user_id = actual_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_effective_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_effective_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_effective_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_impersonation_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_impersonation_context() TO authenticated;

