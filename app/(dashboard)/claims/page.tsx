import { requireRole } from '@/lib/auth'
import { ClaimsTable } from '@/components/claims/claims-table'

export default async function ClaimsPage() {
  await requireRole(['admin', 'centralized_member'])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Claims</h1>
          <p className="text-gray-600 mt-2">View all claims across all properties</p>
        </div>

        <ClaimsTable />
      </div>
    </div>
  )
}

