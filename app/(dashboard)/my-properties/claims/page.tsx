import { requireRole } from '@/lib/auth'
import { ClaimsTable } from '@/components/claims/claims-table'

export default async function MyPropertiesClaimsPage() {
  await requireRole(['property_manager'])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Claims</h1>
          <p className="text-gray-600 mt-2">View claims for your assigned properties</p>
        </div>

        <ClaimsTable />
      </div>
    </div>
  )
}

