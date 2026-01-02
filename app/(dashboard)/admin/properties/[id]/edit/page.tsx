import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { PropertyForm } from '@/components/properties/property-form'

export default async function EditPropertyPage({
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Property</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <PropertyForm property={property} />
        </div>
      </div>
    </div>
  )
}






