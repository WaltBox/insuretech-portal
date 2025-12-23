import { createClient } from './supabase/server'
import { User } from './types'
import { cache } from 'react'
import { cookies } from 'next/headers'

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  // Check for impersonation (admin feature)
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value

  if (impersonateUserId) {
    // Verify the actual authenticated user is an admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (adminUser?.role === 'admin') {
      // Return the impersonated user
      const { data: impersonatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', impersonateUserId)
        .single()

      return impersonatedUser as User | null
    }
  }

  // Normal flow - return the authenticated user
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  return user as User | null
})

export const getActualUser = cache(async (): Promise<User | null> => {
  // Always returns the actual authenticated user, not the impersonated one
  const supabase = await createClient()
  
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  return user as User | null
})

export const isImpersonating = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies()
  return !!cookieStore.get('impersonate_user_id')?.value
})

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}

export async function checkPermission(userId: string, propertyId: string): Promise<boolean> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return false

  // Admins and centralized members have access to all properties
  if (user.role === 'admin' || user.role === 'centralized_member') {
    return true
  }

  // Property managers only have access to their assigned properties
  if (user.role === 'property_manager') {
    const { data } = await supabase
      .from('property_managers')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .single()

    return !!data
  }

  return false
}

