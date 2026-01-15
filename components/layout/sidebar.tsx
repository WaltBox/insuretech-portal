'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText,
  UserCog,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  type LucideIcon
} from 'lucide-react'
import { User } from '@/lib/types'

interface SidebarLink {
  href: string
  label: string
  icon: LucideIcon | null
  imageIcon?: string
}

interface SidebarProps {
  user: User
  isOpen: boolean
  onToggle: () => void
}

export const Sidebar = memo(function Sidebar({ user, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Only match exact path OR if it's a parent route with children being viewed
  const isActive = useCallback((path: string, allLinks: SidebarLink[]) => {
    // Exact match
    if (pathname === path) return true
    
    // Check if this is a parent route - only active if NO other link is a better match
    if (pathname.startsWith(path + '/')) {
      // Check if any other link is a more specific match
      const moreSpecificMatch = allLinks.some(link => 
        link.href !== path && 
        pathname.startsWith(link.href) && 
        link.href.length > path.length
      )
      return !moreSpecificMatch
    }
    
    return false
  }, [pathname])

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

  const links = useMemo((): SidebarLink[] => {
    const adminLinks: SidebarLink[] = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/properties', label: 'Properties', icon: Building2 },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/claims', label: 'Claims', icon: FileText },
    ]

    const centralizedMemberLinks: SidebarLink[] = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/portfolio', label: 'Portfolio', icon: Building2 },
      { href: '/property-managers', label: 'Property Managers', icon: UserCog },
      { href: '/claims', label: 'Claims', icon: FileText },
    ]

    const propertyManagerLinks: SidebarLink[] = [
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
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] bg-white border-r border-gray-200 
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={onToggle}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Logo Section */}
        <div className="px-6 py-6 border-b border-gray-200">
          <Link href="/dashboard" className="block" onClick={() => onToggle()}>
            <Image
              src="/images/beagle-text-logo.webp"
              alt="Beagle"
              width={100}
              height={32}
              priority
              className="h-8 w-auto"
              style={{ width: 'auto', height: 'auto' }}
            />
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href, links)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onToggle()}
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
                {link.imageIcon ? (
                  <Image
                    src={link.imageIcon}
                    alt={link.label}
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  Icon && <Icon className="w-5 h-5" />
                )}
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom User Section with Dropdown */}
      <div ref={menuRef} className="px-3 py-4 border-t border-gray-200 relative">
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
    </>
  )
})

