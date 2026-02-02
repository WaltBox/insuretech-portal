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
      <div className="bg-white rounded-xl p-6 border border-i3-border hover:border-i3-navy hover:shadow-sm transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-i3-navy mb-1">
              {property.name}
            </h3>
            {formattedAddress && (
              <p className="text-sm text-i3-text-muted">
                {formattedAddress}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-i3-border">
          <div>
            <p className="text-xs text-i3-text-muted mb-1">Created</p>
            <p className="text-sm font-semibold text-i3-navy">
              {formattedDate}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
})

