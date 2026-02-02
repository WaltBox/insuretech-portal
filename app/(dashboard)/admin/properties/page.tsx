import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { Building2, Users, FileText, ChevronRight, MapPin } from 'lucide-react'

export default async function PropertiesPage() {
  const user = await requireRole(['admin'])
  const supabase = await createClient()

  // Parallel queries for better performance
  const [
    { data: properties },
    { count: totalEnrollments },
    { count: totalClaims }
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('*, enrollments(count), claims(count)')
      .order('created_at', { ascending: false }),
    supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
  ])

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-i3-navy">Properties</h1>
          <p className="text-sm text-i3-text-muted mt-2">Manage all properties in the system</p>
        </div>
        <Link
          href="/admin/properties/create"
          className="flex items-center gap-2 px-4 py-2 bg-i3-navy hover:bg-i3-navy-light text-white rounded-xl transition-colors duration-200"
        >
          <svg 
            className="h-5 w-5" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 5V19M5 12H19" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
          <span className="font-semibold text-sm">Create Property</span>
        </Link>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-2xl p-6 border border-i3-border shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-i3-navy/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-i3-navy" />
          </div>
          <h3 className="text-sm font-medium text-i3-text-muted">System Overview</h3>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <div className="bg-i3-bg rounded-xl px-4 py-3">
            <span className="text-xs text-i3-text-muted block">Total Properties</span>
            <span className="text-2xl font-bold text-i3-navy">{properties?.length || 0}</span>
          </div>

          <div className="bg-i3-bg rounded-xl px-4 py-3">
            <span className="text-xs text-i3-text-muted block">Total Enrollments</span>
            <span className="text-2xl font-bold text-i3-navy">{totalEnrollments || 0}</span>
          </div>

          <div className="bg-i3-bg rounded-xl px-4 py-3">
            <span className="text-xs text-i3-text-muted block">Active Claims</span>
            <span className="text-2xl font-bold text-i3-navy">{totalClaims || 0}</span>
          </div>
        </div>
      </div>

      {/* Properties List */}
      {properties && properties.length > 0 ? (
        <div className="space-y-4">
          {properties.map((property: any) => {
            const enrollmentCount = property.enrollments?.[0]?.count || 0
            const claimCount = property.claims?.[0]?.count || 0
            return (
              <Link
                key={property.id}
                href={`/admin/properties/${property.id}`}
                className="group flex items-center justify-between gap-4 px-6 py-4 bg-white rounded-xl border border-i3-border hover:border-i3-navy hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  {/* Property Name & Location */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-i3-navy mb-1 truncate">{property.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-i3-text-muted">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {[property.address, property.city, property.state].filter(Boolean).join(', ') || 'No address'}
                      </span>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-i3-border hidden sm:block"></div>

                  {/* Address */}
                  <div className="hidden md:block w-48 flex-shrink-0">
                    <p className="text-xs text-i3-text-muted mb-1">Address</p>
                    <p className="text-sm text-i3-text-secondary truncate">
                      {property.address || 'N/A'}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-i3-border hidden sm:block"></div>

                  {/* Enrollments */}
                  <div className="w-24 flex-shrink-0 text-center">
                    <p className="text-xs text-i3-text-muted mb-1">Enrollments</p>
                    <p className="text-lg font-bold text-i3-navy">{enrollmentCount}</p>
                  </div>

                  <div className="h-10 w-px bg-i3-border hidden sm:block"></div>

                  {/* Claims */}
                  <div className="w-20 flex-shrink-0 text-center">
                    <p className="text-xs text-i3-text-muted mb-1">Claims</p>
                    <p className="text-lg font-bold text-i3-navy">{claimCount}</p>
                  </div>

                  <div className="h-10 w-px bg-i3-border hidden sm:block"></div>

                  {/* Created Date */}
                  <div className="hidden lg:block w-28 flex-shrink-0 text-center">
                    <p className="text-xs text-i3-text-muted mb-1">Created</p>
                    <p className="text-xs text-i3-text-secondary">
                      {new Date(property.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-i3-text-muted group-hover:text-i3-navy transition-colors duration-200 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center border border-i3-border shadow-sm">
          <Building2 className="w-12 h-12 text-i3-text-muted mx-auto mb-4" />
          <p className="text-sm text-i3-text-muted mb-6">No properties yet. Create your first property to get started.</p>
          <Link
            href="/admin/properties/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-i3-navy hover:bg-i3-navy-light text-white rounded-xl transition-colors duration-200"
          >
            <svg 
              className="h-5 w-5" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 5V19M5 12H19" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
            <span className="font-semibold text-sm">Create Property</span>
          </Link>
        </div>
      )}
    </div>
  )
}

