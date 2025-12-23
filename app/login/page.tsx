'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-beagle-light relative">
      {/* Beagle Logo Top Left */}
      <div className="absolute top-8 left-8">
        <Image
          src="/images/beagle-text-logo.webp"
          alt="Beagle"
          width={100}
          height={32}
          priority
          className="h-8 w-auto"
        />
      </div>

      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-sm border-2 border-beagle-dark">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/images/caf.jpg"
              alt="Beagle CAF"
              width={120}
              height={120}
              className="rounded-lg"
            />
          </div>
          <h2 className="text-3xl font-semibold text-beagle-dark">
            Beagle CAF Management Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-lg bg-red-50 border-l-4 border-error p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-beagle-dark mb-1.5">
                Email address
              </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="you@example.com"
                  />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-beagle-dark mb-1.5">
                Password
              </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-beagle-dark placeholder:text-gray-400 focus:outline-none focus:border-beagle-orange focus:ring-2 focus:ring-beagle-orange/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                  />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-6 rounded-lg text-sm font-semibold text-beagle-dark bg-white border-2 border-beagle-dark hover:bg-beagle-dark hover:text-white focus:outline-none focus:ring-2 focus:ring-beagle-dark focus:ring-offset-2 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

