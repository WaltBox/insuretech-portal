'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState, useMemo, useCallback, memo } from 'react'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  UserCog,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  LogOut
} from 'lucide-react'
import { User } from '@/lib/types'

interface SidebarProps {
  user: User
}

export const Sidebar = memo(function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isActive = useCallback((path: string) => pathname.startsWith(path), [pathname])

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Logout failed:', error)
      setLoggingOut(false)
    }
  }, [])

  const links = useMemo(() => {
    const adminLinks = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/properties', label: 'Properties', icon: Building2 },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/claims', label: 'Claims', icon: FileText },
    ]

    const centralizedMemberLinks = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/portfolio', label: 'Portfolio', icon: Building2 },
      { href: '/property-managers', label: 'Property Managers', icon: UserCog },
      { href: '/claims', label: 'Claims', icon: FileText },
    ]

    const propertyManagerLinks = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/my-properties', label: 'My Properties', icon: Building2 },
      { href: '/my-properties/claims', label: 'Claims', icon: FileText },
    ]

    return user.role === 'admin'
      ? adminLinks
      : user.role === 'centralized_member'
      ? centralizedMemberLinks
      : propertyManagerLinks
  }, [user.role])

  return (
    <aside className="w-[260px] bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-gray-200">
        <Link href="/dashboard" className="block">
          <Image
            src="/images/beagle-text-logo.webp"
            alt="Beagle"
            width={100}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-3 
                  px-3 py-2.5 
                  rounded-lg 
                  font-medium
                  text-sm
                  transition-all duration-200
                  ${active 
                    ? 'bg-gray-100 text-beagle-dark' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-beagle-dark'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom User Section with Dropdown */}
      <div className="px-3 py-4 border-t border-gray-200 relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-beagle-dark truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {user.role.replace('_', ' ')}
            </p>
          </div>
          {showMenu ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setShowMenu(false)}
            >
              <UserIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-beagle-dark font-medium">Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-beagle-dark font-medium">
                {loggingOut ? 'Signing out...' : 'Sign out'}
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
})

