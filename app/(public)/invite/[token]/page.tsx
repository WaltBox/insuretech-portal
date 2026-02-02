'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ErrorMessage } from '@/components/ui/error-message'

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
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accepting, setAccepting] = useState(false)

  // Format phone number as user types
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

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

    // Validate phone number (basic validation - at least 10 digits)
    const phoneDigits = phone.replace(/\D/g, '')
    if (!phone || phoneDigits.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

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
        body: JSON.stringify({ password, phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      // Auto-login the user after account creation
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation!.email,
        password,
      })

      if (signInError) {
        // If auto-login fails, redirect to login page with a message
        setAccepting(false)
        router.push('/login?message=Account created successfully. Please login with your new password.')
        return
      }

      // Successfully logged in, redirect to dashboard
      // Don't set accepting to false - let the redirect happen with loading state
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beagle-light relative px-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-i3-navy" />
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beagle-light relative px-4 py-8">
        {/* Beagle Logo Top Left */}
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
          <Image
            src="/images/beagle-text-logo.webp"
            alt="Beagle"
            width={100}
            height={32}
            priority
            className="h-6 sm:h-8 w-auto"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
        
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-4 sm:p-8 border border-gray-200">
          <div className="text-center">
            <div className="mb-4 sm:mb-6 flex justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-beagle-dark mb-4 sm:mb-6">
              Invalid Invitation
            </h2>
            <div className="mb-6 sm:mb-8">
              <ErrorMessage message={error} />
            </div>
            <a
              href="/login"
              className="inline-block px-6 py-2.5 bg-i3-navy text-white rounded-lg font-semibold text-sm hover:bg-i3-navy-light shadow-sm hover:shadow-md transition-all duration-200"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-beagle-light relative px-4 py-8">
      {/* Beagle Logo Top Left */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Image
          src="/images/beagle-text-logo.webp"
          alt="Beagle"
          width={100}
          height={32}
          priority
          className="h-6 sm:h-8 w-auto"
        />
      </div>

      <div className="max-w-md w-full space-y-4 sm:space-y-6 p-4 sm:p-8 bg-white rounded-2xl shadow-sm border-2 border-beagle-dark">
        <div className="text-center">
          <div className="mb-4 sm:mb-6 flex justify-center">
            <Image
              src="/trudy-cute-dog.png"
              alt="Beagle"
              width={120}
              height={120}
              className="rounded-lg w-20 h-20 sm:w-[120px] sm:h-[120px]"
            />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-beagle-dark">
            Accept Invitation
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600">
            You&apos;ve been invited to join Beagle Portal as <strong className="capitalize">{invitation?.role?.replace('_', ' ')}</strong>
          </p>
        </div>

        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Email</p>
          <p className="text-sm font-semibold text-beagle-dark">{invitation?.email}</p>
          <p className="text-xs text-gray-500 mt-3 mb-1">Name</p>
          <p className="text-sm font-semibold text-beagle-dark">
            {invitation?.metadata?.first_name} {invitation?.metadata?.last_name}
          </p>
        </div>

        <form onSubmit={handleAccept} className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border-l-4 border-error p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-beagle-dark mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={phone}
                onChange={handlePhoneChange}
                maxLength={14}
                className="block w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-i3-navy focus:ring-2 focus:ring-i3-navy/10 transition-all duration-200"
                placeholder="(555) 123-4567"
              />
              <p className="text-xs text-gray-500 mt-1">We'll use this to contact you when needed</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-beagle-dark mb-1.5">
                Create Password *
              </label>
              <input
                type="password"
                id="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-i3-navy focus:ring-2 focus:ring-i3-navy/10 transition-all duration-200"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-beagle-dark mb-1.5">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-i3-navy focus:ring-2 focus:ring-i3-navy/10 transition-all duration-200"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={accepting}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 sm:px-6 rounded-lg text-sm font-semibold text-beagle-dark bg-white border-2 border-beagle-dark hover:bg-beagle-dark hover:text-white focus:outline-none focus:ring-2 focus:ring-beagle-dark focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
          >
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-i3-navy" />
                Creating Account...
              </>
            ) : (
              'Create Account & Accept'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

