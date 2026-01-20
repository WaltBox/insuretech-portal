import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

// DELETE - Cancel/delete an invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !['admin', 'centralized_member'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Delete the invitation
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)
      .is('accepted_at', null) // Only delete if not accepted

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled',
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    console.error('Delete invitation error:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
