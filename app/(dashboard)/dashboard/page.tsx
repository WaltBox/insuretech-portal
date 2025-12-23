import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, Users, FileText, TrendingUp, Clock, ChevronRight, Layers, Headphones, FileCheck } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Admin Dashboard
  if (user.role === 'admin') {
    const [
      { count: propertyCount },
      { count: userCount },
      { count: enrollmentCount },
      { data: recentProperties }
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('*').order('created_at', { ascending: false }).limit(5)
    ])

    // Get enrollment stats for first property as sample
    let enrollmentStats: any[] = []
    if (recentProperties && recentProperties.length > 0) {
      const { data: stats } = await supabase.rpc('get_enrollment_stats', { p_property_id: recentProperties[0].id })
      enrollmentStats = stats || []
    }

    const premiumPaying = enrollmentStats.find((s: any) => s.status === 'Premium Paying')?.count || 0
    const issuedNotPaid = enrollmentStats.find((s: any) => s.status === 'Issued, Not Paid')?.count || 0
    const lapsed = enrollmentStats.find((s: any) => s.status === 'Lapsed')?.count || 0

    return (
      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-normal text-beagle-dark">Welcome to Beagle!</h1>
          <p className="text-sm text-gray-600 mt-2">Overview of your property management system</p>
        </div>

        {/* Single Stats Card */}
        <div className="bg-orange-lighter rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/images/star.svg" alt="" width={20} height={20} className="w-5 h-5" />
            <h3 className="text-sm font-medium text-gray-700">System Overview</h3>
          </div>
          
          <p className="text-3xl font-bold text-beagle-dark mb-6">{enrollmentCount || 0}</p>
          
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-beagle-orange"></div>
              <span className="text-xs text-gray-600">Total Doors</span>
              <span className="text-sm font-semibold text-beagle-dark">{(propertyCount || 0) * 100}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Unverified Tenants</span>
              <span className="text-sm font-semibold text-beagle-dark">{issuedNotPaid}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-600">Verified Tenants</span>
              <span className="text-sm font-semibold text-beagle-dark">{lapsed}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Tenants Enrolled</span>
              <span className="text-sm font-semibold text-beagle-dark">{premiumPaying}</span>
            </div>
          </div>
        </div>

        {/* Recent Properties */}
        <h2 className="text-sm font-semibold text-beagle-dark mb-4">Recent Properties</h2>
        {recentProperties && recentProperties.length > 0 ? (
          <div className="space-y-3 mb-8">
            {recentProperties.map((property) => (
              <Link 
                key={property.id} 
                href={`/admin/properties/${property.id}`}
                className="group flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-beagle-orange transition-all duration-200"
              >
                <div>
                  <p className="text-sm font-semibold text-beagle-dark">{property.name}</p>
                  <p className="text-xs text-gray-500">
                    {[property.city, property.state].filter(Boolean).join(', ')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-beagle-dark group-hover:text-beagle-orange transition-colors duration-200" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 bg-white rounded-lg border border-gray-200 text-center mb-8">
            <p className="text-xs text-gray-500">No properties yet</p>
          </div>
        )}

        {/* Quick Links */}
        <h2 className="text-sm font-semibold text-beagle-dark mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <FileText className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">File a Claim</p>
          </Link>
          
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <Layers className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">View Program</p>
          </Link>
          
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <Headphones className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">Contact Support</p>
          </Link>
          
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <FileCheck className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">Lease Addendum</p>
          </Link>
        </div>
      </div>
    )
  }

  // Property Manager Dashboard
  if (user.role === 'property_manager') {
    const { data: assignments } = await supabase
      .from('property_managers')
      .select(`property:properties(*)`)
      .eq('user_id', user.id)

    const properties = assignments?.map((a: any) => a.property).filter(Boolean) || []
    const propertyIds = properties.map((p: any) => p.id)
    
    let enrollmentCount = 0
    let enrollmentStats: any[] = []
    
    if (propertyIds.length > 0) {
      const [
        { count: totalEnrollments },
        { data: stats },
      ] = await Promise.all([
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).in('property_id', propertyIds),
        supabase.rpc('get_enrollment_stats', { p_property_id: propertyIds[0] }).then(res => res.data || []),
      ])
      
      enrollmentCount = totalEnrollments || 0
      enrollmentStats = stats || []
    }

    const premiumPaying = enrollmentStats.find((s: any) => s.status === 'Premium Paying')?.count || 0
    const issuedNotPaid = enrollmentStats.find((s: any) => s.status === 'Issued, Not Paid')?.count || 0
    const lapsed = enrollmentStats.find((s: any) => s.status === 'Lapsed')?.count || 0

    return (
      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-normal text-beagle-dark">Welcome to Beagle!</h1>
          <p className="text-sm text-gray-600 mt-2">Manage your assigned properties</p>
        </div>

        {/* Single Stats Card */}
        <div className="bg-orange-lighter rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/images/star.svg" alt="" width={20} height={20} className="w-5 h-5" />
            <h3 className="text-sm font-medium text-gray-700">Portfolio Overview</h3>
          </div>
          
          <p className="text-3xl font-bold text-beagle-dark mb-6">{enrollmentCount}</p>
          
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-beagle-orange"></div>
              <span className="text-xs text-gray-600">Total Doors</span>
              <span className="text-sm font-semibold text-beagle-dark">{properties.length * 100}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Unverified Tenants</span>
              <span className="text-sm font-semibold text-beagle-dark">{issuedNotPaid}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-600">Verified Tenants</span>
              <span className="text-sm font-semibold text-beagle-dark">{lapsed}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Tenants Enrolled</span>
              <span className="text-sm font-semibold text-beagle-dark">{premiumPaying}</span>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <h2 className="text-sm font-semibold text-beagle-dark mb-4">Your Properties</h2>
        {properties.length > 0 ? (
          <div className="space-y-3 mb-8">
            {properties.slice(0, 5).map((property: any) => (
              <Link 
                key={property.id} 
                href={`/my-properties/${property.id}`}
                className="group flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-beagle-orange transition-all duration-200"
              >
                <div>
                  <p className="text-sm font-semibold text-beagle-dark">{property.name}</p>
                  <p className="text-xs text-gray-500">
                    {[property.city, property.state].filter(Boolean).join(', ')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-beagle-dark group-hover:text-beagle-orange transition-colors duration-200" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 bg-white rounded-lg border border-gray-200 text-center mb-8">
            <p className="text-xs text-gray-500">No properties assigned yet</p>
          </div>
        )}

        {/* Quick Links */}
        <h2 className="text-sm font-semibold text-beagle-dark mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <FileText className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">File a Claim</p>
          </Link>
          
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <Layers className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">View Program</p>
          </Link>
          
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <Headphones className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">Contact Support</p>
          </Link>
          
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <FileCheck className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">Lease Addendum</p>
          </Link>
        </div>
      </div>
    )
  }

  // Centralized Member Dashboard  
  if (user.role === 'centralized_member') {
    const [
      { count: propertyCount },
      { count: enrollmentCount },
      { data: recentProperties }
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('*').order('created_at', { ascending: false }).limit(5)
    ])

    // Get enrollment stats for first property as sample
    let enrollmentStats: any[] = []
    if (recentProperties && recentProperties.length > 0) {
      const { data: stats } = await supabase.rpc('get_enrollment_stats', { p_property_id: recentProperties[0].id })
      enrollmentStats = stats || []
    }

    const premiumPaying = enrollmentStats.find((s: any) => s.status === 'Premium Paying')?.count || 0
    const issuedNotPaid = enrollmentStats.find((s: any) => s.status === 'Issued, Not Paid')?.count || 0
    const lapsed = enrollmentStats.find((s: any) => s.status === 'Lapsed')?.count || 0

    return (
      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-normal text-beagle-dark">Welcome to Beagle!</h1>
          <p className="text-sm text-gray-600 mt-2">Portfolio overview and insights</p>
        </div>

        {/* Single Stats Card */}
        <div className="bg-orange-lighter rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/images/star.svg" alt="" width={20} height={20} className="w-5 h-5" />
            <h3 className="text-sm font-medium text-gray-700">Portfolio Overview</h3>
          </div>
          
          <p className="text-3xl font-bold text-beagle-dark mb-6">{enrollmentCount || 0}</p>
          
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-beagle-orange"></div>
              <span className="text-xs text-gray-600">Total Doors</span>
              <span className="text-sm font-semibold text-beagle-dark">{(propertyCount || 0) * 100}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Unverified Tenants</span>
              <span className="text-sm font-semibold text-beagle-dark">{issuedNotPaid}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-600">Verified Tenants</span>
              <span className="text-sm font-semibold text-beagle-dark">{lapsed}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Tenants Enrolled</span>
              <span className="text-sm font-semibold text-beagle-dark">{premiumPaying}</span>
            </div>
          </div>
        </div>

        {/* Recent Properties */}
        <h2 className="text-sm font-semibold text-beagle-dark mb-4">Recent Properties</h2>
        {recentProperties && recentProperties.length > 0 ? (
          <div className="space-y-3 mb-8">
            {recentProperties.map((property) => (
              <Link 
                key={property.id} 
                href={`/portfolio/${property.id}`}
                className="group flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-beagle-orange transition-all duration-200"
              >
                <div>
                  <p className="text-sm font-semibold text-beagle-dark">{property.name}</p>
                  <p className="text-xs text-gray-500">
                    {[property.city, property.state].filter(Boolean).join(', ')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-beagle-dark group-hover:text-beagle-orange transition-colors duration-200" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 bg-white rounded-lg border border-gray-200 text-center mb-8">
            <p className="text-xs text-gray-500">No properties yet</p>
          </div>
        )}

        {/* Quick Links */}
        <h2 className="text-sm font-semibold text-beagle-dark mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <FileText className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">File a Claim</p>
          </Link>
          
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <Layers className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">View Program</p>
          </Link>
          
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <Headphones className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">Contact Support</p>
          </Link>
          
          <Link href="#" className="group bg-white hover:bg-orange-lighter rounded-lg p-6 border border-gray-200 transition-all duration-200">
            <FileCheck className="w-8 h-8 text-beagle-orange mb-3" />
            <p className="text-xs font-semibold text-beagle-dark">Lease Addendum</p>
          </Link>
        </div>
      </div>
    )
  }

  return null
}

