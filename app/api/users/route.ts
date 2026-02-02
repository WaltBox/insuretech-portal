import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(users)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DEMO MODE: Create mock users (data won't persist)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role, first_name, last_name } = body

    if (!email || !role || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // DEMO MODE: Return a mock created user
    const newUser = {
      id: `mock-user-${Date.now()}`,
      email,
      role,
      first_name,
      last_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

