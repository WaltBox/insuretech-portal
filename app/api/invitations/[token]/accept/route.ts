import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DEMO MODE: Accept invitation (mock - data won't persist)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { password, phone } = await request.json()

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // DEMO MODE: Return mock success
    const metadata = (invitation as any).metadata || {}
    const newUser = {
      id: `mock-user-${Date.now()}`,
      email: invitation.email,
      role: invitation.role,
      first_name: metadata.first_name || 'Demo',
      last_name: metadata.last_name || 'User',
      phone: phone.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully (Demo mode)',
      user: newUser,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    console.error('Accept invitation error:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

