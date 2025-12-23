import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    const supabase = await createClient()
    let query = supabase
      .from('claims')
      .select('*, property:properties(name)', { count: 'exact' })
      .order('submitted_date', { ascending: false })
      .limit(limit)

    // Filter by property if specified
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    // Cursor-based pagination
    if (cursor) {
      query = query.lt('submitted_date', cursor)
    }

    const { data: claims, error, count } = await query

    if (error) throw error

    const hasMore = claims && claims.length === limit
    const nextCursor = hasMore && claims.length > 0 ? claims[claims.length - 1].submitted_date : null

    return NextResponse.json({
      claims,
      nextCursor,
      hasMore,
      total: count,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

