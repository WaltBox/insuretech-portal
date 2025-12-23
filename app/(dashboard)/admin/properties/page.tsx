import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { PropertyCard } from '@/components/properties/property-card'

export default async function PropertiesPage() {
  const user = await requireRole(['admin'])
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-normal text-beagle-dark">Properties</h1>
          <p className="text-sm text-gray-600 mt-2">Manage all properties in the system</p>
        </div>
        <Link
          href="/admin/properties/create"
          className="flex items-center gap-2 group transition-colors duration-200"
        >
          <svg 
            className="h-5 w-5 transition-all duration-200" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              className="stroke-beagle-orange group-hover:fill-beagle-orange transition-all duration-200" 
              strokeWidth="2"
            />
            <path 
              d="M12 8V16M8 12H16" 
              className="stroke-beagle-orange group-hover:stroke-white transition-all duration-200" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
          <span className="font-semibold text-sm text-beagle-orange group-hover:text-accent-orange transition-colors duration-200">Create Property</span>
        </Link>
      </div>

      {properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              href={`/admin/properties/${property.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
          <p className="text-gray-600 mb-6">No properties yet. Create your first property to get started.</p>
          <Link
            href="/admin/properties/create"
            className="inline-flex items-center gap-2 group transition-colors duration-200"
          >
            <svg 
              className="h-5 w-5 transition-all duration-200" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                className="stroke-beagle-orange group-hover:fill-beagle-orange transition-all duration-200" 
                strokeWidth="2"
              />
              <path 
                d="M12 8V16M8 12H16" 
                className="stroke-beagle-orange group-hover:stroke-white transition-all duration-200" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
            <span className="font-semibold text-sm text-beagle-orange group-hover:text-accent-orange transition-colors duration-200">Create Property</span>
          </Link>
        </div>
      )}
    </div>
  )
}

