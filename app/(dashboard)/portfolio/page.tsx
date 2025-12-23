import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { PropertyCard } from '@/components/properties/property-card'
import { Building2 } from 'lucide-react'

export default async function PortfolioPage() {
  await requireRole(['centralized_member', 'admin'])
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  // Get total enrollments across all properties
  const { count: totalEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-normal text-beagle-dark">Portfolio Overview</h1>
        <p className="text-sm text-gray-600 mt-2">View all properties and enrollments across your portfolio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="h-8 w-8 text-beagle-orange" />
            <p className="text-sm font-medium text-gray-600">Total Properties</p>
          </div>
          <p className="text-4xl font-bold text-beagle-dark">{properties?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-3">Total Enrollments</p>
          <p className="text-4xl font-bold text-beagle-dark">{totalEnrollments || 0}</p>
        </div>
      </div>

      {/* Properties Grid */}
      {properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              href={`/portfolio/${property.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <p className="text-sm text-gray-600">No properties in portfolio yet.</p>
        </div>
      )}
    </div>
  )
}

