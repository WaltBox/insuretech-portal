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
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (adminError) {
      console.error('Error fetching admin user:', adminError)
      // Continue to normal flow if we can't verify admin status
    } else if (adminUser?.role === 'admin') {
      // Return the impersonated user
      const { data: impersonatedUser, error: impersonateError } = await supabase
        .from('users')
        .select('*')
        .eq('id', impersonateUserId)
        .single()

      if (impersonateError) {
        // Silently handle - impersonated user might not exist, clear the cookie
        if (impersonateError.code === 'PGRST116') {
          // User not found - clear invalid impersonation cookie
          cookieStore.delete('impersonate_user_id')
        }
        // Fall through to normal flow
      } else if (impersonatedUser) {
        return impersonatedUser as User | null
      }
    }
  }

  // Normal flow - return the authenticated user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (error) {
    // Log error but don't throw - return null to trigger redirect
    console.error('Error fetching user from database:', error)
    return null
  }

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
  
  // Get actual user for admin check
  const actualUser = await getActualUser()
  
  // Admins can access any page (for impersonation purposes)
  if (actualUser?.role === 'admin') {
    return user
  }
  
  // For non-admins, check the current user's role (may be impersonated)
  // This allows admins impersonating property managers to see property manager pages
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

