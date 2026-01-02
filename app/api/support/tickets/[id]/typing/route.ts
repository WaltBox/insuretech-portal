import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

// Simple in-memory store for typing status (in production, use Redis)
const typingStatus = new Map<string, number>()

// POST - Set typing status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: ticketId } = await params
    const { isTyping } = await request.json()

    if (isTyping) {
      // Store timestamp when admin starts typing
      typingStatus.set(ticketId, Date.now())
    } else {
      // Clear typing status
      typingStatus.delete(ticketId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Typing status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Check if admin is typing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: ticketId } = await params
    const lastTyping = typingStatus.get(ticketId)

    // If admin typed within last 3 seconds, they're still typing
    const isTyping = lastTyping && Date.now() - lastTyping < 3000

    return NextResponse.json({ isTyping: !!isTyping })
  } catch (error) {
    console.error('Typing check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

