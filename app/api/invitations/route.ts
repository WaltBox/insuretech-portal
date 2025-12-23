import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !['admin', 'centralized_member'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, first_name, last_name, role, property_ids } = body

    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Email, first name, last name, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'centralized_member', 'property_manager'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // If property_manager, require at least one property
    if (role === 'property_manager' && (!property_ids || property_ids.length === 0)) {
      return NextResponse.json(
        { error: 'Property managers must be assigned to at least one property' },
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
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Check for pending invitations
    const { data: pendingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (pendingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Create invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    // Store invitation data (including properties for property managers)
    const invitationData: any = {
      email,
      role,
      invited_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
      // Store additional data as JSON
      metadata: {
        first_name,
        last_name,
        property_ids: property_ids || []
      }
    }

    // For property managers, we need a property_id for the table constraint
    // We'll use the first one, but store all in metadata
    if (role === 'property_manager' && property_ids && property_ids.length > 0) {
      invitationData.property_id = property_ids[0]
    } else {
      // For non-property managers, we still need a property_id due to table constraint
      // We'll just use NULL or handle this differently
      // Actually, let's modify this to not require property_id
      const { data: anyProperty } = await supabase
        .from('properties')
        .select('id')
        .limit(1)
        .single()
      
      if (anyProperty) {
        invitationData.property_id = anyProperty.id
      }
    }

    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert(invitationData)
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
    console.error('Invitation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

