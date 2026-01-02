'use client'

import { Search } from 'lucide-react'
import { useState, useEffect, memo, useCallback, useRef } from 'react'

interface EnrollmentFilters {
  status: string
  search: string
  coverage_type: string
}

interface EnrollmentFiltersProps {
  filters: EnrollmentFilters
  onFiltersChange: (filters: EnrollmentFilters) => void
  total: number
}

export const EnrollmentFilters = memo(function EnrollmentFilters({
  filters,
  onFiltersChange,
}: EnrollmentFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Optimized debounce search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue })
      }
    }, 300) // Reduced from 500ms to 300ms for better responsiveness

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchValue, filters, onFiltersChange])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }, [])

  const handleProductChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, coverage_type: e.target.value })
  }, [filters, onFiltersChange])

  return (
    <div className="space-y-4">
      <h2 className="text-5xl font-normal text-beagle-dark">
        Enrollments
      </h2>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Search - Expanded to be more prominent */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, address, enrollment #..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
          />
        </div>

        {/* Product Filter */}
        <select
          value={filters.coverage_type}
          onChange={handleProductChange}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-beagle-dark focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200 cursor-pointer min-w-[140px]"
        >
          <option value="">All Products</option>
          <option value="SDI">SDI</option>
          <option value="TLL">TLL</option>
        </select>
      </div>
    </div>
  )
})

