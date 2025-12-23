'use client'

import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

interface ImpersonationBannerProps {
  impersonatedUser: {
    first_name: string
    last_name: string
    email: string
    role: string
  }
}

export function ImpersonationBanner({ impersonatedUser }: ImpersonationBannerProps) {
  const [stopping, setStopping] = useState(false)

  const handleStopImpersonation = async () => {
    setStopping(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      })

      if (response.ok) {
        // Force full page reload to clear all state
        window.location.href = '/admin/users'
      } else {
        throw new Error('Failed to stop impersonation')
      }
    } catch (error) {
      console.error('Failed to stop impersonation:', error)
      alert('Failed to stop impersonation. Please try again.')
      setStopping(false)
    }
  }

  const roleDisplay = impersonatedUser.role.replace('_', ' ')
  const companyName = roleDisplay === 'property manager' ? 'Property Management' : 'Portal'

  return (
    <div className="bg-[#4d1701] text-white px-6 py-1.5 flex items-center justify-center shadow-sm">
      <div className="flex items-center gap-2 text-xs">
        <span>
          You are viewing this page as <span className="font-semibold">{impersonatedUser.first_name} {impersonatedUser.last_name}</span> from <span className="font-semibold">{companyName}</span>.
        </span>
        <button
          onClick={handleStopImpersonation}
          disabled={stopping}
          className="inline-flex items-center gap-1 ml-4 hover:underline transition-all duration-200 disabled:opacity-50 font-medium"
        >
          {stopping ? 'Exiting...' : 'Exit View'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

