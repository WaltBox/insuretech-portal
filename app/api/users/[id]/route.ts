import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

// DEMO MODE: Updates won't persist
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { role, first_name, last_name } = body

    const supabase = await createClient()
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        role,
        first_name,
        last_name,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(updatedUser)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DEMO MODE: Deletes won't persist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()
    
    // Delete user record (mock - won't persist)
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (userError) throw userError

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

