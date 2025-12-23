import { createClient } from '@/lib/supabase/server'
import { requireRole, checkPermission } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { EnrollmentTable } from '@/components/enrollments/enrollment-table'

export default async function MyPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireRole(['property_manager'])
  
  // Check if user has permission to view this property
  const hasPermission = await checkPermission(user.id, id)
  if (!hasPermission) {
    redirect('/my-properties')
  }

  const supabase = await createClient()

  // Run queries in parallel
  const [
    { data: property },
    { data: stats }
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single(),
    supabase.rpc('get_enrollment_stats', { p_property_id: id })
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
            href="/my-properties"
            className="inline-flex items-center gap-2 text-beagle-orange hover:text-accent-orange transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Properties
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

        {/* Enrollments */}
        <EnrollmentTable propertyId={id} />
      </div>
    </div>
  )
}

