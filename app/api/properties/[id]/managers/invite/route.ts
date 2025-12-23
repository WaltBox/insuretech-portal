import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params
    const user = await getCurrentUser()
    
    if (!user || !['admin', 'centralized_member'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, first_name, last_name } = body

    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single()

    if (existingUser) {
      // User exists - just add them as a property manager
      if (existingUser.role !== 'property_manager') {
        return NextResponse.json(
          { error: 'User already exists with a different role' },
          { status: 400 }
        )
      }

      // Check if already assigned to this property
      const { data: existingAssignment } = await supabase
        .from('property_managers')
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', existingUser.id)
        .single()

      if (existingAssignment) {
        return NextResponse.json(
          { error: 'User is already assigned to this property' },
          { status: 400 }
        )
      }

      // Add to property_managers
      const { data: assignment, error: assignError } = await supabase
        .from('property_managers')
        .insert({
          property_id: propertyId,
          user_id: existingUser.id,
          invited_by: user.id,
        })
        .select()
        .single()

      if (assignError) throw assignError

      return NextResponse.json({
        success: true,
        message: 'User assigned to property',
        assignment,
      })
    }

    // User doesn't exist - create invitation
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email,
        property_id: propertyId,
        role: 'property_manager',
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    // TODO: Send invitation email
    // For now, return the invitation link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

    return NextResponse.json({
      success: true,
      message: 'Invitation created',
      invitation,
      inviteLink,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

