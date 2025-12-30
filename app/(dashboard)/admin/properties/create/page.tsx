import { requireRole } from '@/lib/auth'
import { PropertyForm } from '@/components/properties/property-form'

export default async function CreatePropertyPage() {
  await requireRole(['admin'])

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Property</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <PropertyForm />
        </div>
      </div>
    </div>
  )
}




