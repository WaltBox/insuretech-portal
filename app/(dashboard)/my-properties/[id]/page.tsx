import { createClient } from '@/lib/supabase/server'
import { requireRole, getCurrentUser, checkPermission } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
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
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/my-properties"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Properties
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
          {property.address && (
            <p className="text-gray-600 mt-2">
              {[property.address, property.city, property.state, property.zip_code]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600">Total Enrollments</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{enrollmentCount || 0}</p>
          </div>
          {stats &&
            stats.map((stat: any) => (
              <div key={stat.status} className="bg-white rounded-lg shadow-md p-6">
                <p className="text-sm text-gray-600">{stat.status}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.count}</p>
              </div>
            ))}
        </div>

        {/* Enrollments */}
        <EnrollmentTable propertyId={id} />
      </div>
    </div>
  )
}

