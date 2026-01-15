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
      
      for (const row of data) {
        // Handle both formats
        let tenantName: string
        let coverageName: string
        let chargeAmount: string
        let postDate: string
        let unitNumber: string = ''
        
        // Extract unit number (try various field name variations)
        unitNumber = (
          row['Unit Number'] ||
          row['unit number'] ||
          row['Unit number'] ||
          row['UnitNumber'] ||
          row['unitNumber'] ||
          row['Unit #'] ||
          row['unit #'] ||
          row['Unit'] ||
          row['unit'] ||
          row['"Unit Number"'] ||
          ''
        ).trim().replace(/^"|"$/g, '')
        
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
          'Unit Number': unitNumber,
        }
        
        transformed.push(transformedRow)
      }
      
      data = transformed
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
      
      // Normalize unit_number field name to "Unit Number" for legacy format
      // This ensures the database function can find it regardless of CSV column name variation
      data = data.map((row: any) => {
        // Extract unit number from any possible column name variation
        const unitNumber = (
          row['Unit Number'] ||
          row['unit number'] ||
          row['Unit number'] ||
          row['UnitNumber'] ||
          row['unitNumber'] ||
          row['Unit #'] ||
          row['unit #'] ||
          row['Unit'] ||
          row['unit'] ||
          row['"Unit Number"'] ||
          ''
        ).trim().replace(/^"|"$/g, '')
        
        // Normalize to "Unit Number" key (remove other variations)
        const normalizedRow = { ...row }
        delete normalizedRow['unit number']
        delete normalizedRow['Unit number']
        delete normalizedRow['UnitNumber']
        delete normalizedRow['unitNumber']
        delete normalizedRow['Unit #']
        delete normalizedRow['unit #']
        delete normalizedRow['Unit']
        delete normalizedRow['unit']
        delete normalizedRow['"Unit Number"']
        
        // Set the normalized key
        if (unitNumber) {
          normalizedRow['Unit Number'] = unitNumber
        }
        
        return normalizedRow
      })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or all rows were filtered as duplicates' }, { status: 400 })
    }

    // Use Supabase function to replace enrollments atomically
    const supabase = await createClient()
    
    const { data: result, error } = await supabase.rpc('replace_property_enrollments', {
      p_property_id: propertyId,
      p_enrollments: data,
      p_uploaded_by: user.id,
    })

    if (error) {
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
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error && 'details' in error ? (error as any).details : null
      },
      { status: 500 }
    )
  }
}


