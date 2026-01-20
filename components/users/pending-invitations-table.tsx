'use client'

import { useState } from 'react'
import { Mail, Clock, RefreshCw, Trash2, Copy, Check, AlertCircle } from 'lucide-react'

interface PendingInvitation {
  id: string
  email: string
  role: string
  token: string
  expires_at: string
  created_at: string
  is_expired: boolean
  first_name: string
  last_name: string
  inviter?: {
    first_name: string
    last_name: string
  }
}

interface PendingInvitationsTableProps {
  initialInvitations: PendingInvitation[]
}

export function PendingInvitationsTable({ initialInvitations }: PendingInvitationsTableProps) {
  const [invitations, setInvitations] = useState(initialInvitations)
  const [resending, setResending] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResend = async (invitation: PendingInvitation) => {
    setResending(invitation.id)
    setError(null)

    try {
      const response = await fetch(`/api/admin/invitations/${invitation.id}/resend`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation')
      }

      // Update the invitation in the list (it's no longer expired)
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === invitation.id
            ? { ...inv, is_expired: false, token: data.inviteLink?.split('/').pop() || inv.token }
            : inv
        )
      )

      alert('Invitation resent successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invitation')
    } finally {
      setResending(null)
    }
  }

  const handleDelete = async (invitation: PendingInvitation) => {
    if (!confirm(`Cancel invitation for ${invitation.first_name} ${invitation.last_name} (${invitation.email})?`)) {
      return
    }

    setDeleting(invitation.id)
    setError(null)

    try {
      const response = await fetch(`/api/admin/invitations/${invitation.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel invitation')
      }

      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation')
    } finally {
      setDeleting(null)
    }
  }

  const handleCopyLink = async (invitation: PendingInvitation) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const inviteLink = `${baseUrl}/invite/${invitation.token}`

    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopiedId(invitation.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      alert('Failed to copy link')
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-50 text-purple-700',
      centralized_member: 'bg-blue-50 text-blue-700',
      property_manager: 'bg-orange-50 text-orange-700',
    }
    return colors[role] || 'bg-gray-50 text-gray-700'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return formatDate(dateString)
  }

  const pendingCount = invitations.filter(inv => !inv.is_expired).length
  const expiredCount = invitations.filter(inv => inv.is_expired).length

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Mail className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-beagle-dark">
                Pending Invitations ({invitations.length})
              </h2>
              <p className="text-sm text-gray-500">
                {pendingCount} active{expiredCount > 0 && `, ${expiredCount} expired`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Invitee
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invitations.map((invitation) => (
              <tr key={invitation.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-beagle-dark">
                      {invitation.first_name} {invitation.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{invitation.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getRoleBadge(
                      invitation.role
                    )}`}
                  >
                    {invitation.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {invitation.is_expired ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">
                      <Clock className="h-3 w-3" />
                      Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {getTimeAgo(invitation.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleCopyLink(invitation)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="Copy invite link"
                      disabled={invitation.is_expired}
                    >
                      {copiedId === invitation.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleResend(invitation)}
                      disabled={resending === invitation.id}
                      className="text-beagle-orange hover:text-accent-orange transition-colors duration-200 disabled:opacity-50"
                      title="Resend invitation"
                    >
                      <RefreshCw className={`h-4 w-4 ${resending === invitation.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(invitation)}
                      disabled={deleting === invitation.id}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                      title="Cancel invitation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
