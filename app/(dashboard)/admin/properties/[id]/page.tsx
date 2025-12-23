import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, Upload, FileText } from 'lucide-react'
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
    <div className="px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-5xl font-normal text-beagle-dark">{property.name}</h1>
            {property.address && (
              <p className="text-sm text-gray-600 mt-2">
                {[property.address, property.city, property.state, property.zip_code]
                  .filter(Boolean)
                  .join(', ')}
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
            <p className="text-4xl font-bold text-beagle-dark mt-2">{enrollmentCount || 0}</p>
          </div>
          {stats &&
            stats.map((stat: any) => (
              <div key={stat.status} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <p className="text-sm font-medium text-gray-600">{stat.status}</p>
                <p className="text-3xl font-bold text-beagle-dark mt-2">{stat.count}</p>
              </div>
            ))}
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

