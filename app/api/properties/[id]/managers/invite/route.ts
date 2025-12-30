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

  // Get Supabase storage URLs for email images
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beagle-caf.com'
  const logoUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/email-assets/newbeaglelogo.png`
    : `${baseUrl}/images/newbeaglelogo.png`
  const dogImageUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/email-assets/trudy-cute-dog.png`
    : `${baseUrl}/trudy-cute-dog.png`

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
                  <td style="padding: 40px 40px 30px; text-align: center; background-color: #ffffff;">
                    <div style="margin-bottom: 30px;">
                      <img src="${logoUrl}" alt="Beagle" style="height: 32px; width: auto; max-width: 200px; display: block; margin: 0 auto;">
                    </div>
                    <div style="margin-bottom: 20px; background-color: #ffffff; padding: 20px; border-radius: 8px;">
                      <img src="${dogImageUrl}" alt="Beagle" style="width: 120px; height: 120px; border-radius: 8px; display: block; margin: 0 auto; background-color: #ffffff;">
                    </div>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #1A1A1A; text-align: center;">
                      Welcome to the family,
                    </h1>
                    <h2 style="margin: 0 0 24px; font-size: 28px; font-weight: 700; color: #1A1A1A; text-align: center;">
                      ${firstName}
                    </h2>
                    <p style="margin: 0 0 32px; font-size: 14px; color: #1A1A1A; text-align: center;">
                      You've been invited to join <strong>Beagle Portal</strong> as a <strong>${roleDisplay}</strong>. 
                      Joining the program will give you access to your own dashboard. Inside it you can:
                    </p>
                    
                    <!-- Features List -->
                    <div style="margin: 0 0 32px; padding: 0; text-align: left;">
                      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1A1A1A; line-height: 1.8;">
                        <li style="margin-bottom: 8px;">View Enrollment information</li>
                        <li style="margin-bottom: 8px;">View Claims Information</li>
                        <li style="margin-bottom: 8px;">Auto verify and monitor renters insurance compliance</li>
                        <li style="margin-bottom: 8px;">Offer benefits and liability waiver programs to tenants</li>
                        <li style="margin-bottom: 8px;">Access free AI tools like AI late rent calls</li>
                      </ul>
                    </div>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${inviteLink}" style="display: inline-block; padding: 12px 32px; background-color: #1A1A1A; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.2s;">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Expiration Notice -->
                    <div style="margin: 24px 0 0; padding: 16px; background-color: #faf8f0; border-radius: 8px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #1A1A1A; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span style="font-size: 14px;">⏰</span>
                        <span>This invitation link will expire in 72 hours.</span>
                      </p>
                    </div>
                    
                    <p style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #666666; text-align: center;">
                      If you have any questions, feel free to reach out to us at <a href="mailto:help@beagleforpm.com" style="color: #1A1A1A; font-weight: 600;">help@beagleforpm.com</a>. We're here to support you every step of the way.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 0; background-color: #1A1A1A;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 32px 40px; color: #ffffff;">
                          <p style="margin: 0 0 8px; font-size: 14px; color: #ffffff;">
                            Got a question? <a href="mailto:help@beagleforpm.com" style="color: #ffffff; text-decoration: underline;">Email us</a>
                          </p>
                          <p style="margin: 0 0 24px; font-size: 12px; color: #ffffff; opacity: 0.9;">
                            473 Pine Street Floor 5, San Francisco CA 94104
                          </p>
                          <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 16px; font-weight: 600; color: #ffffff;">beagle</span>
                            <a href="https://linkedin.com/company/beagle" style="display: inline-block; width: 20px; height: 20px;">
                              <span style="color: #ffffff; font-size: 16px;">in</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    </table>
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


