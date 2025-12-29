'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { MessageCircle, CheckCircle2, Clock, X, Send, User as UserIcon } from 'lucide-react'
import { SupportTicket } from '@/lib/types'

interface SupportTicketsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SupportTicketsPanel({ isOpen, onClose }: SupportTicketsPanelProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const initialLoadRef = React.useRef(true)

  const fetchTickets = useCallback(async () => {
    // Only show loading on initial load
    const isInitialLoad = initialLoadRef.current
    if (isInitialLoad) {
      setLoading(true)
      initialLoadRef.current = false
    }
    
    try {
      const res = await fetch('/api/support/tickets')
      if (res.ok) {
        const data = await res.json()
        // Only update if data actually changed (prevents flashing)
        setTickets(prev => {
          const prevJson = JSON.stringify(prev.map(t => ({ id: t.id, updated_at: t.updated_at, status: t.status, messages: t.messages?.length })))
          const newJson = JSON.stringify(data.map((t: SupportTicket) => ({ id: t.id, updated_at: t.updated_at, status: t.status, messages: t.messages?.length })))
          if (prevJson !== newJson) {
            // Update selected ticket if it exists
            if (selectedTicket) {
              const updated = data.find((t: SupportTicket) => t.id === selectedTicket.id)
              if (updated) {
                setSelectedTicket(updated)
              }
            }
            return data
          }
          return prev
        })
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      }
    }
  }, [selectedTicket])

  useEffect(() => {
    if (isOpen) {
      initialLoadRef.current = true
      fetchTickets()
      // Poll for new messages every 10 seconds
      const interval = setInterval(fetchTickets, 10000)
      return () => clearInterval(interval)
    } else {
      initialLoadRef.current = true
    }
  }, [isOpen, fetchTickets])

  const sendTypingStatus = useCallback(async (ticketId: string, isTyping: boolean) => {
    try {
      await fetch(`/api/support/tickets/${ticketId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping }),
      })
    } catch (error) {
      // Silently fail - typing indicator is not critical
    }
  }, [])

  const handleTyping = useCallback((ticketId: string, message: string) => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (message.trim()) {
      // Send typing status
      sendTypingStatus(ticketId, true)
      
      // Clear typing after 3 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(ticketId, false)
      }, 3000)
    } else {
      // Clear typing immediately if message is empty
      sendTypingStatus(ticketId, false)
    }
  }, [sendTypingStatus])

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return
    setReplying(true)

    // Clear typing status
    if (selectedTicket) {
      sendTypingStatus(selectedTicket.id, false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }

    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyMessage }),
      })

      if (res.ok) {
        setReplyMessage('')
        fetchTickets()
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
    } finally {
      setReplying(false)
    }
  }

  const handleStatusChange = async (ticketId: string, status: 'open' | 'resolved' | 'closed') => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        const updatedTicket = await res.json()
        // Update selected ticket immediately
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: updatedTicket.status })
        }
        // Refresh tickets list
        fetchTickets()
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Failed to update status:', errorData)
        alert('Failed to update ticket status. Please try again.')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update ticket status. Please try again.')
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

  const getUserName = (ticket: SupportTicket) => {
    if (ticket.user) {
      return [ticket.user.first_name, ticket.user.last_name].filter(Boolean).join(' ') || ticket.user.email
    }
    return 'Unknown User'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-beagle-orange" />
          <h2 className="font-semibold text-beagle-dark">Support Tickets</h2>
          {tickets.filter(t => t.status === 'open').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              {tickets.filter(t => t.status === 'open').length} open
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Ticket List */}
        <div className={`${selectedTicket ? 'hidden md:block md:w-1/3' : 'w-full'} border-r border-gray-200 overflow-y-auto`}>
          {loading && tickets.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No tickets yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedTicket?.id === ticket.id ? 'bg-beagle-orange/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-beagle-dark truncate">
                        {getUserName(ticket)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{ticket.subject}</p>
                    </div>
                    <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                      ticket.status === 'open' ? 'bg-amber-500' : 
                      ticket.status === 'resolved' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{formatTime(ticket.updated_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation View */}
        {selectedTicket && (
          <div className="flex-1 flex flex-col">
            {/* Conversation Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="md:hidden text-xs text-beagle-orange"
                >
                  ← Back
                </button>
                <div className="flex-1 md:flex-initial">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-beagle-dark">
                      {getUserName(selectedTicket)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">{selectedTicket.user?.email}</p>
                </div>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as 'open' | 'resolved' | 'closed')}
                  className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${
                    selectedTicket.status === 'open' ? 'bg-amber-100 text-amber-700' :
                    selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedTicket.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    msg.sender_type === 'admin'
                      ? 'bg-beagle-dark text-white rounded-br-sm'
                      : msg.sender_type === 'system'
                      ? 'bg-gray-100 text-gray-600 rounded-bl-sm italic'
                      : 'bg-beagle-orange/20 text-beagle-dark rounded-bl-sm'
                  }`}>
                    {msg.sender_type === 'user' && msg.sender && (
                      <p className="text-[10px] font-semibold text-beagle-orange mb-1">
                        {[msg.sender.first_name, msg.sender.last_name].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {msg.sender_type === 'system' && (
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">Auto-response</p>
                    )}
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${
                      msg.sender_type === 'admin' ? 'text-white/60' : 'text-gray-400'
                    }`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => {
                    setReplyMessage(e.target.value)
                    if (selectedTicket) {
                      handleTyping(selectedTicket.id, e.target.value)
                    }
                  }}
                  placeholder="Type your reply..."
                  className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-beagle-orange/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleReply()
                    }
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={replying || !replyMessage.trim()}
                  className="p-2 rounded-full bg-beagle-dark text-white disabled:opacity-50 hover:bg-beagle-dark/90 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

