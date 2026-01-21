import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(
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

    // Get the existing invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', id)
      .is('accepted_at', null)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      )
    }

    // Generate new token and extend expiration
    const newToken = crypto.randomBytes(32).toString('hex')
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7) // 7 days from now

    // Update invitation with new token, expiration, and resent timestamp
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString(),
        last_resent_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beagle-caf.com'
    const inviteLink = `${baseUrl}/invite/${newToken}`

    // Send the invitation email
    const firstName = invitation.metadata?.first_name || 'User'
    const lastName = invitation.metadata?.last_name || ''
    
    const emailResult = await sendInvitationEmail({
      email: invitation.email,
      firstName,
      lastName,
      role: invitation.role,
      inviteLink,
    })

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', {
        email: invitation.email,
        error: emailResult.error,
      })
    }

    return NextResponse.json({
      success: true,
      message: emailResult.success ? 'Invitation resent successfully' : 'Invitation updated but email failed',
      inviteLink,
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    console.error('Resend invitation error:', error)
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
    console.error('RESEND_API_KEY is not configured')
    return { success: false, error: 'Email service not configured' }
  }

  const roleDisplay = role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

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
        <title>Reminder: You've been invited to Beagle Portal</title>
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
                      Reminder: Your invitation is waiting,
                    </h1>
                    <h2 style="margin: 0 0 24px; font-size: 28px; font-weight: 700; color: #1A1A1A; text-align: center;">
                      ${firstName}
                    </h2>
                    <p style="margin: 0 0 32px; font-size: 14px; color: #1A1A1A; text-align: center;">
                      You've been invited to join <strong>Beagle Portal</strong> as a <strong>${roleDisplay}</strong>. 
                      Click the button below to accept your invitation and set up your account.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${inviteLink}" style="display: inline-block; padding: 12px 32px; background-color: #4d1701; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
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
                      If you have any questions, feel free to reach out to us at <a href="mailto:walt@beagleforpm.com" style="color: #1A1A1A; font-weight: 600;">walt@beagleforpm.com</a>.
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
    console.log('📧 Attempting to resend invitation email:', {
      to: email,
      firstName,
      role,
      hasApiKey: !!resendApiKey,
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Beagle Portal <noreply@beagle-caf.com>',
        to: [email],
        subject: `Reminder: You've been invited to Beagle Portal`,
        html,
      }),
    })

    const data = await response.json()

    console.log('📧 Resend API response:', {
      status: response.status,
      ok: response.ok,
      data,
      email,
    })

    if (!response.ok) {
      console.error('❌ Resend API error:', data)
      return { success: false, error: data?.message || 'Failed to send email' }
    }

    console.log('✅ Reminder email sent successfully:', { email, resendId: data?.id })
    return { success: true }
  } catch (error) {
    console.error('❌ Email sending error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
