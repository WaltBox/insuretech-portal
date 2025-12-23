import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, checkPermission } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view this property's enrollments
    const hasPermission = await checkPermission(user.id, propertyId)
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const coverageType = searchParams.get('coverage_type')

    const supabase = await createClient()
    let query = supabase
      .from('enrollments')
      .select('*', { count: 'exact' })
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (coverageType) {
      query = query.eq('coverage_name', coverageType)
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,enrollment_number.ilike.%${search}%`
      )
    }

    // Cursor-based pagination
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: enrollments, error, count } = await query

    if (error) throw error

    const hasMore = enrollments && enrollments.length === limit
    const nextCursor = hasMore ? enrollments[enrollments.length - 1].created_at : null

    return NextResponse.json({
      enrollments,
      nextCursor,
      hasMore,
      total: count,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


