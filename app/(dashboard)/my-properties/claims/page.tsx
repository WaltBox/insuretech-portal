import { requireRole } from '@/lib/auth'
import { ClaimsTable } from '@/components/claims/claims-table'

export default async function MyPropertiesClaimsPage() {
  await requireRole(['property_manager'])

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-normal text-beagle-dark">My Claims</h1>
        <p className="text-sm text-gray-600 mt-2">View claims for your assigned properties</p>
      </div>

      <ClaimsTable />
    </div>
  )
}

