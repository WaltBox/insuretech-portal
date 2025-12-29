import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PropertyManagersList } from '@/components/property-managers/property-managers-list'

export default async function PropertyManagersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!['admin', 'centralized_member'].includes(user.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <PropertyManagersList />
    </div>
  )
}



