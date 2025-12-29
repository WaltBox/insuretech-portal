import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Record<string, unknown>)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Set impersonation context for RLS if impersonating
  // This stores the impersonated user ID in a table that RLS functions can check
  if (impersonateUserId) {
    try {
      // Call the function to set the impersonation context
      // This stores it in _impersonation_context table for this connection
      await client.rpc('set_impersonation_context', { 
        user_id: impersonateUserId 
      })
    } catch (error) {
      // Function might not exist yet - that's okay, run the SQL script first
      // RLS will fall back to using auth.uid() if the function fails
      console.warn('Could not set impersonation context. Run supabase/impersonation-rls-support.sql first.')
    }
  }

  return client
}

