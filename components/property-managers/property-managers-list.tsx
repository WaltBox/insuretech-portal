'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Building2, Mail, Loader2, Search } from 'lucide-react'
import { InvitePropertyManagerModal } from './invite-property-manager-modal'

interface PropertyManager {
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
  properties: Array<{
    id: string
    name: string
    city?: string
    state?: string
  }>
}

export function PropertyManagersList() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['property-managers'],
    queryFn: async () => {
      const response = await fetch('/api/property-managers')
      if (!response.ok) {
        throw new Error('Failed to fetch property managers')
      }
      return response.json()
    },
  })

  const managers: PropertyManager[] = data?.managers || []

  // Filter managers by search term
  const filteredManagers = managers.filter((manager) => {
    const fullName = `${manager.user.first_name} ${manager.user.last_name}`.toLowerCase()
    const email = manager.user.email.toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || email.includes(search)
  })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-sm text-red-800">Failed to load property managers</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-normal text-beagle-dark">Property Managers</h1>
          <p className="text-sm text-gray-600 mt-2">
            Manage property managers and their assigned properties
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-beagle-orange text-white rounded-lg text-sm font-medium hover:bg-accent-orange transition-all duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Property Manager
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-beagle-orange" />
        </div>
      ) : filteredManagers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {searchTerm ? 'No property managers found matching your search' : 'No property managers yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-beagle-orange text-white rounded-lg text-sm font-medium hover:bg-accent-orange transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Invite First Property Manager
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Properties Managed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Total Properties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredManagers.map((manager) => (
                  <tr
                    key={manager.user.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-beagle-orange/10 flex items-center justify-center text-sm font-semibold text-beagle-orange">
                          {manager.user.first_name[0]}{manager.user.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-beagle-dark">
                            {manager.user.first_name} {manager.user.last_name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {manager.user.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {manager.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {manager.properties.slice(0, 3).map((property) => (
                          <div
                            key={property.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-700"
                          >
                            <Building2 className="w-3 h-3" />
                            <span className="font-medium">{property.name}</span>
                          </div>
                        ))}
                        {manager.properties.length > 3 && (
                          <div className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                            +{manager.properties.length - 3} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-beagle-dark text-white text-xs font-semibold">
                        {manager.properties.length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InvitePropertyManagerModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            refetch()
            setShowInviteModal(false)
          }}
        />
      )}
    </>
  )
}

function UserCog({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

