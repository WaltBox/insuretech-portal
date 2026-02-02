import { User } from './types'
import { cache } from 'react'
import { DEMO_USER, getMockUserById } from './mock-data'
import { cookies } from 'next/headers'

// DEMO MODE: Always return the demo user - no authentication required
export const getCurrentUser = cache(async (): Promise<User | null> => {
  // Check for impersonation (demo feature)
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value

  if (impersonateUserId) {
    const impersonatedUser = getMockUserById(impersonateUserId)
    if (impersonatedUser) {
      return impersonatedUser
    }
  }

  // Return the demo admin user
  return DEMO_USER
})

// DEMO MODE: Always return the demo admin user
export const getActualUser = cache(async (): Promise<User | null> => {
  return DEMO_USER
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

// DEMO MODE: Check permissions using mock data
export async function checkPermission(userId: string, propertyId: string): Promise<boolean> {
  const { mockPropertyManagers } = await import('./mock-data')
  const user = await getCurrentUser()

  if (!user) return false

  // Admins and centralized members have access to all properties
  if (user.role === 'admin' || user.role === 'centralized_member') {
    return true
  }

  // Property managers only have access to their assigned properties
  if (user.role === 'property_manager') {
    return mockPropertyManagers.some(
      pm => pm.user_id === userId && pm.property_id === propertyId
    )
  }

  return false
}

