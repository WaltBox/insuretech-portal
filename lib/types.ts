export type UserRole = 'admin' | 'centralized_member' | 'property_manager'

export interface User {
  id: string
  email: string
  role: UserRole
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  property_id: string
  enrollment_number: string
  status: string
  coverage_holder_name: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  unit_number?: string
  coverage_name: string
  coverage_rate?: string
  effective_date?: string
  expiration_date?: string
  paid_to_date?: string
  premium_amount?: number
  cost_amount?: number
  producer_name?: string
  reference_id?: string
  note?: string
  payment_source?: string
  creation_source?: string
  uploaded_at: string
  uploaded_by?: string
  created_at: string
  updated_at: string
}

export interface Claim {
  id: string
  property_id: string
  claim_number?: string
  claim_type?: string
  status?: string
  submitted_date?: string
  amount?: number
  participant_role?: string
  participant_first_name?: string
  participant_last_name?: string
  participant_email?: string
  participant_phone?: string
  participant_address?: string
  raw_data?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PropertyManager {
  id: string
  property_id: string
  user_id: string
  invited_by?: string
  created_at: string
}

export interface Invitation {
  id: string
  email: string
  property_id: string
  role: UserRole
  invited_by: string
  token: string
  expires_at: string
  accepted_at?: string
  created_at: string
}

export interface EnrollmentStats {
  status: string
  count: number
}

