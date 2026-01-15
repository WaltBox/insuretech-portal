import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Ensure impersonation context is set before queries (important for connection pooling)
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  if (impersonateUserId) {
    try {
      await supabase.rpc('set_impersonation_context', { user_id: impersonateUserId })
    } catch (error) {
      // Silently fail - impersonation context setting is optional
    }
  }

  if (user.role === 'admin') {
    const [
      { count: propertyCount },
      { count: userCount },
      { count: enrollmentCount },
      { data: allProperties },
      { data: recentProperties },
      { count: premiumPayingCount },
      { count: sdiCount },
      { count: tllCount }
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('door_count').order('created_at', { ascending: false }),
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'Premium Paying'),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('coverage_name', 'SDI'),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('coverage_name', 'TLL')
    ])

    // Calculate total doors from door_count field
    const totalDoors = allProperties?.reduce((sum, property) => {
      return sum + (property.door_count || 0)
    }, 0) || 0

    // Create stats array with accurate counts across all properties
    const stats = [
      { status: 'Premium Paying', count: premiumPayingCount || 0 }
    ]

    return (
      <DashboardShell
        enrollmentCount={enrollmentCount || 0}
        propertyCount={propertyCount || 0}
        totalDoors={totalDoors}
        propertyStats={stats}
        recentProperties={recentProperties || []}
        currentUser={user}
        sdiCount={sdiCount || 0}
        tllCount={tllCount || 0}
      />
    )
  }

  if (user.role === 'centralized_member' || user.role === 'property_manager') {
    // For property managers, RLS isn't working correctly for enrollments during impersonation
    // So we'll use direct property filtering instead (same approach as my-properties page)
    if (user.role === 'property_manager') {
      // Get properties assigned to this property manager
      const { data: pmAssignments } = await supabase
        .from('property_managers')
        .select('property:properties(id, name, city, state, door_count, created_at)')
        .eq('user_id', user.id)
      
      const properties = pmAssignments?.map((a: any) => a.property).filter(Boolean) || []
      const propertyIds = properties.map((p: any) => p.id)
      const propertyCount = properties.length
      
      // Get enrollments for these specific properties (direct filter, doesn't rely on RLS)
      const [
        { data: enrollmentData, count: enrollmentCountActual },
        { data: allProperties },
        { data: recentProperties },
        { data: premiumPayingData },
        { data: sdiData },
        { data: tllData }
      ] = await Promise.all([
        propertyIds.length > 0
          ? supabase.from('enrollments').select('id', { count: 'exact' }).in('property_id', propertyIds)
          : Promise.resolve({ data: [], count: 0 }),
        propertyIds.length > 0
          ? supabase.from('properties').select('door_count').in('id', propertyIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        Promise.resolve({ data: properties }),
        propertyIds.length > 0
          ? supabase.from('enrollments').select('id', { count: 'exact' }).in('property_id', propertyIds).eq('status', 'Premium Paying')
          : Promise.resolve({ data: [], count: 0 }),
        propertyIds.length > 0
          ? supabase.from('enrollments').select('id', { count: 'exact' }).in('property_id', propertyIds).eq('coverage_name', 'SDI')
          : Promise.resolve({ data: [], count: 0 }),
        propertyIds.length > 0
          ? supabase.from('enrollments').select('id', { count: 'exact' }).in('property_id', propertyIds).eq('coverage_name', 'TLL')
          : Promise.resolve({ data: [], count: 0 })
      ])
      
      // Calculate counts - use count if available, otherwise use data length
      const enrollmentCount = (enrollmentCountActual ?? enrollmentData?.length) || 0
      const premiumPayingCount = (premiumPayingData?.length) || 0
      const sdiCount = (sdiData?.length) || 0
      const tllCount = (tllData?.length) || 0
      
      // Calculate total doors
      const totalDoors = allProperties?.reduce((sum: number, property: any) => {
        return sum + (property.door_count || 0)
      }, 0) || 0
      
      // Sort properties for recent properties list
      const recentPropertiesSorted = properties
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          city: p.city,
          state: p.state
        }))
      
      const stats = [
        { status: 'Premium Paying', count: premiumPayingCount || 0 }
      ]
      
      return (
        <DashboardShell
          enrollmentCount={enrollmentCount}
          propertyCount={propertyCount}
          totalDoors={totalDoors}
          propertyStats={stats}
          recentProperties={recentPropertiesSorted}
          currentUser={user}
          sdiCount={sdiCount}
          tllCount={tllCount}
        />
      )
    }
    
    // For centralized_members, RLS should work fine - use the standard approach
    const [
      { count: propertyCount },
      { data: enrollmentData, count: enrollmentCountActual },
      { data: allProperties },
      { data: recentProperties },
      { data: premiumPayingData },
      { data: sdiData },
      { data: tllData }
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('id', { count: 'exact' }).limit(10000),
      supabase.from('properties').select('door_count').order('created_at', { ascending: false }),
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('id', { count: 'exact' }).eq('status', 'Premium Paying').limit(10000),
      supabase.from('enrollments').select('id', { count: 'exact' }).eq('coverage_name', 'SDI').limit(10000),
      supabase.from('enrollments').select('id', { count: 'exact' }).eq('coverage_name', 'TLL').limit(10000)
    ])
    
    const enrollmentCount = (enrollmentCountActual ?? enrollmentData?.length) || 0
    const premiumPayingCount = premiumPayingData?.length || 0
    const sdiCount = sdiData?.length || 0
    const tllCount = tllData?.length || 0

    // Calculate total doors from door_count field
    const totalDoors = allProperties?.reduce((sum, property) => {
      return sum + (property.door_count || 0)
    }, 0) || 0

    // Create stats array with accurate counts across all properties
    const stats = [
      { status: 'Premium Paying', count: premiumPayingCount || 0 }
    ]

    return (
      <DashboardShell
        enrollmentCount={enrollmentCount || 0}
        propertyCount={propertyCount || 0}
        totalDoors={totalDoors}
        propertyStats={stats}
        recentProperties={recentProperties || []}
        currentUser={user}
        sdiCount={sdiCount || 0}
        tllCount={tllCount || 0}
      />
    )
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <p className="text-sm text-gray-600">Dashboard content is not available for your role.</p>
    </div>
  )
}
