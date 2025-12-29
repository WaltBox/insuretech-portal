-- Fix the _impersonation_context table schema
-- This updates the table from the old connection_id-based schema to the new admin_user_id-based schema

-- Drop the old table if it exists with wrong schema
DROP TABLE IF EXISTS public._impersonation_context CASCADE;

-- Recreate with correct schema
CREATE TABLE public._impersonation_context (
  admin_user_id UUID PRIMARY KEY,  -- The admin who is impersonating
  impersonated_user_id UUID NOT NULL,  -- The user being impersonated
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for cleanup
CREATE INDEX IF NOT EXISTS idx_impersonation_expires ON public._impersonation_context(expires_at);

-- Now recreate the functions (they should already exist, but this ensures they're correct)
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

-- Recreate get_effective_user_id with fixed ambiguity
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

-- Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = '_impersonation_context'
ORDER BY ordinal_position;

