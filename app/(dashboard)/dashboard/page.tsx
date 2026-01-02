import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  const fetchRecentStats = async (propertyId?: string) => {
    if (!propertyId) return []
    const { data: stats } = await supabase.rpc('get_enrollment_stats', { p_property_id: propertyId })
    return stats || []
  }

  if (user.role === 'admin') {
    const [
      { count: propertyCount },
      { count: userCount },
      { count: enrollmentCount },
      { data: allProperties },
      { data: recentProperties }
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('door_count').order('created_at', { ascending: false }),
      supabase.from('properties').select('*').order('created_at', { ascending: false })
    ])

    // Calculate total doors from door_count field
    const totalDoors = allProperties?.reduce((sum, property) => {
      return sum + (property.door_count || 0)
    }, 0) || 0

    const stats = await fetchRecentStats(recentProperties?.[0]?.id)

    return (
      <DashboardShell
        enrollmentCount={enrollmentCount || 0}
        propertyCount={propertyCount || 0}
        totalDoors={totalDoors}
        propertyStats={stats}
        recentProperties={recentProperties || []}
        currentUser={user}
      />
    )
  }

  if (user.role === 'centralized_member' || user.role === 'property_manager') {
    const [
      { count: propertyCount },
      { count: enrollmentCount },
      { data: allProperties },
      { data: recentProperties }
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('door_count').order('created_at', { ascending: false }),
      supabase.from('properties').select('*').order('created_at', { ascending: false })
    ])

    // Calculate total doors from door_count field
    const totalDoors = allProperties?.reduce((sum, property) => {
      return sum + (property.door_count || 0)
    }, 0) || 0

    const stats = await fetchRecentStats(recentProperties?.[0]?.id)

    return (
      <DashboardShell
        enrollmentCount={enrollmentCount || 0}
        propertyCount={propertyCount || 0}
        totalDoors={totalDoors}
        propertyStats={stats}
        recentProperties={recentProperties || []}
        currentUser={user}
      />
    )
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <p className="text-sm text-gray-600">Dashboard content is not available for your role.</p>
    </div>
  )
}
