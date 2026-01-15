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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const coverageType = searchParams.get('coverage_type')

    const supabase = await createClient()
    let query = supabase
      .from('enrollments')
      .select('*', { count: 'exact' })
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (coverageType) {
      query = query.eq('coverage_name', coverageType)
    }

    if (search) {
      // Enhanced search across multiple fields with better matching
      // Search in: first_name, last_name, coverage_holder_name, email, phone, address fields, enrollment_number
      const searchTerm = search.trim()
      query = query.or(
        `first_name.ilike.%${searchTerm}%,` +
        `last_name.ilike.%${searchTerm}%,` +
        `coverage_holder_name.ilike.%${searchTerm}%,` +
        `email.ilike.%${searchTerm}%,` +
        `phone.ilike.%${searchTerm}%,` +
        `address1.ilike.%${searchTerm}%,` +
        `address2.ilike.%${searchTerm}%,` +
        `city.ilike.%${searchTerm}%,` +
        `state.ilike.%${searchTerm}%,` +
        `zip.ilike.%${searchTerm}%,` +
        `enrollment_number.ilike.%${searchTerm}%`
      )
    }

    // Page-based pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: enrollments, error, count } = await query

    if (error) throw error

    // Get property name for Property Manager column
    const { data: property } = await supabase
      .from('properties')
      .select('name')
      .eq('id', propertyId)
      .single()

    return NextResponse.json({
      enrollments,
      total: count,
      propertyName: property?.name || '',
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


