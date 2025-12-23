'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Enrollment } from '@/lib/types'
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { EnrollmentFilters } from './enrollment-filters'

interface EnrollmentTableProps {
  propertyId: string
}

export function EnrollmentTable({ propertyId }: EnrollmentTableProps) {
  const [mounted, setMounted] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    coverage_type: '',
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['enrollments', propertyId, filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)
      if (filters.coverage_type) params.append('coverage_type', filters.coverage_type)

      const response = await fetch(
        `/api/properties/${propertyId}/enrollments?${params.toString()}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments')
      }
      
      return response.json()
    },
    enabled: mounted,
  })

  const enrollments = data?.enrollments || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)
  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1
  const endEntry = Math.min(page * limit, total)

  if (!mounted) {
    return (
      <div className="space-y-6">
        <EnrollmentFilters filters={filters} onFiltersChange={setFilters} total={0} />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-beagle-orange" />
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Premium Paying':
        return 'bg-green-50 text-green-700'
      case 'Issued, Not Paid':
        return 'bg-amber-50 text-amber-700'
      case 'Lapsed':
        return 'bg-orange-50 text-orange-700'
      case 'Cancelled':
        return 'bg-red-50 text-red-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      })
    } catch {
      return '-'
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-error p-4 rounded-r-lg">
        <p className="text-sm font-medium text-red-800">Error loading enrollments: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <EnrollmentFilters filters={filters} onFiltersChange={setFilters} total={total} />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-beagle-orange" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <p className="text-sm text-gray-600">No data available</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Enrollment #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Property Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Effective Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Expire Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrollments.map((enrollment: Enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.enrollment_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {enrollment.first_name} {enrollment.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {enrollment.unit_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {enrollment.coverage_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(enrollment.effective_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(enrollment.expiration_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(
                            enrollment.status
                          )}`}
                        >
                          {enrollment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startEntry} to {endEntry} of {total} entries
            </div>
            
            <div className="flex items-center gap-2">
              {/* Items per page */}
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-beagle-dark focus:outline-none focus:border-beagle-orange cursor-pointer"
              >
                <option value={10}>10 items</option>
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>

              {/* Pagination buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-beagle-dark text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

