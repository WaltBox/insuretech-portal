import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

// POST add message to ticket
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
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify ticket exists and user has access
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check access
    const isAdmin = user.role === 'admin'
    const isOwner = ticket.user_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Determine sender type
    const senderType = isAdmin ? 'admin' : 'user'

    // Add the message
    const { data: message, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_type: senderType,
        content,
      })
      .select(`
        id,
        content,
        sender_type,
        created_at,
        sender:users!support_messages_sender_id_fkey(id, email, first_name, last_name)
      `)
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // If admin is replying, reopen ticket if it was closed/resolved
    if (isAdmin && ticket.status !== 'open') {
      await supabase
        .from('support_tickets')
        .update({ status: 'open' })
        .eq('id', ticketId)
    }

    // If user is replying, send notification to admin
    if (!isAdmin) {
      await sendReplyNotification(user, content, ticketId)
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Message POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendReplyNotification(
  user: { first_name: string; last_name: string; email: string },
  message: string,
  ticketId: string
) {
  const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown User'

  // Telegram notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (botToken && chatId) {
    const text = `💬 *New Reply on Ticket*

*From:* ${userName}
*Email:* ${user.email}
*Ticket:* ${ticketId.slice(0, 8)}...

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
}

