import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown User'
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short'
    })

    // Send Telegram notification
    const telegramSent = await sendTelegramNotification({
      userName,
      userEmail: user.email,
      message,
      timestamp,
    })

    // Send email notification
    const emailSent = await sendEmailNotification({
      userName,
      userEmail: user.email,
      message,
      timestamp,
    })

    return NextResponse.json({ 
      success: true,
      telegram: telegramSent,
      email: emailSent,
    })
  } catch (error) {
    console.error('Support message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

async function sendTelegramNotification({
  userName,
  userEmail,
  message,
  timestamp,
}: {
  userName: string
  userEmail: string
  message: string
  timestamp: string
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('Telegram not configured - skipping notification')
    return false
  }

  const text = `🐕 *New Support Message*

*From:* ${userName}
*Email:* ${userEmail}
*Time:* ${timestamp}

*Message:*
${message}`

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Telegram error:', error)
    return false
  }
}

async function sendEmailNotification({
  userName,
  userEmail,
  message,
  timestamp,
}: {
  userName: string
  userEmail: string
  message: string
  timestamp: string
}) {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn('Resend not configured - skipping email')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Beagle Support <support@beagleforpm.com>',
        to: ['walt@beagleforpm.com'],
        subject: `Support Request from ${userName}`,
        html: `
          <h2>New Support Message</h2>
          <p><strong>From:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Email error:', error)
    return false
  }
}

