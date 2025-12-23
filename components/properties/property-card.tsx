import Link from 'next/link'
import { Property } from '@/lib/types'
import { Building2, MapPin } from 'lucide-react'

interface PropertyCardProps {
  property: Property
  href: string
}

export function PropertyCard({ property, href }: PropertyCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-beagle-dark mb-1">
              {property.name}
            </h3>
            {(property.address || property.city || property.state) && (
              <p className="text-sm text-gray-500">
                {[property.address, property.city, property.state]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="text-sm font-semibold text-beagle-dark">
              {new Date(property.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

