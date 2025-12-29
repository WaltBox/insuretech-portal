import { requireRole, getCurrentUser } from '@/lib/auth'
import { ClaimsTable } from '@/components/claims/claims-table'

export default async function ClaimsPage() {
  await requireRole(['admin', 'centralized_member'])
  const user = await getCurrentUser()

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-normal text-beagle-dark">Claims</h1>
        <p className="text-sm text-gray-600 mt-2">View and manage all claims across properties</p>
      </div>

      <ClaimsTable userEmail={user?.email} />
    </div>
  )
}

