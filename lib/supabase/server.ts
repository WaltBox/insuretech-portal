import { createMockSupabaseClient } from '../mock-supabase'

// DEMO MODE: Using mock Supabase client - no real database connection
export async function createClient() {
  return createMockSupabaseClient() as any
}

