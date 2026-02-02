'use client'

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, Layers, Headphones, FileCheck, ChevronRight, MessageCircle, CheckCircle2, Clock, Download, Mail, Loader2 } from 'lucide-react'
import { User, SupportTicket } from '@/lib/types'

interface DashboardShellProps {
  enrollmentCount?: number
  propertyCount?: number
  totalDoors?: number
  propertyStats: Array<{ status: string; count: number }>
  recentProperties: Array<{ id: string; name: string; city?: string; state?: string }>
  currentUser: User
  sdiCount?: number
  tllCount?: number
}

const REIMBURSEMENT_URL = 'https://claims.yourrenterskit.com/reimbursement'
const PROGRAM_URL = 'https://tools.yourrenterskit.com/renter-benefits/m2cw6o7lb9wa6zom1j'
const LEASE_ADDENDUM_PDF = '/Combined_TLW_SDA_Lease_Addendum.pdf'

export function DashboardShell({
  enrollmentCount = 0,
  propertyCount = 0,
  totalDoors = 0,
  propertyStats,
  recentProperties,
  currentUser,
  sdiCount = 0,
  tllCount = 0,
}: DashboardShellProps) {
  const [visibleCount, setVisibleCount] = useState(4)
  const [activePanel, setActivePanel] = useState<'claim' | 'program' | 'contact' | 'addendum' | null>(null)
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sent'>('idle')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [replyStatus, setReplyStatus] = useState<'idle' | 'sending'>('idle')
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const initialLoadRef = useRef(true)

  const visibleProperties = useMemo(
    () => recentProperties.slice(0, visibleCount),
    [recentProperties, visibleCount]
  )
  const hasMore = recentProperties.length > visibleCount

  const getStat = (status: string) => propertyStats.find((s) => s.status === status)?.count || 0

  const showClaimWebview = activePanel === 'claim'
  const showProgramWebview = activePanel === 'program'
  const showContactPanel = activePanel === 'contact'
  const showAddendumPanel = activePanel === 'addendum'

  // Fetch tickets when contact panel opens
  const fetchTickets = useCallback(async () => {
    // Only show loading on initial fetch
    const isInitialLoad = initialLoadRef.current
    if (isInitialLoad) {
      setTicketsLoading(true)
      initialLoadRef.current = false
    }
    
    try {
      const res = await fetch('/api/support/tickets')
      if (!res.ok) {
        setTickets([])
        setTicketsLoading(false)
        return
      }
      
      const data = await res.json()
      
      // Always update tickets - remove the comparison that was preventing updates
      setTickets(Array.isArray(data) ? data : [])
    } catch (error) {
      setTickets([])
    } finally {
      // Always clear loading state
      setTicketsLoading(false)
    }
  }, [])

  // Check if admin is typing
  const checkAdminTyping = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/typing`)
      if (res.ok) {
        const data = await res.json()
        setAdminTyping(data.isTyping)
      }
    } catch (error) {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    if (showContactPanel) {
      fetchTickets()
      
      // Poll for new messages every 5 seconds when panel is open
      const interval = setInterval(() => {
        fetchTickets()
        // Also check typing status if a ticket is selected
        if (selectedTicketId) {
          checkAdminTyping(selectedTicketId)
        }
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [showContactPanel, fetchTickets, selectedTicketId, checkAdminTyping])

  // Poll typing status more frequently when viewing a ticket
  useEffect(() => {
    if (selectedTicketId && showContactPanel) {
      const typingInterval = setInterval(() => {
        checkAdminTyping(selectedTicketId)
      }, 2000) // Check every 2 seconds for more responsive typing indicator
      
      return () => clearInterval(typingInterval)
    }
  }, [selectedTicketId, showContactPanel, checkAdminTyping])

  const closePanel = () => {
    setActivePanel(null)
    setContactSubject('')
    setContactMessage('')
    setContactStatus('idle')
    setEmailRecipient('')
    setEmailStatus('idle')
    setSelectedTicketId(null)
    setReplyMessage('')
    setAdminTyping(false)
    initialLoadRef.current = true
  }

  // Create new ticket
  const handleCreateTicket = async () => {
    if (!contactMessage.trim() || !contactSubject.trim()) return
    setContactStatus('sending')
    
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: contactMessage,
          subject: contactSubject,
        }),
      })
      
      if (!res.ok) {
        setContactStatus('error')
        setShowTypingIndicator(false)
        return
      }
      
      const data = await res.json()
      
      if (!data.ticket || !data.ticket.id) {
        setContactStatus('error')
        setShowTypingIndicator(false)
        return
      }
      
      const newTicketId = data.ticket.id
      
      // Clear form immediately
      setContactSubject('')
      setContactMessage('')
      setContactStatus('sent')
      
      // Switch to chat view immediately
      setSelectedTicketId(newTicketId)
      
      // Fetch tickets to show user's message
      await fetchTickets()
      
      // Show typing indicator after 1 second delay
      setTimeout(() => {
        setShowTypingIndicator(true)
        
        // Hide typing indicator and refresh after 4 seconds (when system message arrives)
        setTimeout(async () => {
          setShowTypingIndicator(false)
          // Refresh to show the system message
          await fetchTickets()
        }, 4000)
      }, 1000)
    } catch (error) {
      setContactStatus('error')
      setShowTypingIndicator(false)
    }
  }

  // Reply to existing ticket
  const handleReply = async (ticketId: string) => {
    if (!replyMessage.trim()) return
    setReplyStatus('sending')
    
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyMessage }),
      })
      
      if (!res.ok) {
        setReplyStatus('idle')
        return
      }
      
      const data = await res.json()
      
      setReplyMessage('')
      // Immediately refresh tickets to show the new message
      await fetchTickets()
    } catch (error) {
      // Silently handle error
    } finally {
      setReplyStatus('idle')
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-i3-navy">Real estate insurance <em className="italic font-serif text-i3-navy">syndicated.</em></h1>
        <p className="text-sm text-i3-text-muted mt-2">Overview of your property management system</p>
      </div>

      <div className="space-y-4 mb-8">
        {showClaimWebview || showProgramWebview ? (
          <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm min-h-[520px] lg:min-h-[640px] overflow-hidden">
            <iframe
              src={showClaimWebview ? REIMBURSEMENT_URL : PROGRAM_URL}
              className="w-full min-h-[520px] lg:min-h-[640px]"
              title={showClaimWebview ? 'Reimbursement' : 'View Program'}
              frameBorder="0"
              allowFullScreen
            />
            <button
              onClick={() => closePanel()}
              className="absolute bottom-2 right-2 text-xs text-gray-500 underline"
            >
              Exit Webview
            </button>
          </div>
        ) : showContactPanel ? (
          <div className="relative rounded-3xl border border-i3-navy/30 bg-gradient-to-r from-i3-navy/5 via-white to-i3-navy/5 px-8 py-10 shadow-lg min-h-[520px] lg:min-h-[640px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-i3-navy tracking-[0.3em]">Support</p>
                <h3 className="text-2xl font-semibold text-beagle-dark">Contact Support</h3>
                <p className="text-sm text-gray-600 max-w-xl">
                  Have a question or need assistance? Drop us a note and your account manager will be in touch.
                </p>
              </div>
              <button
                onClick={closePanel}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="mt-8 grid lg:grid-cols-2 gap-8">
              {/* Ticket List */}
              <div className={selectedTicketId ? 'lg:col-span-1' : 'lg:col-span-1'}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase text-gray-500 tracking-widest flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" />
                    Your Tickets
                  </p>
                  {selectedTicketId && (
                    <button
                      onClick={() => setSelectedTicketId(null)}
                      className="text-xs text-i3-navy hover:underline"
                    >
                      New Ticket
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                  {ticketsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-i3-navy" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                      <p className="text-xs text-gray-500">No tickets yet. Send a message to get started!</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicketId(ticket.id)
                          setReplyMessage('')
                          setAdminTyping(false)
                        }}
                        className={`w-full px-4 py-3 flex items-start justify-between gap-3 text-left rounded-2xl border transition-colors ${
                          selectedTicketId === ticket.id
                            ? 'bg-i3-navy/10 border-i3-navy'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-beagle-dark truncate">{ticket.subject}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(ticket.created_at)}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          ticket.status === 'resolved' 
                            ? 'bg-green-100 text-green-700' 
                            : ticket.status === 'closed'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {ticket.status === 'resolved' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {ticket.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Side: New Ticket Form OR Selected Ticket Chat */}
              <div className="lg:col-span-1">
                {selectedTicketId ? (
                  // Chat View for Selected Ticket
                  (() => {
                    const selectedTicket = tickets.find(t => t.id === selectedTicketId)
                    if (!selectedTicket) {
                      return (
                        <div className="bg-white rounded-2xl border border-gray-200 flex items-center justify-center h-[480px]">
                          <Loader2 className="w-5 h-5 animate-spin text-i3-navy" />
                        </div>
                      )
                    }
                    
                    return (
                      <div className="bg-white rounded-2xl border border-gray-200 flex flex-col h-[480px]">
                        {/* Chat Header */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-beagle-dark">{selectedTicket.subject}</p>
                              <p className="text-[10px] text-gray-400">
                                {selectedTicket.status === 'resolved' ? 'Resolved' : 
                                 selectedTicket.status === 'closed' ? 'Closed' : 'Open'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {/* Filter out system messages if typing indicator is showing */}
                          {selectedTicket.messages
                            ?.filter(msg => showTypingIndicator ? msg.sender_type !== 'system' : true)
                            ?.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                                msg.sender_type === 'user'
                                  ? 'bg-beagle-dark text-white rounded-br-sm'
                                  : msg.sender_type === 'admin'
                                  ? 'bg-i3-navy/20 text-beagle-dark rounded-bl-sm'
                                  : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                              }`}>
                                {msg.sender_type === 'admin' && (
                                  <p className="text-[10px] font-semibold text-i3-navy mb-1">Account Manager</p>
                                )}
                                {msg.sender_type === 'system' && (
                                  <p className="text-[10px] font-semibold text-gray-500 mb-1">Beagle</p>
                                )}
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 ${
                                  msg.sender_type === 'user' ? 'text-white/60' : 'text-gray-400'
                                }`}>{formatTime(msg.created_at)}</p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Typing indicator for auto-response */}
                          {showTypingIndicator && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%] px-3 py-2 rounded-2xl bg-gray-100 text-gray-700 rounded-bl-sm">
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-i3-navy rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-i3-navy rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-i3-navy rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </div>
                                  <span className="text-xs text-gray-500">Beagle is typing...</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Typing indicator for admin */}
                          {adminTyping && !showTypingIndicator && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%] px-3 py-2 rounded-2xl bg-i3-navy/20 text-beagle-dark rounded-bl-sm">
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-semibold text-i3-navy mb-0">Account Manager</p>
                                  <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-i3-navy rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-i3-navy rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-i3-navy rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reply Input */}
                        <div className="px-4 py-3 border-t border-gray-200">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Type a reply..."
                              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-i3-navy/30"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleReply(selectedTicket.id)
                                }
                              }}
                            />
                            <button
                              onClick={() => handleReply(selectedTicket.id)}
                              disabled={replyStatus === 'sending' || !replyMessage.trim()}
                              className="px-4 py-2 rounded-full bg-beagle-dark text-white text-sm disabled:opacity-50 hover:bg-beagle-dark/90 transition-colors"
                            >
                              {replyStatus === 'sending' ? '...' : 'Send'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  // New Ticket Form
                  <div>
                    <p className="text-xs uppercase text-gray-500 tracking-widest mb-3">New Ticket</p>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4">
                      <div className="mb-3 pb-3 border-b border-gray-100">
                        <p className="text-xs text-gray-400">From</p>
                        <p className="text-sm font-medium text-beagle-dark">
                          {[currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || 'Unknown User'}
                        </p>
                        <p className="text-[10px] text-gray-400">{currentUser.email}</p>
                      </div>
                      
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-i3-navy/30 focus:border-i3-navy"
                      />
                      
                      <textarea
                        value={contactMessage}
                        onChange={(event) => setContactMessage(event.target.value)}
                        rows={6}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-i3-navy/30 focus:border-i3-navy"
                        placeholder="Tell us what you need help with..."
                      />

                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          disabled={contactStatus === 'sending' || !contactMessage.trim() || !contactSubject.trim()}
                          onClick={handleCreateTicket}
                          className="rounded-full bg-beagle-dark px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-beagle-dark/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {contactStatus === 'sending' ? 'Sending...' : 'Send'}
                        </button>
                        {contactStatus === 'sent' && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Ticket created!
                          </p>
                        )}
                        {contactStatus === 'error' && (
                          <p className="text-xs text-red-600">Failed to send. Try again.</p>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-[10px] text-gray-400">
                      Your dedicated account manager will follow up shortly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : showAddendumPanel ? (
          <div className="relative rounded-3xl border border-i3-navy/30 bg-gradient-to-r from-i3-navy/5 via-white to-i3-navy/5 px-8 py-10 shadow-lg min-h-[520px] lg:min-h-[640px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-i3-navy tracking-[0.3em]">Documents</p>
                <h3 className="text-2xl font-semibold text-beagle-dark">Lease Addendum</h3>
                <p className="text-sm text-gray-600 max-w-xl">
                  View, download, or send the TLW & SDA Lease Addendum to tenants.
                </p>
              </div>
              <button
                onClick={closePanel}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="mt-8 grid lg:grid-cols-3 gap-6">
              {/* PDF Viewer */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-[400px] lg:h-[480px]">
                  <iframe
                    src={LEASE_ADDENDUM_PDF}
                    className="w-full h-full"
                    title="Lease Addendum PDF"
                  />
                </div>
              </div>

              {/* Actions Panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs uppercase text-gray-500 tracking-widest mb-4">Actions</p>
                  
                  <a
                    href={LEASE_ADDENDUM_PDF}
                    download="Beagle_Lease_Addendum.pdf"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-beagle-dark text-white hover:bg-beagle-dark/90 transition-colors mb-3"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-sm font-medium">Download PDF</span>
                  </a>

                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="text-xs uppercase text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      Send via Email
                    </p>
                    <input
                      type="email"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-i3-navy/30 focus:border-i3-navy"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEmailStatus('sent')
                        setEmailRecipient('')
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-i3-navy text-i3-navy hover:bg-i3-navy/10 transition-colors text-sm font-medium"
                    >
                      <Mail className="w-4 h-4" />
                      Send
                    </button>
                    {emailStatus === 'sent' && (
                      <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Email sent!
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                  <p className="text-xs font-medium text-amber-800 mb-1">Document Contents</p>
                  <ul className="text-[11px] text-amber-700 space-y-1">
                    <li>• Tenant Liability Waiver (TLW) - $16/mo</li>
                    <li>• Security Deposit Alternative - $38/mo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-6 border border-i3-border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-i3-navy/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-i3-navy" />
                </div>
                <h3 className="text-sm font-medium text-i3-text-muted">System Overview</h3>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <p className="text-4xl font-bold text-i3-navy">{enrollmentCount.toLocaleString()}</p>
                <span className="text-sm text-i3-text-muted">Total Enrollments</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="bg-i3-bg rounded-xl px-4 py-3">
                  <span className="text-xs text-i3-text-muted block">Total Doors</span>
                  <span className="text-lg font-semibold text-i3-navy">{totalDoors.toLocaleString()}</span>
                </div>
                <div className="bg-i3-bg rounded-xl px-4 py-3">
                  <span className="text-xs text-i3-text-muted block">SDA</span>
                  <span className="text-lg font-semibold text-i3-navy">{sdiCount.toLocaleString()}</span>
                </div>
                <div className="bg-i3-bg rounded-xl px-4 py-3">
                  <span className="text-xs text-i3-text-muted block">TLL</span>
                  <span className="text-lg font-semibold text-i3-navy">{tllCount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-i3-navy mb-4 mt-8">Recent Properties</h2>
            {visibleProperties.length > 0 ? (
              <div className="space-y-3 mb-4">
                {visibleProperties.map((property) => {
                  // Property managers go to /my-properties, others go to /portfolio
                  const propertyUrl = currentUser.role === 'property_manager' 
                    ? `/my-properties/${property.id}`
                    : currentUser.role === 'admin'
                    ? `/admin/properties/${property.id}`
                    : `/portfolio/${property.id}`
                  
                  return (
                  <Link
                    key={property.id}
                    href={propertyUrl}
                    className="group flex items-center justify-between px-4 py-4 bg-white rounded-xl border border-i3-border hover:border-i3-navy hover:shadow-sm transition-all duration-200"
                  >
                    <div>
                      <p className="text-sm font-semibold text-i3-navy">{property.name}</p>
                      <p className="text-xs text-i3-text-muted">
                        {[property.city, property.state].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-i3-text-muted group-hover:text-i3-navy transition-colors duration-200" />
                  </Link>
                  )
                })}
                {hasMore && (
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 4)}
                    className="w-full text-center py-3 text-xs font-semibold text-i3-text-muted border border-dashed border-i3-border rounded-xl hover:bg-white transition-colors"
                  >
                    View More
                  </button>
                )}
                {visibleCount > 4 && (
                  <button
                    onClick={() => setVisibleCount(4)}
                    className="w-full text-center py-3 text-xs font-semibold text-i3-text-muted border border-dashed border-i3-border rounded-xl hover:bg-white transition-colors"
                  >
                    View Less
                  </button>
                )}
              </div>
            ) : (
              <div className="px-4 py-8 bg-white rounded-xl border border-i3-border text-center mb-8">
                <p className="text-xs text-i3-text-muted">No properties yet</p>
              </div>
            )}
          </>
        )}
      </div>

      <h2 className="text-sm font-semibold text-i3-navy mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActivePanel('claim')}
          className="group bg-white hover:bg-i3-bg-light rounded-xl p-6 border border-i3-border hover:border-i3-navy hover:shadow-sm transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-i3-navy/10 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6 text-i3-navy" />
          </div>
          <p className="text-sm font-semibold text-i3-navy">File a Claim</p>
        </button>

        <button
          onClick={() => setActivePanel('program')}
          className="group bg-white hover:bg-i3-bg-light rounded-xl p-6 border border-i3-border hover:border-i3-navy hover:shadow-sm transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-i3-navy/10 flex items-center justify-center mb-3">
            <Layers className="w-6 h-6 text-i3-navy" />
          </div>
          <p className="text-sm font-semibold text-i3-navy">View Program</p>
        </button>

        <button
          onClick={() => {
            setContactStatus('idle')
            setActivePanel('contact')
          }}
          className="group bg-white hover:bg-i3-bg-light rounded-xl p-6 border border-i3-border hover:border-i3-navy hover:shadow-sm transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-i3-navy/10 flex items-center justify-center mb-3">
            <Headphones className="w-6 h-6 text-i3-navy" />
          </div>
          <p className="text-sm font-semibold text-i3-navy">Contact Support</p>
        </button>

        <button
          onClick={() => {
            setEmailStatus('idle')
            setActivePanel('addendum')
          }}
          className="group bg-white hover:bg-i3-bg-light rounded-xl p-6 border border-i3-border hover:border-i3-navy hover:shadow-sm transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-i3-navy/10 flex items-center justify-center mb-3">
            <FileCheck className="w-6 h-6 text-i3-navy" />
          </div>
          <p className="text-sm font-semibold text-i3-navy">Lease Addendum</p>
        </button>
      </div>

    </div>
  )
}
