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
    const invitationData: {
      email: string
      role: string
      invited_by: string
      token: string
      expires_at: string
      metadata: { first_name: string; last_name: string; property_ids: string[] }
      property_id?: string
    } = {
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

    // Send invitation email (non-blocking - don't wait for it)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beagle-caf.com'
    const inviteLink = `${baseUrl}/invite/${token}`
    
    // Send email asynchronously without blocking the response
    sendInvitationEmail({
      email,
      firstName: first_name,
      lastName: last_name,
      role,
      inviteLink,
    }).catch((error) => {
      console.error('Failed to send invitation email (async):', {
        email,
        error: error instanceof Error ? error.message : error,
        inviteLink,
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation created',
      invitation,
      inviteLink,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    console.error('Invitation error:', error)
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
}): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured in environment variables')
    return { 
      success: false, 
      error: 'Email service not configured. Please set RESEND_API_KEY environment variable.' 
    }
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
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 2px solid #4d1701; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background-color: #ffffff;">
                    <div style="margin-bottom: 30px;">
                      <img src="${logoUrl}" alt="Beagle" style="height: 32px; width: auto; max-width: 200px; display: block; margin: 0 auto;" onerror="this.style.display='none';">
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
                        <li style="margin-bottom: 8px;">Submit claims</li>
                      </ul>
                    </div>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${inviteLink}" style="display: inline-block; padding: 12px 32px; background-color: #4d1701; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.2s;">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Expiration Notice -->
                    <p style="margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 11px; color: #666666; text-align: center;">
                      This invitation link will expire in 7 days.
                    </p>
                    
                    <p style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #666666; text-align: center;">
                      If you have any questions, feel free to reach out to us at <a href="mailto:walt@beagleforpm.com" style="color: #1A1A1A; font-weight: 600;">walt@beagleforpm.com</a>. We're here to support you every step of the way.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 0; background-color: #4d1701;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 32px 40px; color: #ffffff;">
                          <p style="margin: 0 0 8px; font-size: 14px; color: #ffffff;">
                            Got a question? <a href="mailto:walt@beagleforpm.com" style="color: #ffffff; text-decoration: underline;">Email us</a>
                          </p>
                          <p style="margin: 0 0 24px; font-size: 12px; color: #ffffff; opacity: 0.9;">
                            473 Pine Street Floor 5, San Francisco CA 94104
                          </p>
                        
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
      const errorMessage = data?.message || data?.error || 'Unknown error from Resend API'
      console.error('Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data,
        email,
      })
      return { 
        success: false, 
        error: `Resend API error (${response.status}): ${errorMessage}` 
      }
    }

    console.log('Invitation email sent successfully:', {
      email,
      messageId: data.id,
    })
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Invitation email error:', {
      error: errorMessage,
      email,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return { 
      success: false, 
      error: `Failed to send email: ${errorMessage}` 
    }
  }
}


