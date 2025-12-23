import Link from 'next/link'
import { Property } from '@/lib/types'
import { memo, useMemo } from 'react'

interface PropertyCardProps {
  property: Property
  href: string
}

export const PropertyCard = memo(function PropertyCard({ property, href }: PropertyCardProps) {
  const formattedAddress = useMemo(() => {
    return [property.address, property.city, property.state]
      .filter(Boolean)
      .join(', ')
  }, [property.address, property.city, property.state])

  const formattedDate = useMemo(() => {
    return new Date(property.created_at).toLocaleDateString()
  }, [property.created_at])
  return (
    <Link href={href}>
      <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-beagle-dark mb-1">
              {property.name}
            </h3>
            {formattedAddress && (
              <p className="text-sm text-gray-500">
                {formattedAddress}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="text-sm font-semibold text-beagle-dark">
              {formattedDate}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
})

