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
    <div className="px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-normal text-beagle-dark">Properties</h1>
          <p className="text-sm text-gray-600 mt-2">Manage all properties in the system</p>
        </div>
        <Link
          href="/admin/properties/create"
          className="flex items-center gap-2 group transition-colors duration-200"
        >
          <svg 
            className="h-5 w-5 transition-all duration-200" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              className="stroke-beagle-orange group-hover:fill-beagle-orange transition-all duration-200" 
              strokeWidth="2"
            />
            <path 
              d="M12 8V16M8 12H16" 
              className="stroke-beagle-orange group-hover:stroke-white transition-all duration-200" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
          <span className="font-semibold text-sm text-beagle-orange group-hover:text-accent-orange transition-colors duration-200">Create Property</span>
        </Link>
      </div>

      {/* Stats Card */}
      <div className="bg-orange-lighter rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/images/star.svg" alt="" width={20} height={20} className="w-5 h-5" />
          <h3 className="text-sm font-medium text-gray-700">System Overview</h3>
        </div>

        <div className="flex items-center gap-8 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-beagle-orange" />
            <span className="text-xs text-gray-600">Total Properties</span>
            <span className="text-2xl font-bold text-beagle-dark">{properties?.length || 0}</span>
          </div>

          <div className="h-8 w-px bg-gray-300"></div>

          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-beagle-orange" />
            <span className="text-xs text-gray-600">Total Enrollments</span>
            <span className="text-2xl font-bold text-beagle-dark">{totalEnrollments || 0}</span>
          </div>

          <div className="h-8 w-px bg-gray-300"></div>

          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-beagle-orange" />
            <span className="text-xs text-gray-600">Active Claims</span>
            <span className="text-2xl font-bold text-beagle-dark">{totalClaims || 0}</span>
          </div>
        </div>
      </div>

      {/* Properties List */}
      {properties && properties.length > 0 ? (
        <div className="space-y-3">
          {properties.map((property: any) => {
            const enrollmentCount = property.enrollments?.[0]?.count || 0
            const claimCount = property.claims?.[0]?.count || 0
            
            return (
              <Link
                key={property.id}
                href={`/admin/properties/${property.id}`}
                className="group flex items-center justify-between px-6 py-4 bg-white rounded-lg border border-gray-200 hover:border-beagle-orange hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-6 flex-1">
                  {/* Property Name & Address */}
                  <div className="w-64 flex-shrink-0">
                    <p className="text-sm font-semibold text-beagle-dark mb-1">{property.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {[property.city, property.state].filter(Boolean).join(', ') || 'No address'}
                      </span>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-gray-200"></div>

                  {/* Full Address */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-700 truncate">
                      {property.address || 'N/A'}
                    </p>
                  </div>

                  <div className="h-10 w-px bg-gray-200"></div>

                  {/* Enrollments */}
                  <div className="w-28 flex-shrink-0 text-center">
                    <p className="text-xs text-gray-500 mb-1">Enrollments</p>
                    <p className="text-lg font-bold text-beagle-dark">{enrollmentCount}</p>
                  </div>

                  <div className="h-10 w-px bg-gray-200"></div>

                  {/* Claims */}
                  <div className="w-24 flex-shrink-0 text-center">
                    <p className="text-xs text-gray-500 mb-1">Claims</p>
                    <p className="text-lg font-bold text-beagle-dark">{claimCount}</p>
                  </div>

                  <div className="h-10 w-px bg-gray-200"></div>

                  {/* Created Date */}
                  <div className="w-24 flex-shrink-0 text-center">
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-xs text-gray-700">
                      {new Date(property.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-beagle-dark group-hover:text-beagle-orange transition-colors duration-200 flex-shrink-0 ml-4" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-6">No properties yet. Create your first property to get started.</p>
          <Link
            href="/admin/properties/create"
            className="inline-flex items-center gap-2 group transition-colors duration-200"
          >
            <svg 
              className="h-5 w-5 transition-all duration-200" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                className="stroke-beagle-orange group-hover:fill-beagle-orange transition-all duration-200" 
                strokeWidth="2"
              />
              <path 
                d="M12 8V16M8 12H16" 
                className="stroke-beagle-orange group-hover:stroke-white transition-all duration-200" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
            <span className="font-semibold text-sm text-beagle-orange group-hover:text-accent-orange transition-colors duration-200">Create Property</span>
          </Link>
        </div>
      )}
    </div>
  )
}

