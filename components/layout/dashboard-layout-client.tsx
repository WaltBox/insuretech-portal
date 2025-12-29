'use client'

import { useState, useEffect } from 'react'
import { Menu, MessageCircle } from 'lucide-react'
import { Sidebar } from './sidebar'
import { SupportTicketsPanel } from '@/components/admin/support-tickets-panel'
import { User } from '@/lib/types'

interface DashboardLayoutClientProps {
  user: User
  children: React.ReactNode
}

export function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [supportPanelOpen, setSupportPanelOpen] = useState(false)
  const [openTicketCount, setOpenTicketCount] = useState(0)

  // Fetch open ticket count for admins
  useEffect(() => {
    if (user.role !== 'admin') return

    const fetchTicketCount = async () => {
      try {
        const res = await fetch('/api/support/tickets')
        if (res.ok) {
          const tickets = await res.json()
          setOpenTicketCount(tickets.filter((t: { status: string }) => t.status === 'open').length)
        }
      } catch (error) {
        console.error('Failed to fetch ticket count:', error)
      }
    }

    fetchTicketCount()
    const interval = setInterval(fetchTicketCount, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [user.role])

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar user={user} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        
        <div>
          {children}
        </div>
      </main>

      {/* Admin Support Tickets Button */}
      {user.role === 'admin' && (
        <button
          onClick={() => setSupportPanelOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 bg-beagle-dark text-white rounded-full shadow-lg hover:bg-beagle-dark/90 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          {openTicketCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {openTicketCount > 9 ? '9+' : openTicketCount}
            </span>
          )}
        </button>
      )}

      {/* Support Tickets Panel */}
      {user.role === 'admin' && (
        <SupportTicketsPanel
          isOpen={supportPanelOpen}
          onClose={() => setSupportPanelOpen(false)}
        />
      )}
    </div>
  )
}


