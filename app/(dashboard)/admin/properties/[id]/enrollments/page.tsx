import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EnrollmentTable } from '@/components/enrollments/enrollment-table'

export default async function PropertyEnrollmentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(['admin'])
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (!property) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/admin/properties/${id}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Property
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{property.name} - Enrollments</h1>
        </div>

        <EnrollmentTable propertyId={id} />
      </div>
    </div>
  )
}




