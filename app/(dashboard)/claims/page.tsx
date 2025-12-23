import { requireRole } from '@/lib/auth'
import { ClaimsTable } from '@/components/claims/claims-table'

export default async function ClaimsPage() {
  await requireRole(['admin', 'centralized_member'])

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-normal text-beagle-dark">Claims</h1>
        <p className="text-sm text-gray-600 mt-2">View and manage all claims across properties</p>
      </div>

      <ClaimsTable />
    </div>
  )
}

