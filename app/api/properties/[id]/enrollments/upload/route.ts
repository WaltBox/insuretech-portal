import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import Papa from 'papaparse'

const REQUIRED_FIELDS = [
  'Status',
  'Coverage Holder Name',
  'First Name',
  'Last Name',
  'Coverage Name',
]

const NEW_FORMAT_FIELDS = [
  'Tenant Name',
  'Coverage Name',
  'Current Charge Amount',
  'Post Date',
]

const ORIGINAL_CHARGES_FORMAT_FIELDS = [
  'Charge Code',
  'Resident',
  'Current Charge Amount',
  'Charge Post Month',
]

// Map Charge Code to Coverage Name
function mapChargeCodeToCoverageName(chargeCode: string): string {
  const code = chargeCode.trim().toUpperCase()
  if (code.includes('BEAGLE DEPOSIT ALTERNATIVE') || code === 'BEAGLE DEPOSIT ALTERNATIVE') {
    return 'SDI'
  }
  if (code.includes('LIABILITY WAIVER') || code.includes('CONCIERGE')) {
    return 'TLL'
  }
  // Default fallback
  return chargeCode.trim()
}

// Helper function to parse tenant name into first and last name
function parseTenantName(tenantName: string): { firstName: string; lastName: string } {
  const trimmed = tenantName.trim()
  if (!trimmed) {
    return { firstName: '', lastName: '' }
  }
  
  // Handle format like "Jones, Keidra" or "JOHNSON, ALFRED"
  const commaIndex = trimmed.indexOf(',')
  if (commaIndex > 0) {
    const lastName = trimmed.substring(0, commaIndex).trim()
    const firstName = trimmed.substring(commaIndex + 1).trim()
    return { firstName, lastName }
  }
  
  // If no comma, try to split by space (last word is last name)
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1]
    const firstName = parts.slice(0, -1).join(' ')
    return { firstName, lastName }
  }
  
  // Single name - treat as first name
  return { firstName: trimmed, lastName: '' }
}

// Helper function to parse MM/YYYY date format
function parsePostDate(postDate: string): { effectiveDate: string; expirationDate: string | null } {
  if (!postDate || !postDate.trim()) {
    return { effectiveDate: '', expirationDate: null }
  }
  
  // Format is MM/YYYY (e.g., "01/2026")
  const parts = postDate.trim().split('/')
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10)
    const year = parseInt(parts[1], 10)
    
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return { effectiveDate: '', expirationDate: null }
    }
    
    const monthStr = String(month).padStart(2, '0')
    // Set effective date to first day of the month
    const effectiveDate = `${year}-${monthStr}-01`
    
    // Calculate last day of the month
    const lastDay = new Date(year, month, 0).getDate()
    const expirationDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`
    
    return { effectiveDate, expirationDate }
  }
  
  return { effectiveDate: '', expirationDate: null }
}

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

    let data = parseResult.data as any[]
    const fields = parseResult.meta.fields || []

    // Check if this is the new format (charges CSV) or original format
    const isNewFormat = NEW_FORMAT_FIELDS.every((field) => fields.includes(field))
    const isOriginalFormat = ORIGINAL_CHARGES_FORMAT_FIELDS.every((field) => fields.includes(field))
    
    if (isNewFormat || isOriginalFormat) {
      // Transform new format to expected format
      const seen = new Set<string>()
      const transformed: any[] = []
      
      // Debug: Log first few rows to see what we're getting
      console.log('=== CSV UPLOAD DEBUG START ===')
      console.log('CSV Fields:', fields)
      console.log('isNewFormat:', isNewFormat, 'isOriginalFormat:', isOriginalFormat)
      if (data.length > 0) {
        console.log('First row raw:', JSON.stringify(data[0], null, 2))
        console.log('First row keys:', Object.keys(data[0]))
        console.log('First row values:', Object.values(data[0]))
        
        // Check specifically for Coverage Name in first 30 rows
        console.log('\n=== COVERAGE NAME CHECK (first 30 rows) ===')
        let sdiCount = 0
        let tllCount = 0
        let otherCount = 0
        for (let i = 0; i < Math.min(30, data.length); i++) {
          const row = data[i]
          // Try all possible field name variations
          let coverageName = row['Coverage Name'] || row['coverage name'] || row['Coverage name'] || row['CoverageName'] || row['coverageName'] || row['"Coverage Name"'] || ''
          coverageName = String(coverageName).trim().replace(/^"|"$/g, '')
          
          const tenantName = row['Tenant Name'] || row['tenant name'] || row['Tenant name'] || row['TenantName'] || row['tenantName'] || row['"Tenant Name"'] || ''
          
          if (coverageName.toUpperCase() === 'SDI') sdiCount++
          else if (coverageName.toUpperCase() === 'TLL') tllCount++
          else if (coverageName) otherCount++
          
          if (i < 10) {
            console.log(`Row ${i}: Tenant="${String(tenantName).trim()}", Coverage="${coverageName}"`)
          }
        }
        console.log(`\nCoverage Name Summary: SDI=${sdiCount}, TLL=${tllCount}, Other=${otherCount}`)
      }
      console.log('=== CSV UPLOAD DEBUG END ===\n')
      
      for (const row of data) {
        // Handle both formats
        let tenantName: string
        let coverageName: string
        let chargeAmount: string
        let postDate: string
        
        if (isOriginalFormat) {
          // Original format: Charge Code, Resident, Current Charge Amount, Charge Post Month
          tenantName = (row['Resident'] || row['resident'] || '').trim()
          const chargeCode = (row['Charge Code'] || row['charge code'] || '').trim()
          coverageName = mapChargeCodeToCoverageName(chargeCode)
          chargeAmount = String(row['Current Charge Amount'] || row['current charge amount'] || '').trim()
          postDate = (row['Charge Post Month'] || row['charge post month'] || '').trim()
        } else {
          // New format: Tenant Name, Coverage Name, Current Charge Amount, Post Date
          // Try all possible field name variations (PapaParse might normalize differently)
          tenantName = (
            row['Tenant Name'] || 
            row['tenant name'] || 
            row['Tenant name'] || 
            row['TenantName'] || 
            row['tenantName'] ||
            row['"Tenant Name"'] ||
            ''
          ).trim().replace(/^"|"$/g, '') // Remove surrounding quotes if present
          
          coverageName = (
            row['Coverage Name'] || 
            row['coverage name'] || 
            row['Coverage name'] || 
            row['CoverageName'] || 
            row['coverageName'] ||
            row['"Coverage Name"'] ||
            ''
          ).trim().replace(/^"|"$/g, '') // Remove surrounding quotes if present
          
          chargeAmount = String(
            row['Current Charge Amount'] || 
            row['current charge amount'] || 
            row['CurrentChargeAmount'] ||
            row['currentChargeAmount'] ||
            row['"Current Charge Amount"'] ||
            ''
          ).trim().replace(/^"|"$/g, '')
          
          postDate = (
            row['Post Date'] || 
            row['post date'] || 
            row['Post date'] || 
            row['PostDate'] ||
            row['postDate'] ||
            row['"Post Date"'] ||
            ''
          ).trim().replace(/^"|"$/g, '')
        }
        
        if (!coverageName || !tenantName) {
          console.warn('Missing required field in row:', JSON.stringify(row))
          continue
        }
        
        // Create unique key for duplicate detection
        const duplicateKey = `${tenantName}|${coverageName}`.toLowerCase()
        
        // Skip duplicates
        if (seen.has(duplicateKey)) {
          continue
        }
        seen.add(duplicateKey)
        
        // Parse tenant name
        const { firstName, lastName } = parseTenantName(tenantName)
        
        // Parse post date
        const { effectiveDate, expirationDate } = parsePostDate(postDate)
        
        // Parse charge amount (handle negative values in parentheses like "(3.00)")
        let premiumAmount: number | null = null
        if (chargeAmount) {
          // Check if it's in parentheses format (negative)
          const isNegative = chargeAmount.startsWith('(') && chargeAmount.endsWith(')')
          const numericValue = chargeAmount.replace(/[^0-9.]/g, '')
          if (numericValue) {
            premiumAmount = parseFloat(numericValue)
            if (isNegative) {
              premiumAmount = -premiumAmount
            }
          }
        }
        
        // Transform to expected format
        const transformedRow = {
          'Status': 'Premium Paying', // Default status
          'Coverage Holder Name': tenantName,
          'First Name': firstName,
          'Last Name': lastName,
          'Coverage Name': coverageName, // This should be SDI or TLL
          'Premium Amount': premiumAmount,
          'Effective Date': effectiveDate,
          'Expiration Date': expirationDate,
        }
        
        // Debug: Log if coverage name is missing or wrong
        if (!coverageName || coverageName === '') {
          console.error('ERROR: Missing coverage name in transformed row:', transformedRow)
        }
        
        transformed.push(transformedRow)
      }
      
      data = transformed
      console.log(`Filtered ${parseResult.data.length} rows to ${data.length} unique enrollments (Tenant Name + Coverage Name)`)
      
      // Debug: Log coverage name distribution
      const coverageCounts: Record<string, number> = {}
      transformed.forEach((row) => {
        const covName = row['Coverage Name'] || ''
        coverageCounts[covName] = (coverageCounts[covName] || 0) + 1
      })
      console.log('Coverage Name distribution:', coverageCounts)
      
      // Debug: Show sample of what we're sending to database
      console.log('\n=== TRANSFORMED DATA SAMPLE (first 10 rows) ===')
      transformed.slice(0, 10).forEach((row, idx) => {
        console.log(`  Row ${idx}:`, {
          'Coverage Name': row['Coverage Name'],
          'Tenant Name': row['Coverage Holder Name'],
          'First Name': row['First Name'],
          'Last Name': row['Last Name']
        })
      })
      
      // Count coverage names in transformed data
      const transformedCoverageCounts: Record<string, number> = {}
      transformed.forEach((row) => {
        const covName = String(row['Coverage Name'] || '').trim()
        transformedCoverageCounts[covName] = (transformedCoverageCounts[covName] || 0) + 1
      })
      console.log('\nTransformed Coverage Name distribution:', transformedCoverageCounts)
      console.log('=== END TRANSFORMED DATA SAMPLE ===\n')
    } else {
      // Validate required fields for old format
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
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or all rows were filtered as duplicates' }, { status: 400 })
    }

    // Log first row for debugging
    if (data.length > 0) {
      console.log('First row sample:', JSON.stringify(data[0], null, 2))
      console.log('Total rows:', data.length)
    }

    // Use Supabase function to replace enrollments atomically
    const supabase = await createClient()
    
    // Debug: Check what we're sending to the database
    console.log('\n=== DATA BEING SENT TO DATABASE ===')
    console.log('Total rows:', data.length)
    const sampleForDB = data.slice(0, 5)
    console.log('Sample rows (first 5) being sent to DB:')
    sampleForDB.forEach((row, idx) => {
      console.log(`  DB Row ${idx}:`, {
        'Coverage Name': row['Coverage Name'],
        'Status': row['Status'],
        'First Name': row['First Name'],
        'Last Name': row['Last Name']
      })
    })
    
    // Check coverage name distribution in data being sent
    const dbCoverageCounts: Record<string, number> = {}
    data.forEach((row: any) => {
      const covName = String(row['Coverage Name'] || '').trim()
      dbCoverageCounts[covName] = (dbCoverageCounts[covName] || 0) + 1
    })
    console.log('Coverage Name distribution in data sent to DB:', dbCoverageCounts)
    
    // Find a TLL row to verify it's in the data
    const tllRow = data.find((row: any) => String(row['Coverage Name'] || '').trim().toUpperCase() === 'TLL')
    if (tllRow) {
      console.log('Found TLL row example:', JSON.stringify(tllRow, null, 2))
    } else {
      console.error('ERROR: No TLL row found in data being sent to DB!')
    }
    
    // Find an SDI row to compare
    const sdiRow = data.find((row: any) => String(row['Coverage Name'] || '').trim().toUpperCase() === 'SDI')
    if (sdiRow) {
      console.log('Found SDI row example:', JSON.stringify(sdiRow, null, 2))
    }
    
    console.log('=== END DATA TO DATABASE ===\n')
    
    const { data: result, error } = await supabase.rpc('replace_property_enrollments', {
      p_property_id: propertyId,
      p_enrollments: data,
      p_uploaded_by: user.id,
    })

    if (error) {
      console.error('Supabase RPC error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: error.message || 'Database error',
          details: error.details || error.hint || null,
          code: error.code || null
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: result,
      message: `Successfully uploaded ${result} enrollments`,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error && 'details' in error ? (error as any).details : null
      },
      { status: 500 }
    )
  }
}


