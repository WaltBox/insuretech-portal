import { createClient } from '@/lib/supabase/server'
import { requireRole, getActualUser } from '@/lib/auth'
import { UserTable } from '@/components/users/user-table'

export default async function UsersPage() {
  const currentUser = await requireRole(['admin'])
  const actualUser = await getActualUser()
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-normal text-beagle-dark">User Management</h1>
          <p className="text-sm text-gray-600 mt-2">Manage all users in the system</p>
        </div>

        <UserTable initialUsers={users || []} currentUserId={actualUser?.id || currentUser.id} />
      </div>
    </div>
  )
}

