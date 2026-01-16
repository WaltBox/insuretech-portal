import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { cookies } from 'next/headers'

// Disable caching for this page - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper to safely call RPC functions
async function safeRpcCall(supabase: any, functionName: string) {
  try {
    const result = await supabase.rpc(functionName).single()
    return result?.data ?? null
  } catch {
    return null
  }
}

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
      sdiResultAdmin,
      tllResultAdmin,
      tllRpcResultAdmin,
      sdiRpcResultAdmin
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('door_count').order('created_at', { ascending: false }),
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'Premium Paying'),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).or('coverage_name.eq.SDI,coverage_name.eq.sdi'),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).or('coverage_name.eq.TLL,coverage_name.eq.tll'),
      safeRpcCall(supabase, 'get_tll_count'),
      safeRpcCall(supabase, 'get_sdi_count')
    ])
    
    const sdiCount = sdiRpcResultAdmin ?? sdiResultAdmin?.count ?? 0
    const tllCount = tllRpcResultAdmin ?? tllResultAdmin?.count ?? 0

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
    // For property managers, use direct property filtering (RLS doesn't work correctly during impersonation)
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
        { count: enrollmentCountActual },
        { data: allProperties },
        { data: recentProperties },
        { count: premiumPayingCountActual },
        { count: sdiCountActual },
        { count: tllCountActual }
      ] = await Promise.all([
        propertyIds.length > 0
          ? supabase.from('enrollments').select('*', { count: 'exact', head: true }).in('property_id', propertyIds)
          : Promise.resolve({ count: 0 }),
        propertyIds.length > 0
          ? supabase.from('properties').select('door_count').in('id', propertyIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        Promise.resolve({ data: properties }),
        propertyIds.length > 0
          ? supabase.from('enrollments').select('*', { count: 'exact', head: true }).in('property_id', propertyIds).eq('status', 'Premium Paying')
          : Promise.resolve({ count: 0 }),
        propertyIds.length > 0
          ? supabase.from('enrollments').select('*', { count: 'exact', head: true }).in('property_id', propertyIds).or('coverage_name.eq.SDI,coverage_name.eq.sdi')
          : Promise.resolve({ count: 0 }),
        propertyIds.length > 0
          ? supabase.from('enrollments').select('*', { count: 'exact', head: true }).in('property_id', propertyIds).or('coverage_name.eq.TLL,coverage_name.eq.tll')
          : Promise.resolve({ count: 0 })
      ])
      
      // Use exact counts from queries (not limited by row caps)
      const enrollmentCount = enrollmentCountActual || 0
      const premiumPayingCount = premiumPayingCountActual || 0
      const sdiCount = sdiCountActual || 0
      const tllCount = tllCountActual || 0
      
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
    
    // For centralized_members, RLS works fine - use the standard approach
    const [
      { count: propertyCount },
      { count: enrollmentCount },
      { data: allProperties },
      { data: recentProperties },
      { count: premiumPayingCount },
      sdiResult,
      tllResult,
      tllRpcResult,
      sdiRpcResult
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('door_count').order('created_at', { ascending: false }),
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'Premium Paying'),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).or('coverage_name.eq.SDI,coverage_name.eq.sdi'),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).or('coverage_name.eq.TLL,coverage_name.eq.tll'),
      safeRpcCall(supabase, 'get_tll_count'),
      safeRpcCall(supabase, 'get_sdi_count')
    ])
    
    // Use RPC result if available, otherwise fall back to query result
    const sdiCount = sdiRpcResult ?? sdiResult?.count ?? 0
    const tllCount = tllRpcResult ?? tllResult?.count ?? 0

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
