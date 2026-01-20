import { createClient } from '@/lib/supabase/server'
import { requireRole, getActualUser } from '@/lib/auth'
import { UserTable } from '@/components/users/user-table'
import { PendingInvitationsTable } from '@/components/users/pending-invitations-table'

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UsersPage() {
  const currentUser = await requireRole(['admin'])
  const actualUser = await getActualUser()
  const supabase = await createClient()

  // Fetch users and pending invitations in parallel
  const [usersResult, invitationsResult] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        token,
        expires_at,
        created_at,
        metadata,
        invited_by,
        inviter:users!invited_by(first_name, last_name)
      `)
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
  ])

  const users = usersResult.data || []
  
  // Process invitations to add computed fields
  const now = new Date()
  const invitations = (invitationsResult.data || []).map(inv => ({
    ...inv,
    is_expired: new Date(inv.expires_at) < now,
    first_name: (inv.metadata as { first_name?: string })?.first_name || '',
    last_name: (inv.metadata as { last_name?: string })?.last_name || '',
  }))

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-normal text-beagle-dark">User Management</h1>
          <p className="text-sm text-gray-600 mt-2">Manage all users and pending invitations</p>
        </div>

        <PendingInvitationsTable initialInvitations={invitations} />
        <UserTable initialUsers={users} currentUserId={actualUser?.id || currentUser.id} />
      </div>
    </div>
  )
}

