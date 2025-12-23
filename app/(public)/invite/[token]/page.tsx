'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const router = useRouter()
  const [token, setToken] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<{
    email: string
    role: string
    metadata: { first_name: string; last_name: string }
  } | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    params.then(p => {
      setToken(p.token)
      loadInvitation(p.token)
    })
  }, [params])

  const loadInvitation = async (inviteToken: string) => {
    try {
      const response = await fetch(`/api/invitations/${inviteToken}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid invitation')
      }

      setInvitation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setAccepting(true)

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      // Redirect to login
      router.push('/login?message=Account created successfully. Please login.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beagle-light">
        <Loader2 className="h-8 w-8 animate-spin text-beagle-orange" />
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beagle-light">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 border border-error">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-error mb-4">Invalid Invitation</h2>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <a
              href="/login"
              className="inline-block px-6 py-2.5 bg-beagle-orange text-white rounded-lg font-semibold text-sm hover:bg-accent-orange active:bg-[#e66d00] shadow-sm hover:shadow-md transition-all duration-200"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-beagle-light">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
        <h2 className="text-3xl font-semibold text-beagle-dark mb-2">Accept Invitation</h2>
        <p className="text-sm text-gray-600 mb-6">
          You&apos;ve been invited to join Beagle Portal as <strong className="capitalize">{invitation?.role?.replace('_', ' ')}</strong>
        </p>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Email</p>
          <p className="text-sm font-semibold text-beagle-dark">{invitation?.email}</p>
          <p className="text-xs text-gray-500 mt-3 mb-1">Name</p>
          <p className="text-sm font-semibold text-beagle-dark">
            {invitation?.metadata?.first_name} {invitation?.metadata?.last_name}
          </p>
        </div>

        <form onSubmit={handleAccept} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border-l-4 border-error p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-beagle-dark mb-1.5">
              Create Password *
            </label>
            <input
              type="password"
              id="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-beagle-dark mb-1.5">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={accepting}
            className="w-full bg-beagle-orange text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-accent-orange active:bg-[#e66d00] disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
          >
            {accepting ? 'Creating Account...' : 'Create Account & Accept'}
          </button>
        </form>
      </div>
    </div>
  )
}

