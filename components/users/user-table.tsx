'use client'

import { useState } from 'react'
import { User } from '@/lib/types'
import { Edit, Trash2, User as UserIcon } from 'lucide-react'
import { UserFormModal } from './user-form-modal'

interface UserTableProps {
  initialUsers: User[]
  currentUserId: string
}

export function UserTable({ initialUsers, currentUserId }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [impersonating, setImpersonating] = useState(false)

  const handleImpersonate = async (user: User) => {
    if (!confirm(`Impersonate ${user.first_name} ${user.last_name}?`)) return

    setImpersonating(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) throw new Error('Failed to start impersonation')

      window.location.href = '/dashboard'
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'An error occurred')
      setImpersonating(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete user')

      setUsers(users.filter((u) => u.id !== userId))
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setShowModal(true)
  }

  const handleSuccess = (user?: User) => {
    if (user && editingUser) {
      setUsers(users.map((u) => (u.id === user.id ? user : u)))
    }
    // For new invitations, don't add to list since user isn't created yet
    setShowModal(false)
    setEditingUser(null)
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      centralized_member: 'bg-blue-100 text-blue-700',
      property_manager: 'bg-blue-100 text-blue-700',
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-i3-border shadow-sm">
        <div className="p-6 border-b border-i3-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-i3-navy">
              Users ({users.length})
            </h2>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-i3-navy hover:bg-i3-navy-light text-white rounded-xl transition-colors duration-200"
            >
              <svg 
                className="h-5 w-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 5V19M5 12H19" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-semibold text-sm">Invite User</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-i3-bg border-b border-i3-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-i3-text-muted uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-i3-text-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-i3-text-muted uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-i3-text-muted uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-i3-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-i3-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-i3-bg-light transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-i3-navy">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-i3-text-secondary">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-i3-text-muted">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => handleImpersonate(user)}
                          disabled={impersonating}
                          className="text-i3-navy hover:text-i3-navy-light transition-colors duration-200 disabled:opacity-50"
                          title="Impersonate user"
                        >
                          <UserIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-i3-text-muted hover:text-i3-navy transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-i3-text-muted hover:text-red-500 transition-colors duration-200"
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

      {showModal && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setShowModal(false)
            setEditingUser(null)
          }}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

