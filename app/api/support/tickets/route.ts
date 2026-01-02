import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

// GET all tickets (admin sees all, users see their own)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get the actual auth user ID (must match what was used to create tickets)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:users!support_tickets_user_id_fkey(id, email, first_name, last_name),
        messages:support_messages(
          id,
          content,
          sender_type,
          created_at,
          sender:users!support_messages_sender_id_fkey(id, email, first_name, last_name)
        )
      `)
      .order('updated_at', { ascending: false })

    // Non-admins only see their own tickets - use auth.uid() to match RLS policy
    // RLS policy checks auth.uid() = user_id, so we must filter by the same ID
    if (user.role !== 'admin') {
      query = query.eq('user_id', authUser.id)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets', details: error.message }, { status: 500 })
    }

    console.log('Fetched tickets:', tickets?.length || 0, 'tickets')

    // Sort messages by created_at for each ticket
    const ticketsWithSortedMessages = tickets?.map(ticket => ({
      ...ticket,
      messages: ticket.messages?.sort((a: { created_at: string }, b: { created_at: string }) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) || []
    })) || []

    console.log('Returning tickets with sorted messages:', ticketsWithSortedMessages.length)
    return NextResponse.json(ticketsWithSortedMessages)
  } catch (error) {
    console.error('Tickets GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new ticket with initial message
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, subject } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the authenticated user ID from Supabase Auth (must match auth.uid() for RLS)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Create the ticket - use authUser.id to match RLS policy auth.uid() check
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: authUser.id, // Use auth user ID to match RLS policy
        subject: subject || message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        status: 'open',
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating ticket:', ticketError)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Add the initial message
    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: authUser.id, // Use auth user ID to match RLS policy
        sender_type: 'user',
        content: message,
      })

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // Add auto-response from system (non-blocking, delayed by 4 seconds)
    // This gives time for the typing indicator to show first
    ;(async () => {
      try {
        // Wait 4 seconds before creating the system message
        await new Promise(resolve => setTimeout(resolve, 4000))
        
        await supabase
          .from('support_messages')
          .insert({
            ticket_id: ticket.id,
            sender_id: authUser.id, // System uses the user's ID but marked as 'system' type
            sender_type: 'system',
            content: "Thanks for reaching out! Your account manager has been notified and will get back to you shortly.",
          })
      } catch (error) {
        console.error('Error creating system message:', error)
      }
    })()

    // Send notifications (Telegram + Email) - non-blocking
    sendNotifications(user, message).catch((error) => {
      console.error('Error sending notifications:', error)
    })

    // Return immediately - don't wait for notifications
    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Tickets POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendNotifications(user: { first_name: string; last_name: string; email: string }, message: string) {
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
          subject: `Support Request from ${userName}`,
          html: `
            <h2>New Support Message</h2>
            <p><strong>From:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
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


