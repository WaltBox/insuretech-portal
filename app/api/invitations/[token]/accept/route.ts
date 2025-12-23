import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { password } = await request.json()

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Use service role key to create users
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', invitation.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    // Create user record
    const metadata = invitation.metadata || {}
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: invitation.email,
        role: invitation.role,
        first_name: metadata.first_name || 'User',
        last_name: metadata.last_name || 'Name',
      })
      .select()
      .single()

    if (userError) {
      // Rollback: delete auth user if user record creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw userError
    }

    // If property manager, assign to properties
    if (invitation.role === 'property_manager' && metadata.property_ids && metadata.property_ids.length > 0) {
      const propertyAssignments = metadata.property_ids.map((propertyId: string) => ({
        property_id: propertyId,
        user_id: authData.user.id,
        invited_by: invitation.invited_by,
      }))

      const { error: assignError } = await supabase
        .from('property_managers')
        .insert(propertyAssignments)

      if (assignError) {
        console.error('Failed to assign properties:', assignError)
        // Don't fail the whole invitation, just log it
      }
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: newUser,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    console.error('Accept invitation error:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

