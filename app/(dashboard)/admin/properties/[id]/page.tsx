import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Edit, Upload, FileText, ArrowLeft } from 'lucide-react'
import { CSVUploader } from '@/components/properties/csv-uploader'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(['admin'])
  const supabase = await createClient()

  // Run all queries in parallel for better performance
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

  // Calculate total from stats instead of separate query
  const enrollmentCount = stats?.reduce((sum: number, stat: any) => sum + Number(stat.count), 0) || 0

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-2 text-beagle-orange hover:text-accent-orange transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-normal text-beagle-dark">{property.name}</h1>
              {property.address && (
                <p className="text-sm text-gray-600 mt-2">
                  {[property.address, property.city, property.state, property.zip_code]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {property.door_count && (
                <p className="text-sm text-gray-600 mt-1">
                  {property.door_count} {property.door_count === 1 ? 'door' : 'doors'}
                </p>
              )}
            </div>
            <Link
              href={`/admin/properties/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg font-medium text-sm hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>
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

        {/* CSV Upload */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-beagle-orange" />
            <h2 className="text-2xl font-semibold text-beagle-dark">Upload Enrollments</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Upload a CSV file to replace all enrollments for this property. The previous data will be deleted.
          </p>
          <CSVUploader propertyId={id} />
        </div>

        {/* View Enrollments */}
        <Link
          href={`/admin/properties/${id}/enrollments`}
          className="flex items-center justify-center gap-2 bg-beagle-orange text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-accent-orange active:bg-[#e66d00] shadow-sm hover:shadow-md transition-all duration-200"
        >
          <FileText className="h-4 w-4" />
          View All Enrollments
        </Link>
      </div>
    </div>
  )
}

