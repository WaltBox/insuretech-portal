import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || !['admin', 'centralized_member'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()

    // Get all property managers with their user info and properties
    // Specify the foreign key to disambiguate the relationship
    const { data, error } = await supabase
      .from('property_managers')
      .select(`
        id,
        property_id,
        user_id,
        created_at,
        user:users!property_managers_user_id_fkey(id, email, first_name, last_name, role),
        property:properties(id, name, city, state)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Group by user
    const managerMap = new Map()
    
    data?.forEach((pm: { user_id: string; user: unknown; property: unknown }) => {
      const userId = pm.user_id
      if (!managerMap.has(userId)) {
        managerMap.set(userId, {
          user: Array.isArray(pm.user) ? pm.user[0] : pm.user,
          properties: []
        })
      }
      const property = Array.isArray(pm.property) ? pm.property[0] : pm.property
      if (property) {
        managerMap.get(userId).properties.push(property)
      }
    })

    const managers = Array.from(managerMap.values())

    return NextResponse.json({ managers })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    console.error('Property managers error:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

