// Mock data for demo mode - no Supabase connection required
import { User, Property, Enrollment, Claim, PropertyManager, SupportTicket, SupportMessage } from './types'

// ============================================================
// MOCK USERS
// ============================================================
export const mockUsers: User[] = [
  {
    id: 'demo-admin-001',
    email: 'admin@demo.com',
    role: 'admin',
    first_name: 'Demo',
    last_name: 'Admin',
    phone: '555-100-0001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'demo-cm-001',
    email: 'sarah.johnson@demo.com',
    role: 'centralized_member',
    first_name: 'Sarah',
    last_name: 'Johnson',
    phone: '555-200-0001',
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z'
  },
  {
    id: 'demo-cm-002',
    email: 'michael.chen@demo.com',
    role: 'centralized_member',
    first_name: 'Michael',
    last_name: 'Chen',
    phone: '555-200-0002',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z'
  },
  {
    id: 'demo-pm-001',
    email: 'jessica.martinez@demo.com',
    role: 'property_manager',
    first_name: 'Jessica',
    last_name: 'Martinez',
    phone: '555-300-0001',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z'
  },
  {
    id: 'demo-pm-002',
    email: 'david.wilson@demo.com',
    role: 'property_manager',
    first_name: 'David',
    last_name: 'Wilson',
    phone: '555-300-0002',
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z'
  },
  {
    id: 'demo-pm-003',
    email: 'emily.rodriguez@demo.com',
    role: 'property_manager',
    first_name: 'Emily',
    last_name: 'Rodriguez',
    phone: '555-300-0003',
    created_at: '2024-04-15T00:00:00Z',
    updated_at: '2024-04-15T00:00:00Z'
  }
]

// ============================================================
// MOCK PROPERTIES
// ============================================================
export const mockProperties: Property[] = [
  {
    id: 'prop-001',
    name: 'Sunset Valley Apartments',
    address: '1234 Sunset Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zip_code: '90028',
    door_count: 156,
    created_by: 'demo-admin-001',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'prop-002',
    name: 'Highland Park Residences',
    address: '567 Oak Street',
    city: 'Dallas',
    state: 'TX',
    zip_code: '75201',
    door_count: 89,
    created_by: 'demo-admin-001',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  },
  {
    id: 'prop-003',
    name: 'Riverfront Towers',
    address: '890 River Road',
    city: 'Chicago',
    state: 'IL',
    zip_code: '60601',
    door_count: 234,
    created_by: 'demo-admin-001',
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z'
  },
  {
    id: 'prop-004',
    name: 'Marina Bay Complex',
    address: '321 Harbor Way',
    city: 'San Diego',
    state: 'CA',
    zip_code: '92101',
    door_count: 178,
    created_by: 'demo-admin-001',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z'
  },
  {
    id: 'prop-005',
    name: 'Mountain View Gardens',
    address: '456 Alpine Drive',
    city: 'Denver',
    state: 'CO',
    zip_code: '80202',
    door_count: 112,
    created_by: 'demo-admin-001',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z'
  },
  {
    id: 'prop-006',
    name: 'Peachtree Plaza',
    address: '789 Peachtree St NE',
    city: 'Atlanta',
    state: 'GA',
    zip_code: '30308',
    door_count: 145,
    created_by: 'demo-admin-001',
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z'
  }
]

// ============================================================
// MOCK PROPERTY MANAGERS (Junction table)
// ============================================================
export const mockPropertyManagers: PropertyManager[] = [
  { id: 'pm-assign-001', property_id: 'prop-001', user_id: 'demo-pm-001', invited_by: 'demo-admin-001', created_at: '2024-03-15T00:00:00Z' },
  { id: 'pm-assign-002', property_id: 'prop-002', user_id: 'demo-pm-001', invited_by: 'demo-admin-001', created_at: '2024-03-15T00:00:00Z' },
  { id: 'pm-assign-003', property_id: 'prop-003', user_id: 'demo-pm-002', invited_by: 'demo-admin-001', created_at: '2024-04-01T00:00:00Z' },
  { id: 'pm-assign-004', property_id: 'prop-004', user_id: 'demo-pm-002', invited_by: 'demo-admin-001', created_at: '2024-04-01T00:00:00Z' },
  { id: 'pm-assign-005', property_id: 'prop-005', user_id: 'demo-pm-003', invited_by: 'demo-admin-001', created_at: '2024-04-15T00:00:00Z' },
  { id: 'pm-assign-006', property_id: 'prop-006', user_id: 'demo-pm-003', invited_by: 'demo-admin-001', created_at: '2024-04-15T00:00:00Z' },
]

// ============================================================
// MOCK ENROLLMENTS
// ============================================================
const enrollmentStatuses = ['Premium Paying', 'Active', 'Pending', 'Cancelled', 'Expired']
const coverageTypes = ['SDI', 'TLL', 'Pet Damage Waiver', 'Renters Insurance']
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson']

function generateEnrollments(): Enrollment[] {
  const enrollments: Enrollment[] = []
  let enrollmentCounter = 1

  mockProperties.forEach((property) => {
    // Generate 15-40 enrollments per property
    const enrollmentCount = Math.floor(Math.random() * 26) + 15
    
    for (let i = 0; i < enrollmentCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const status = enrollmentStatuses[Math.floor(Math.random() * enrollmentStatuses.length)]
      const coverageName = coverageTypes[Math.floor(Math.random() * coverageTypes.length)]
      const unitNumber = `${Math.floor(Math.random() * 20) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`
      
      // Generate dates within the last year
      const daysAgo = Math.floor(Math.random() * 365)
      const effectiveDate = new Date()
      effectiveDate.setDate(effectiveDate.getDate() - daysAgo)
      const expirationDate = new Date(effectiveDate)
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)
      
      enrollments.push({
        id: `enroll-${String(enrollmentCounter).padStart(5, '0')}`,
        property_id: property.id,
        enrollment_number: `ENR-2024-${String(enrollmentCounter).padStart(5, '0')}`,
        status,
        coverage_holder_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tenant.com`,
        phone: `555-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
        address1: property.address,
        address2: `Unit ${unitNumber}`,
        city: property.city,
        state: property.state,
        zip: property.zip_code,
        unit_number: unitNumber,
        coverage_name: coverageName,
        coverage_rate: `$${(Math.random() * 50 + 10).toFixed(2)}/mo`,
        effective_date: effectiveDate.toISOString().split('T')[0],
        expiration_date: expirationDate.toISOString().split('T')[0],
        paid_to_date: effectiveDate.toISOString().split('T')[0],
        premium_amount: parseFloat((Math.random() * 500 + 100).toFixed(2)),
        cost_amount: parseFloat((Math.random() * 400 + 80).toFixed(2)),
        producer_name: 'Beagle Insurance',
        reference_id: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        note: undefined,
        payment_source: 'Credit Card',
        creation_source: 'Online Portal',
        uploaded_at: new Date().toISOString(),
        uploaded_by: 'demo-admin-001',
        created_at: effectiveDate.toISOString(),
        updated_at: effectiveDate.toISOString()
      })
      
      enrollmentCounter++
    }
  })

  return enrollments
}

export const mockEnrollments: Enrollment[] = generateEnrollments()

// ============================================================
// MOCK CLAIMS
// ============================================================
const claimTypes = ['Water Damage', 'Fire Damage', 'Theft', 'Property Damage', 'Liability', 'Vandalism', 'Medical', 'Appliance Malfunction']
const claimStatuses = ['Under Review', 'Approved', 'Pending', 'Rejected', 'Paid']

function generateClaims(): Claim[] {
  const claims: Claim[] = []
  let claimCounter = 1

  mockProperties.forEach((property) => {
    // Generate 3-8 claims per property
    const claimCount = Math.floor(Math.random() * 6) + 3
    
    for (let i = 0; i < claimCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)]
      const status = claimStatuses[Math.floor(Math.random() * claimStatuses.length)]
      // Generate recent dates (within the last 60 days)
      const daysAgo = Math.floor(Math.random() * 60)
      const submittedDate = new Date()
      submittedDate.setDate(submittedDate.getDate() - daysAgo)
      
      claims.push({
        id: `claim-${String(claimCounter).padStart(5, '0')}`,
        property_id: property.id,
        claim_number: `CLM-2024-${String(claimCounter).padStart(4, '0')}`,
        claim_type: claimType,
        status,
        submitted_date: submittedDate.toISOString(),
        amount: parseFloat((Math.random() * 5000 + 500).toFixed(2)),
        participant_role: 'Tenant',
        participant_first_name: firstName,
        participant_last_name: lastName,
        participant_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tenant.com`,
        participant_phone: `555-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
        participant_address: `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`,
        filed_by_email: mockUsers.find(u => u.role === 'centralized_member')?.email,
        raw_data: {
          incident_date: new Date(submittedDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: `${claimType} incident reported by tenant`,
          filed_by: 'Tenant'
        },
        created_at: submittedDate.toISOString(),
        updated_at: submittedDate.toISOString()
      })
      
      claimCounter++
    }
  })

  return claims
}

export const mockClaims: Claim[] = generateClaims()

// ============================================================
// MOCK SUPPORT TICKETS
// ============================================================
export const mockSupportTickets: SupportTicket[] = [
  {
    id: 'ticket-001',
    user_id: 'demo-pm-001',
    subject: 'Cannot upload enrollment CSV',
    status: 'open',
    created_at: '2024-12-01T10:30:00Z',
    updated_at: '2024-12-01T14:22:00Z',
    user: mockUsers.find(u => u.id === 'demo-pm-001') as SupportTicket['user'],
    messages: [
      {
        id: 'msg-001',
        ticket_id: 'ticket-001',
        sender_id: 'demo-pm-001',
        sender_type: 'user',
        content: 'I\'m trying to upload a CSV file with new enrollments but the system keeps showing an error. The file is 2MB and has 150 rows.',
        created_at: '2024-12-01T10:30:00Z'
      },
      {
        id: 'msg-002',
        ticket_id: 'ticket-001',
        sender_id: 'demo-admin-001',
        sender_type: 'admin',
        content: 'Hi Jessica, could you please share the exact error message you\'re seeing? Also, can you confirm the CSV has the required column headers?',
        created_at: '2024-12-01T14:22:00Z'
      }
    ]
  },
  {
    id: 'ticket-002',
    user_id: 'demo-pm-002',
    subject: 'Request for property access',
    status: 'resolved',
    created_at: '2024-11-28T09:15:00Z',
    updated_at: '2024-11-29T11:00:00Z',
    user: mockUsers.find(u => u.id === 'demo-pm-002') as SupportTicket['user'],
    messages: [
      {
        id: 'msg-003',
        ticket_id: 'ticket-002',
        sender_id: 'demo-pm-002',
        sender_type: 'user',
        content: 'I need access to view the Mountain View Gardens property enrollments. I was told this would be assigned to me.',
        created_at: '2024-11-28T09:15:00Z'
      },
      {
        id: 'msg-004',
        ticket_id: 'ticket-002',
        sender_id: 'demo-admin-001',
        sender_type: 'admin',
        content: 'Access has been granted. You should now be able to see Mountain View Gardens in your property list. Please let me know if you have any issues.',
        created_at: '2024-11-29T11:00:00Z'
      }
    ]
  },
  {
    id: 'ticket-003',
    user_id: 'demo-cm-001',
    subject: 'Dashboard statistics not loading',
    status: 'open',
    created_at: '2024-12-02T16:45:00Z',
    updated_at: '2024-12-02T16:45:00Z',
    user: mockUsers.find(u => u.id === 'demo-cm-001') as SupportTicket['user'],
    messages: [
      {
        id: 'msg-005',
        ticket_id: 'ticket-003',
        sender_id: 'demo-cm-001',
        sender_type: 'user',
        content: 'The enrollment statistics on the dashboard are showing zeros for all properties, even though I know there are active enrollments.',
        created_at: '2024-12-02T16:45:00Z'
      }
    ]
  }
]

// ============================================================
// MOCK INVITATIONS
// ============================================================
export const mockInvitations = [
  {
    id: 'invite-001',
    email: 'newmanager@example.com',
    property_id: 'prop-001',
    role: 'property_manager' as const,
    invited_by: 'demo-admin-001',
    token: 'demo-token-001',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: undefined,
    created_at: new Date().toISOString()
  }
]

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export function getMockUser(role?: string): User {
  if (role) {
    const user = mockUsers.find(u => u.role === role)
    if (user) return user
  }
  // Default to admin for demo
  return mockUsers[0]
}

export function getMockUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id)
}

export function getMockPropertiesForUser(userId: string, userRole: string): Property[] {
  if (userRole === 'admin' || userRole === 'centralized_member') {
    return mockProperties
  }
  
  // Property managers only see their assigned properties
  const assignedPropertyIds = mockPropertyManagers
    .filter(pm => pm.user_id === userId)
    .map(pm => pm.property_id)
  
  return mockProperties.filter(p => assignedPropertyIds.includes(p.id))
}

export function getMockEnrollmentsForProperty(propertyId: string): Enrollment[] {
  return mockEnrollments.filter(e => e.property_id === propertyId)
}

export function getMockClaimsForProperty(propertyId: string): Claim[] {
  return mockClaims.filter(c => c.property_id === propertyId)
}

export function getMockEnrollmentStats() {
  const stats: Record<string, number> = {}
  mockEnrollments.forEach(e => {
    stats[e.status] = (stats[e.status] || 0) + 1
  })
  return Object.entries(stats).map(([status, count]) => ({ status, count }))
}

export function getMockSdiCount(): number {
  return mockEnrollments.filter(e => e.coverage_name.toLowerCase() === 'sdi').length
}

export function getMockTllCount(): number {
  return mockEnrollments.filter(e => e.coverage_name.toLowerCase() === 'tll').length
}

export function getMockPremiumPayingCount(): number {
  return mockEnrollments.filter(e => e.status === 'Premium Paying').length
}

export function getMockTotalDoors(): number {
  return mockProperties.reduce((sum, p) => sum + (p.door_count || 0), 0)
}

// Current demo user - can be changed to test different roles
export const DEMO_USER = mockUsers[0] // Admin by default
