import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users } from 'lucide-react'
import { EnrollmentTable } from '@/components/enrollments/enrollment-table'

export default async function PortfolioPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(['centralized_member', 'admin'])
  const supabase = await createClient()

  // Run all queries in parallel
  const [
    { data: property },
    { data: stats },
    { data: managers }
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single(),
    supabase.rpc('get_enrollment_stats', { p_property_id: id }),
    supabase
      .from('property_managers')
      .select(`
        id,
        user:users!property_managers_user_id_fkey(first_name, last_name, email)
      `)
      .eq('property_id', id)
  ])

  if (!property) {
    notFound()
  }

  // Calculate total from stats
  const enrollmentCount = stats?.reduce((sum: number, stat: any) => sum + Number(stat.count), 0) || 0

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-beagle-orange hover:text-accent-orange transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolio
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-normal text-beagle-dark">{property.name}</h1>
          {property.address && (
            <p className="text-sm text-gray-600 mt-2">
              {[property.address, property.city, property.state, property.zip_code]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-orange-lighter rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/images/star.svg" alt="" width={20} height={20} className="w-5 h-5" />
            <h3 className="text-sm font-medium text-gray-700">Enrollment Breakdown</h3>
          </div>

          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Total Enrollments</span>
              <span className="text-2xl font-bold text-beagle-dark">{enrollmentCount || 0}</span>
            </div>

            {stats && stats.map((stat: any) => (
              <>
                <div className="h-8 w-px bg-gray-300"></div>
                <div key={stat.status} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">{stat.status}</span>
                  <span className="text-2xl font-bold text-beagle-dark">{stat.count}</span>
                </div>
              </>
            ))}
          </div>
        </div>

        {/* Property Managers */}
        {managers && managers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-beagle-orange" />
              <h2 className="text-xl font-semibold text-beagle-dark">Property Managers</h2>
            </div>
            <div className="space-y-2">
              {managers.map((manager: any) => (
                <div key={manager.id} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-light rounded-full flex items-center justify-center">
                    <span className="text-beagle-orange font-semibold">
                      {manager.user.first_name[0]}{manager.user.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-beagle-dark">
                      {manager.user.first_name} {manager.user.last_name}
                    </p>
                    <p className="text-gray-500">{manager.user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enrollments */}
        <EnrollmentTable propertyId={id} />
      </div>
    </div>
  )
}

