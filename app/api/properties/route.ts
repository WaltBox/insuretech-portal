import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // RLS policies will automatically filter based on user role
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Properties fetch error:', error)
      throw error
    }

    return NextResponse.json({ properties: properties || [] })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    console.error('Properties API error:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, city, state, zip_code, door_count } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        name,
        address,
        city,
        state,
        zip_code,
        door_count: door_count !== undefined && door_count !== null && door_count !== '' ? (typeof door_count === 'number' ? door_count : parseInt(String(door_count), 10)) : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

