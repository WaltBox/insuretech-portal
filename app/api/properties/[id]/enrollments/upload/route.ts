import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import Papa from 'papaparse'

const REQUIRED_FIELDS = [
  'Enrollment #',
  'Status',
  'Coverage Holder Name',
  'First Name',
  'Last Name',
  'Coverage Name',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Read file content
    const text = await file.text()

    // Parse CSV
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing error', details: parseResult.errors },
        { status: 400 }
      )
    }

    const data = parseResult.data
    const fields = parseResult.meta.fields || []

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter((field) => !fields.includes(field))
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
          receivedFields: fields,
        },
        { status: 400 }
      )
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    // Use Supabase function to replace enrollments atomically
    const supabase = await createClient()
    const { data: result, error } = await supabase.rpc('replace_property_enrollments', {
      p_property_id: propertyId,
      p_enrollments: data,
      p_uploaded_by: user.id,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: result,
      message: `Successfully uploaded ${result} enrollments`,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

