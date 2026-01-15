import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getActualUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the target user exists
    const { data: targetUser, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('id', userId)
      .single()

    if (error || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Store impersonation in cookie
    const cookieStore = await cookies()
    cookieStore.set('impersonate_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours
      path: '/',
    })

    // Set impersonation context in database for RLS
    try {
      await supabase.rpc('set_impersonation_context', { user_id: userId })
    } catch (error) {
      // Continue anyway - cookie-based impersonation will still work for UI
    }

    return NextResponse.json({
      success: true,
      message: 'Impersonation started',
      targetUser,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    // Use getActualUser to check the real authenticated user, not the impersonated one
    const actualUser = await getActualUser()
    
    if (!actualUser || actualUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Remove impersonation cookie
    const cookieStore = await cookies()
    cookieStore.delete('impersonate_user_id')

    // Clear impersonation context in database
    const supabase = await createClient()
    try {
      await supabase.rpc('clear_impersonation_context')
    } catch (error) {
      // Silently fail
    }

    return NextResponse.json({
      success: true,
      message: 'Impersonation stopped',
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

