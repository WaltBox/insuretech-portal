import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, Users, FileText, ChevronRight } from 'lucide-react'

export default async function PortfolioPage() {
  await requireRole(['centralized_member', 'admin'])
  const supabase = await createClient()

  // Parallel queries for better performance
  const [
    { data: properties },
    { count: totalEnrollments },
    { count: totalClaims },
    { data: recentEnrollments }
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('*, enrollments(count)')
      .order('created_at', { ascending: false }),
    supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('claims')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('enrollments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
  ])


  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-normal text-beagle-dark">Portfolio Overview</h1>
        <p className="text-sm text-gray-600 mt-2">Monitor performance across your entire portfolio</p>
      </div>

      {/* Single Consolidated Stats Card */}
      <div className="bg-orange-lighter rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/images/star.svg" alt="" width={20} height={20} className="w-5 h-5" />
          <h3 className="text-sm font-medium text-gray-700">Portfolio Metrics</h3>
        </div>

        <div className="flex items-center gap-8 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-beagle-orange" />
            <span className="text-xs text-gray-600">Properties</span>
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

      {/* Properties List - Compact */}
      <h2 className="text-sm font-semibold text-beagle-dark mb-4">Your Properties</h2>
      {properties && properties.length > 0 ? (
        <div className="space-y-3 mb-8">
          {properties.map((property: { id: string; name: string; address?: string; city?: string; state?: string; zip_code?: string; created_at: string; enrollments?: { count: number }[] }) => {
            const enrollmentCount = property.enrollments?.[0]?.count || 0
            const fullAddress = [property.address, property.city, property.state, property.zip_code].filter(Boolean).join(', ')
            
            return (
              <Link
                key={property.id}
                href={`/portfolio/${property.id}`}
                className="group flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-beagle-orange hover:shadow-md transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-beagle-dark mb-1 truncate">{property.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {fullAddress || 'No address'}
                  </p>
                </div>

                <div className="flex items-center gap-6 ml-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Enrollments</p>
                    <p className="text-lg font-bold text-beagle-dark">{enrollmentCount}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Created</p>
                    <p className="text-xs text-gray-700">
                      {new Date(property.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-beagle-dark group-hover:text-beagle-orange transition-colors duration-200 flex-shrink-0 ml-2" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-600">No properties in portfolio yet.</p>
        </div>
      )}

      {/* Recent Activity */}
      {recentEnrollments && recentEnrollments.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-beagle-dark mb-4">Recent Enrollments</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {recentEnrollments.slice(0, 5).map((enrollment: { id: string; first_name: string; last_name: string; coverage_name: string; created_at: string }) => (
                <div key={enrollment.id} className="px-6 py-3 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-beagle-dark">
                        {enrollment.first_name} {enrollment.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{enrollment.coverage_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        {new Date(enrollment.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

