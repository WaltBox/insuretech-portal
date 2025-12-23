'use client'

import { useState, useEffect } from 'react'
import { User, UserRole, Property } from '@/lib/types'
import { X } from 'lucide-react'

interface UserFormModalProps {
  user?: User | null
  onClose: () => void
  onSuccess: (user?: User) => void
}

export function UserFormModal({ user, onClose, onSuccess }: UserFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [formData, setFormData] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: user?.role || 'property_manager' as UserRole,
  })

  useEffect(() => {
    if (formData.role === 'property_manager') {
      fetchProperties()
    }
  }, [formData.role])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInviteLink(null)
    setLoading(true)

    try {
      if (user) {
        // Updating existing user
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update user')
        }

        const savedUser = await response.json()
        onSuccess(savedUser)
      } else {
        // Creating new user via invitation
        if (formData.role === 'property_manager' && selectedProperties.length === 0) {
          throw new Error('Please select at least one property for the property manager')
        }

        const response = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            property_ids: selectedProperties,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to send invitation')
        }

        const data = await response.json()
        setInviteLink(data.inviteLink)
        
        // Don't close modal, show the invite link
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      alert('Invite link copied to clipboard!')
    }
  }

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-beagle-dark">
              {user ? 'Edit User' : 'Invite User'}
            </h2>
            {!user && (
              <p className="text-sm text-gray-500 mt-1">
                Send an invitation to create a new user account
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border-l-4 border-success p-4">
              <p className="text-sm text-green-800 font-semibold mb-2">Invitation sent!</p>
              <p className="text-sm text-green-700">
                Share this link with {formData.first_name} {formData.last_name}:
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg break-all text-sm font-medium text-beagle-dark border border-gray-200">
              {inviteLink}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 bg-beagle-orange text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-accent-orange active:bg-[#e66d00] shadow-sm hover:shadow-md transition-all duration-200"
              >
                Copy Link
              </button>
              <button
                onClick={() => {
                  onSuccess()
                  onClose()
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all duration-200"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border-l-4 border-error p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

          <div>
            <label className="block text-sm font-medium text-beagle-dark mb-1.5">First Name *</label>
            <input
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
              placeholder="John"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-beagle-dark mb-1.5">Last Name *</label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
              placeholder="Doe"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-beagle-dark mb-1.5">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
                placeholder="john.doe@example.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-beagle-dark mb-1.5">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200 cursor-pointer"
            >
              <option value="property_manager">Property Manager</option>
              <option value="centralized_member">Centralized Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Property selection for property managers */}
          {!user && formData.role === 'property_manager' && (
            <div>
              <label className="block text-sm font-medium text-beagle-dark mb-1.5">
                Assign Properties * (select at least one)
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1 bg-gray-50">
                {properties.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading properties...</p>
                ) : (
                  properties.map((property) => (
                    <label key={property.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors duration-150">
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(property.id)}
                        onChange={() => handlePropertyToggle(property.id)}
                        className="rounded border-gray-300 text-beagle-orange focus:ring-beagle-orange"
                      />
                      <span className="text-sm text-beagle-dark">{property.name}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedProperties.length > 0 && (
                <p className="text-xs text-beagle-orange font-medium mt-1.5">
                  {selectedProperties.length} {selectedProperties.length === 1 ? 'property' : 'properties'} selected
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-beagle-orange text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-accent-orange active:bg-[#e66d00] disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
            >
              {loading ? 'Sending...' : user ? 'Update User' : 'Send Invitation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}

