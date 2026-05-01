'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { HiPaperAirplane, HiUserCircle, HiMail } from 'react-icons/hi'

interface UserInfo {
  role: string
  full_name: string
  email: string
  account_id: string
}

interface Message {
  id: string
  sender_email: string
  recipient_email: string
  message_text: string
  is_read: boolean
  created_at: string
}

interface ConversationPartner {
  email: string
  name: string
  unreadCount: number
  lastMessage: string
  lastAt: string
}

export default function NotesPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<ConversationPartner[]>([])
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (selectedPartner && userInfo) {
      loadMessages(selectedPartner)
      markAsRead(selectedPartner)
    }
  }, [selectedPartner])

  // Poll for new messages every 30s
  useEffect(() => {
    if (!selectedPartner || !userInfo) return

    const interval = setInterval(() => {
      loadMessages(selectedPartner)
    }, 30000)

    const handleFocus = () => {
      if (selectedPartner) {
        loadMessages(selectedPartner)
        markAsRead(selectedPartner)
      }
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [selectedPartner, userInfo])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('role, full_name, email, account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      setLoading(false)
      return
    }

    setUserInfo(userData)
    const isLeader = ['admin', 'manager', 'coach'].includes(userData.role)

    if (isLeader) {
      await loadPartners(userData)
    } else {
      // Rep view: find their manager
      await loadRepConversation(userData)
    }

    setLoading(false)
  }

  async function loadPartners(userData: UserInfo) {
    // Load all team reps
    const { data: reps } = await supabase
      .from('Users')
      .select('full_name, email')
      .eq('account_id', userData.account_id)
      .eq('role', 'rep')

    if (!reps) return

    // Load all messages for this user
    const { data: allMessages } = await supabase
      .from('Direct_Messages')
      .select('*')
      .eq('account_id', userData.account_id)
      .or(`sender_email.eq.${userData.email},recipient_email.eq.${userData.email}`)
      .order('created_at', { ascending: false })

    const partnerMap: Record<string, ConversationPartner> = {}

    // Initialize from reps list
    reps.forEach((r) => {
      partnerMap[r.email] = {
        email: r.email,
        name: r.full_name || r.email,
        unreadCount: 0,
        lastMessage: '',
        lastAt: '',
      }
    })

    // Overlay message data
    if (allMessages) {
      allMessages.forEach((msg) => {
        const partnerEmail = msg.sender_email === userData.email ? msg.recipient_email : msg.sender_email
        if (!partnerMap[partnerEmail]) {
          partnerMap[partnerEmail] = {
            email: partnerEmail,
            name: partnerEmail,
            unreadCount: 0,
            lastMessage: '',
            lastAt: '',
          }
        }
        const p = partnerMap[partnerEmail]
        if (!p.lastAt || new Date(msg.created_at) > new Date(p.lastAt)) {
          p.lastMessage = msg.message_text
          p.lastAt = msg.created_at
        }
        if (msg.recipient_email === userData.email && !msg.is_read) {
          p.unreadCount += 1
        }
      })
    }

    const sorted = Object.values(partnerMap).sort((a, b) => {
      if (a.lastAt && b.lastAt) return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
      if (a.lastAt) return -1
      if (b.lastAt) return 1
      return a.name.localeCompare(b.name)
    })

    setPartners(sorted)

    // Auto-select from query param or first partner
    const repParam = searchParams.get('rep')
    if (repParam && sorted.find((p) => p.email === repParam)) {
      setSelectedPartner(repParam)
    } else if (sorted.length > 0) {
      setSelectedPartner(sorted[0].email)
    }
  }

  async function loadRepConversation(userData: UserInfo) {
    // Find a manager/admin in the account
    const { data: leaders } = await supabase
      .from('Users')
      .select('full_name, email')
      .eq('account_id', userData.account_id)
      .in('role', ['admin', 'manager', 'coach'])
      .limit(1)

    if (leaders && leaders.length > 0) {
      const leader = leaders[0]
      setPartners([{
        email: leader.email,
        name: leader.full_name || leader.email,
        unreadCount: 0,
        lastMessage: '',
        lastAt: '',
      }])
      setSelectedPartner(leader.email)
    }
  }

  async function loadMessages(partnerEmail: string) {
    if (!userInfo) return

    const { data } = await supabase
      .from('Direct_Messages')
      .select('*')
      .eq('account_id', userInfo.account_id)
      .or(
        `and(sender_email.eq.${userInfo.email},recipient_email.eq.${partnerEmail}),and(sender_email.eq.${partnerEmail},recipient_email.eq.${userInfo.email})`
      )
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) setMessages(data)
  }

  async function markAsRead(partnerEmail: string) {
    if (!userInfo) return

    await supabase
      .from('Direct_Messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('account_id', userInfo.account_id)
      .eq('sender_email', partnerEmail)
      .eq('recipient_email', userInfo.email)
      .eq('is_read', false)

    // Update local unread count
    setPartners((prev) =>
      prev.map((p) => p.email === partnerEmail ? { ...p, unreadCount: 0 } : p)
    )
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedPartner || !userInfo) return

    setSending(true)
    const { error } = await supabase
      .from('Direct_Messages')
      .insert({
        account_id: userInfo.account_id,
        sender_email: userInfo.email,
        recipient_email: selectedPartner,
        message_text: newMessage.trim(),
      })

    if (!error) {
      setNewMessage('')
      await loadMessages(selectedPartner)
    }
    setSending(false)
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!userInfo) {
    return <div className="text-light-muted">Unable to load user data.</div>
  }

  const isLeader = ['admin', 'manager', 'coach'].includes(userInfo.role)

  // Manager view: sidebar + conversation
  if (isLeader) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-light mb-1">1-on-1 Notes</h1>
        <p className="text-light-muted text-sm mb-6">Private notes with your team members.</p>

        <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Partner List */}
          <div className="w-72 bg-navy-light rounded-2xl border border-teal/10 flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-navy">
              <p className="text-sm font-medium text-light">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {partners.map((partner) => (
                <button
                  key={partner.email}
                  onClick={() => setSelectedPartner(partner.email)}
                  className={`w-full text-left p-4 border-b border-navy/50 hover:bg-navy/50 transition-colors ${
                    selectedPartner === partner.email ? 'bg-teal/10 border-l-2 border-l-teal' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HiUserCircle className="text-teal text-2xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-light truncate">{partner.name}</p>
                        {partner.unreadCount > 0 && (
                          <span className="bg-pink text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-2">
                            {partner.unreadCount}
                          </span>
                        )}
                      </div>
                      {partner.lastMessage && (
                        <p className="text-xs text-light-muted truncate mt-0.5">{partner.lastMessage}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {partners.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-sm text-light-muted">No team members found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 bg-navy-light rounded-2xl border border-teal/10 flex flex-col overflow-hidden">
            {selectedPartner ? (
              <>
                <div className="p-4 border-b border-navy">
                  <p className="text-sm font-medium text-light">
                    {partners.find((p) => p.email === selectedPartner)?.name || selectedPartner}
                  </p>
                  <p className="text-xs text-light-muted">{selectedPartner}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <HiMail className="text-teal text-3xl mb-2" />
                      <p className="text-light-muted text-sm">No messages yet. Start the conversation.</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.sender_email === userInfo.email
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                          isMine
                            ? 'bg-teal/20 text-light'
                            : 'bg-navy text-light'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-teal/60' : 'text-light-muted'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSend} className="p-4 border-t border-navy flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-navy border border-teal/20 rounded-lg text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-teal text-navy font-bold py-2.5 px-4 rounded-lg hover:bg-aqua transition-colors disabled:opacity-50"
                  >
                    <HiPaperAirplane className="text-lg" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-light-muted text-sm">Select a team member to start a conversation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Rep view: single conversation
  const partnerInfo = partners[0]

  return (
    <div>
      <h1 className="text-2xl font-bold text-light mb-1">1-on-1 Notes</h1>
      <p className="text-light-muted text-sm mb-6">
        {partnerInfo ? `Conversation with ${partnerInfo.name}` : 'Your private notes with your manager.'}
      </p>

      <div className="bg-navy-light rounded-2xl border border-teal/10 flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
        {selectedPartner ? (
          <>
            <div className="p-4 border-b border-navy">
              <p className="text-sm font-medium text-light">
                {partnerInfo?.name || selectedPartner}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <HiMail className="text-teal text-3xl mb-2" />
                  <p className="text-light-muted text-sm">No messages yet.</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender_email === userInfo.email
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                      isMine
                        ? 'bg-teal/20 text-light'
                        : 'bg-navy text-light'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-teal/60' : 'text-light-muted'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-navy flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 bg-navy border border-teal/20 rounded-lg text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-teal text-navy font-bold py-2.5 px-4 rounded-lg hover:bg-aqua transition-colors disabled:opacity-50"
              >
                <HiPaperAirplane className="text-lg" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-light-muted text-sm">No manager found in your account.</p>
          </div>
        )}
      </div>
    </div>
  )
}
