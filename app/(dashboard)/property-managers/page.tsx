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
    <div className="px-8 py-8">
      <PropertyManagersList />
    </div>
  )
}

