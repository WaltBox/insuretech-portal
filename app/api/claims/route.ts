import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')
    const filedByEmail = searchParams.get('filed_by_email') // Filter by who filed the claim
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')
    const timePeriod = searchParams.get('time_period') // 'week', 'month', or 'year'

    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    
    const supabase = await createClient()
    
    // Set impersonation context for RLS BEFORE the query
    // This ensures the context is set in the same connection as the query
    // If this fails, the query will still run but RLS won't respect impersonation
    if (impersonateUserId) {
      try {
        await supabase.rpc('set_impersonation_context', { 
          user_id: impersonateUserId 
        })
      } catch (error) {
        // Non-blocking - if function doesn't exist, query will still work
      }
    }
    
    // Note: RLS policies automatically filter claims based on user role:
    // - Centralized Members: See ALL claims
    // - Property Managers: See ONLY claims where filed_by_email matches their email
    //   (filed_by_email is the email of the PM/CM who filed the claim from Beagle API)
    
    let query = supabase
      .from('claims')
      .select('*, property:properties(name)', { count: 'exact' })
      .order('submitted_date', { ascending: false })
      .limit(limit)

    // Filter by property if specified
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    // Filter by who filed the claim (email of PM or CM who filed it)
    if (filedByEmail) {
      query = query.eq('filed_by_email', filedByEmail)
    }

    // Filter by time period (server-side for better performance)
    if (timePeriod) {
      const now = new Date()
      const cutoffDate = new Date()
      
      switch (timePeriod) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoffDate.setDate(now.getDate() - 30)
          break
        case 'year':
          cutoffDate.setDate(now.getDate() - 365)
          break
      }
      
      query = query.gte('submitted_date', cutoffDate.toISOString())
    }

    // Cursor-based pagination
    if (cursor) {
      query = query.lt('submitted_date', cursor)
    }

    const { data: claims, error, count } = await query

    if (error) {
      console.error('Claims query error:', error)
      // If it's a function not found error, provide helpful message
      if (error.message?.includes('function') || error.message?.includes('does not exist')) {
        console.error('RLS functions may not exist. Run supabase/impersonation-rls-support.sql first.')
      }
      throw error
    }

    const hasMore = claims && claims.length === limit
    const nextCursor = hasMore && claims.length > 0 ? claims[claims.length - 1].submitted_date : null

    return NextResponse.json({
      claims,
      nextCursor,
      hasMore,
      total: count,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


