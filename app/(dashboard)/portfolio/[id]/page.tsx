import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/portfolio"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolio
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

        {/* Property Managers */}
        {managers && managers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Property Managers</h2>
            </div>
            <div className="space-y-2">
              {managers.map((manager: any) => (
                <div key={manager.id} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {manager.user.first_name[0]}{manager.user.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
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

