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

  return (
    <div className="space-y-4">
      <h2 className="text-5xl font-normal text-beagle-dark">
        Enrollments
      </h2>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search enrollments..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
          />
        </div>

        {/* Filter Button/Icon */}
        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>
    </div>
  )
})

