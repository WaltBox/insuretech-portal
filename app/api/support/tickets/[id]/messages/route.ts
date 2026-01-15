import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

// POST - Add a message to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: ticketId } = await params
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the authenticated user ID from Supabase Auth (must match auth.uid() for RLS)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verify user has access to this ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('user_id, status')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check permissions: user must own the ticket OR be an admin
    if (ticket.user_id !== authUser.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Determine sender type
    const senderType = user.role === 'admin' ? 'admin' : 'user'

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: authUser.id,
        sender_type: senderType,
        content: content,
      })
      .select(`
        *,
        sender:users!support_messages_sender_id_fkey(id, email, first_name, last_name)
      `)
      .single()

    if (messageError) {
      return NextResponse.json({ 
        error: 'Failed to create message', 
        details: messageError.message 
      }, { status: 500 })
    }

    // Send notifications if user (not admin) sent the message
    if (senderType === 'user') {
      // Non-blocking notification
      sendNotification(user, content, ticketId).catch(() => {
        // Silently handle notification errors
      })
    }

    return NextResponse.json({ message })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendNotification(
  user: { first_name: string; last_name: string; email: string },
  message: string,
  ticketId: string
) {
  const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown User'
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  // Telegram notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (botToken && chatId) {
    const text = `🐕 *New Support Message*

*From:* ${userName}
*Email:* ${user.email}
*Ticket:* ${ticketId}
*Time:* ${timestamp}

*Message:*
${message}`

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      })
    } catch (error) {
      console.error('Telegram error:', error)
    }
  }

  // Email notification
  const resendApiKey = process.env.RESEND_API_KEY

  if (resendApiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Beagle Support <support@beagleforpm.com>',
          to: ['walt@beagleforpm.com'],
          subject: `New Message on Support Ticket from ${userName}`,
          html: `
            <h2>New Support Message</h2>
            <p><strong>From:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
        }),
      })
    } catch (error) {
      console.error('Email error:', error)
    }
  }
}

