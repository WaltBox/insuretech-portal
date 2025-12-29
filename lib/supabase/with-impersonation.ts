import { createClient } from './server'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client and ensures impersonation context is set for RLS
 * Call this instead of createClient() directly when you need RLS to respect impersonation
 */
export async function createClientWithImpersonation() {
  const client = await createClient()
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value

  if (impersonateUserId) {
    try {
      // Set the session variable for RLS policies
      // This must be called before any queries that need RLS
      await client.rpc('set_impersonation_context', { 
        user_id: impersonateUserId 
      })
    } catch (error) {
      // If function doesn't exist, that's okay - run the SQL script first
      console.warn('Impersonation context not set. Run supabase/impersonation-rls-support.sql first.')
    }
  }

  return client
}

