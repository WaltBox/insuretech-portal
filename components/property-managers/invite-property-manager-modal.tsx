'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Loader2, Check, Copy, Building2 } from 'lucide-react'
import { Property } from '@/lib/types'

interface InvitePropertyManagerModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function InvitePropertyManagerModal({
  onClose,
  onSuccess,
}: InvitePropertyManagerModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    property_ids: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch properties for selection
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties')
      if (!response.ok) throw new Error('Failed to fetch properties')
      const data = await response.json()
      return data
    },
  })

  const properties = propertiesData?.properties || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (formData.property_ids.length === 0) {
        throw new Error('Please select at least one property')
      }

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'property_manager',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setInviteLink(data.inviteLink)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const toggleProperty = (propertyId: string) => {
    setFormData((prev) => ({
      ...prev,
      property_ids: prev.property_ids.includes(propertyId)
        ? prev.property_ids.filter((id) => id !== propertyId)
        : [...prev.property_ids, propertyId],
    }))
  }

  const handleDone = () => {
    onSuccess()
  }

  if (inviteLink) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-beagle-dark">
              Invitation Sent!
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">
                  Invitation sent!
                </p>
                <p className="text-xs text-green-700">
                  Share this link with {formData.first_name} {formData.last_name}:
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg break-all text-xs text-gray-600 font-mono">
              {inviteLink}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-beagle-orange text-white rounded-lg text-sm font-medium hover:bg-accent-orange transition-all duration-200"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
            <button
              onClick={handleDone}
              className="px-6 py-2.5 bg-white border border-gray-200 text-beagle-dark rounded-lg text-sm font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-beagle-dark">
              Invite Property Manager
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Send an invitation to create a new property manager account
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
                placeholder="manager@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  First Name *
                </label>
                <input
                  id="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
                  placeholder="John"
                />
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Last Name *
                </label>
                <input
                  id="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Assign Properties *
              </label>
              {propertiesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-beagle-orange" />
                </div>
              ) : properties.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-sm text-gray-600">
                    No properties available. Create a property first.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  {properties.map((property: Property) => (
                    <label
                      key={property.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                    >
                      <input
                        type="checkbox"
                        checked={formData.property_ids.includes(property.id)}
                        onChange={() => toggleProperty(property.id)}
                        className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer appearance-none checked:bg-beagle-orange checked:border-beagle-orange focus:outline-none"
                        style={{
                          backgroundImage: formData.property_ids.includes(property.id)
                            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='white'%3E%3Cpath fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd'/%3E%3C/svg%3E")`
                            : 'none',
                          backgroundSize: '100% 100%',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-beagle-dark">
                          {property.name}
                        </p>
                        {(property.city || property.state) && (
                          <p className="text-xs text-gray-500">
                            {[property.city, property.state]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {formData.property_ids.length > 0 && (
                <p className="mt-2 text-xs text-gray-600">
                  {formData.property_ids.length} {formData.property_ids.length === 1 ? 'property' : 'properties'} selected
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-beagle-orange text-white rounded-lg text-sm font-medium hover:bg-accent-orange transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-200 text-beagle-dark rounded-lg text-sm font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

