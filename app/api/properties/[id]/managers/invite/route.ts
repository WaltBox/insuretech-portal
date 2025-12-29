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
        metadata: {
          first_name,
          last_name,
          property_ids: [propertyId]
        }
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    // Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beagle-caf.com'
    const inviteLink = `${baseUrl}/invite/${token}`
    const emailSent = await sendInvitationEmail({
      email,
      firstName: first_name,
      lastName: last_name,
      role: 'property_manager',
      inviteLink,
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation created',
      invitation,
      inviteLink,
      emailSent,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

async function sendInvitationEmail({
  email,
  firstName,
  lastName,
  role,
  inviteLink,
}: {
  email: string
  firstName: string
  lastName: string
  role: string
  inviteLink: string
}) {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn('Resend not configured - skipping invitation email')
    return false
  }

  const roleDisplay = role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Get Supabase storage URL for email image
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beagle-caf.com'
  const dogImageUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/email-assets/new-dog.png`
    : `${baseUrl}/new-dog.png`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You've been invited to Beagle Portal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F5F0; line-height: 1.6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px; text-align: center;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 2px solid #1A1A1A; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding: 50px 40px 30px; text-align: center; background-color: #ffffff;">
                    <div style="margin-bottom: 30px;">
                      <img src="${dogImageUrl}" alt="Beagle" style="width: 120px; height: 120px; border-radius: 8px; display: block; margin: 0 auto;">
                    </div>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1A1A1A; text-align: center;">
                      You've been invited!
                    </h1>
                    <p style="margin: 0 0 24px; font-size: 14px; color: #666666; text-align: center;">
                      Hi ${firstName},
                    </p>
                    <p style="margin: 0 0 24px; font-size: 14px; color: #1A1A1A;">
                      You've been invited to join <strong>Beagle Portal</strong> as a <strong>${roleDisplay}</strong>. 
                      Click the button below to accept your invitation and create your account.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${inviteLink}" style="display: inline-block; padding: 10px 24px; background-color: #ffffff; color: #1A1A1A; text-decoration: none; border: 2px solid #1A1A1A; border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.2s;">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 24px 0 0; font-size: 12px; color: #999999; text-align: center;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${inviteLink}" style="color: #FF6B00; word-break: break-all;">${inviteLink}</a>
                    </p>
                    
                    <p style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #999999; text-align: center;">
                      This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Beagle Portal <noreply@beagle-caf.com>',
        to: [email],
        subject: `You've been invited to Beagle Portal`,
        html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data,
      })
      return false
    }

    console.log('Invitation email sent successfully:', {
      email,
      messageId: data.id,
    })
    return true
  } catch (error) {
    console.error('Invitation email error:', error)
    return false
  }
}


