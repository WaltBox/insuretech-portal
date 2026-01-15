'use client'

import { useState } from 'react'
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { Loader2, ChevronDown, ChevronUp, Building2, User, Calendar } from 'lucide-react'
import Image from 'next/image'
import { LoadingState } from '@/components/ui/loading-spinner'
import { Claim } from '@/lib/types'

interface ClaimsTableProps {
  propertyId?: string
  userEmail?: string // Email of the logged-in user
}

interface ClaimWithProperty extends Claim {
  property?: {
    name: string
  }
}

export function ClaimsTable({ propertyId, userEmail }: ClaimsTableProps) {
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('month')

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: ['claims', propertyId, timePeriod],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.append('cursor', pageParam)
      if (propertyId) params.append('property_id', propertyId)
      if (timePeriod) params.append('time_period', timePeriod)

      const response = await fetch(`/api/claims?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch claims')
      }
      
      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    placeholderData: keepPreviousData, // Keep showing previous data while fetching new
  })

  const claims = data?.pages.flatMap((page) => page.claims) || []
  const totalCount = data?.pages[0]?.total || 0

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'under review':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusDot = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'rejected':
        return 'bg-red-50'
      case 'under review':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">Error loading claims</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingState message="Loading claims..." />
  }

  return (
    <div className="space-y-6">
      {/* Time Period Filter */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setTimePeriod('week')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            timePeriod === 'week'
              ? 'bg-beagle-dark text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setTimePeriod('month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            timePeriod === 'month'
              ? 'bg-beagle-dark text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setTimePeriod('year')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            timePeriod === 'year'
              ? 'bg-beagle-dark text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          This Year
        </button>
        {/* Subtle loading indicator when switching tabs */}
        {isFetching && !isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        )}
        <div className="ml-auto flex items-center text-sm text-gray-600">
          <span className="font-semibold text-beagle-dark mr-1">{totalCount}</span> claims
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-[#faf8f0] flex items-center justify-center">
              <Image
                src="/beagle-bubbles.png"
                alt="Beagle"
                width={80}
                height={80}
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
          <p className="text-sm text-gray-600">No claims found for this period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim: ClaimWithProperty) => {
            const isExpanded = expandedClaim === claim.id
            const rawData = claim.raw_data || {}
            
            return (
              <div
                key={claim.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Compact Main Content */}
                <div
                  onClick={() => setExpandedClaim(isExpanded ? null : claim.id)}
                  className="px-6 py-4 cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    {/* Claim Number & Type - Fixed Width */}
                    <div className="w-32 flex-shrink-0">
                      <p className="text-sm font-semibold text-beagle-dark">{claim.claim_number || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{claim.claim_type || 'General'}</p>
                    </div>
                    
                    <div className="h-10 w-px bg-gray-200"></div>
                    
                    {/* Property - Fixed Width */}
                    <div className="w-40 flex-shrink-0 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{claim.property?.name || 'N/A'}</span>
                    </div>
                    
                    <div className="h-10 w-px bg-gray-200"></div>
                    
                    {/* Participant - Fixed Width */}
                    <div className="w-40 flex-shrink-0 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">
                        {claim.participant_first_name && claim.participant_last_name
                          ? `${claim.participant_first_name} ${claim.participant_last_name}`
                          : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="h-10 w-px bg-gray-200"></div>
                    
                    {/* Date - Fixed Width */}
                    <div className="w-24 flex-shrink-0 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">
                        {claim.submitted_date
                          ? new Date(claim.submitted_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="h-10 w-px bg-gray-200"></div>
                    
                    {/* Status - Fixed Width */}
                    <div className="w-32 flex-shrink-0">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(claim.status || 'pending')}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(claim.status || 'pending')}`}></span>
                        {claim.status || 'Pending'}
                      </span>
                    </div>
                    
                    <div className="h-10 w-px bg-gray-200"></div>
                    
                    {/* Amount - Fixed Width */}
                    <div className="w-24 flex-shrink-0 text-right">
                      <p className="text-lg font-bold text-beagle-dark">
                        ${(claim.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    
                    {/* Chevron */}
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                    <div className={`grid gap-4 text-sm ${claim.participant_email && userEmail && claim.participant_email.toLowerCase() === userEmail.toLowerCase() ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {/* Left Column - Only show contact if participant email matches user email */}
                      {claim.participant_email && userEmail && claim.participant_email.toLowerCase() === userEmail.toLowerCase() && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase">Contact</p>
                          <p className="text-gray-700">{claim.participant_email}</p>
                          {claim.participant_phone && (
                            <p className="text-gray-700">{claim.participant_phone}</p>
                          )}
                          {claim.participant_address && (
                            <p className="text-gray-700 text-xs">{claim.participant_address}</p>
                          )}
                        </div>
                      )}

                      {/* Right Column */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Details</p>
                        {typeof rawData.incident_date === 'string' && rawData.incident_date && (
                          <p className="text-gray-700">
                            <span className="text-gray-500">Incident:</span> {new Date(rawData.incident_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        {typeof rawData.description === 'string' && rawData.description && (
                          <p className="text-gray-700 text-xs">{String(rawData.description)}</p>
                        )}
                        {typeof rawData.rejection_reason === 'string' && rawData.rejection_reason && (
                          <p className="text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
                            <span className="font-medium">Rejected:</span> {String(rawData.rejection_reason)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2 bg-white border-2 border-beagle-dark text-beagle-dark rounded-lg font-semibold text-sm hover:bg-beagle-dark hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

