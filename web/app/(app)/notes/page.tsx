'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { HiChatAlt2, HiPaperAirplane, HiUserCircle } from 'react-icons/hi'

interface CurrentUser {
  account_id: string
  email: string
  full_name: string | null
  role: string
}

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface DirectMessage {
  id: string
  account_id: string
  sender_email: string
  recipient_email: string
  message_text: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

interface ConversationBadge {
  unreadCount: number
}

const leaderRoles = new Set(['admin', 'manager', 'coach'])

export default function NotesPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [selectedEmail, setSelectedEmail] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationBadges, setConversationBadges] = useState<Record<string, ConversationBadge>>({})
  const searchParams = useSearchParams()

  useEffect(() => {
    loadNotes(searchParams.get('rep') || undefined)
  }, [searchParams])

  async function loadNotes(selectedRep?: string) {
    setLoading(true)
    setError(null)

    const response = await fetch(`/api/notes${selectedRep ? `?rep=${encodeURIComponent(selectedRep)}` : ''}`, {
      cache: 'no-store',
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setError(data?.error || 'Could not load notes.')
      setLoading(false)
      return
    }

    setCurrentUser(data.currentUser)
    setMembers(data.members || [])
    setSelectedEmail(data.selectedEmail || '')
    setMessages(data.messages || [])
    setConversationBadges(data.conversationBadges || {})
    setLoading(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser || !selectedEmail || !draft.trim()) return

    setSending(true)
    setError(null)

    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientEmail: selectedEmail,
        messageText: draft.trim(),
      }),
    })

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.error || 'Could not send note.')
      setSending(false)
      return
    }

    setDraft('')
    await loadNotes(selectedEmail)
    setSending(false)
  }

  const selectedMember = useMemo(
    () => members.find((member) => member.email === selectedEmail),
    [members, selectedEmail]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isLeader = currentUser ? leaderRoles.has(currentUser.role) : false

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-terracotta/10">
        <div>
          <h1 className="text-3xl font-bold text-espresso">1-on-1 Notes</h1>
          <p className="text-stone-light mt-1">
            Private manager-rep notes and coaching follow-up.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-pink/10 border border-pink/20 text-terracotta rounded-lg p-3 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="bg-white rounded-2xl border border-bone-dark shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-bone">
            <h2 className="font-bold text-espresso">{isLeader ? 'Team Members' : 'Conversations'}</h2>
          </div>

          {members.length === 0 ? (
            <div className="p-5 text-sm text-stone-light">
              {isLeader
                ? 'No team members yet. Invite reps from the Team page.'
                : 'No notes yet. Your manager can start a 1-on-1 thread from your profile.'}
            </div>
          ) : (
            <div className="divide-y divide-bone">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => router.push(`/notes?rep=${encodeURIComponent(member.email)}`)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                    selectedEmail === member.email
                      ? 'bg-terracotta/10 text-espresso'
                      : 'hover:bg-bone-light text-stone'
                  }`}
                >
                  <HiUserCircle className="text-terracotta text-2xl flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold truncate">
                      {member.full_name || member.email}
                    </span>
                    <span className="block text-xs text-stone-light truncate">
                      {member.email}
                    </span>
                  </span>
                  {conversationBadges[member.email]?.unreadCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-[10px] font-bold text-white animate-pulse">
                      {conversationBadges[member.email].unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="bg-white rounded-2xl border border-bone-dark shadow-sm min-h-[560px] flex flex-col">
          {selectedEmail ? (
            <>
              <div className="px-6 py-4 border-b border-bone">
                <h2 className="text-xl font-bold text-espresso">
                  {selectedMember?.full_name || selectedEmail}
                </h2>
                <p className="text-sm text-stone-light">{selectedEmail}</p>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center text-stone-light">
                    <HiChatAlt2 className="text-5xl text-terracotta/40 mb-3" />
                    <p className="font-medium text-espresso">No notes yet</p>
                    <p className="text-sm max-w-sm mt-1">
                      Start with a follow-up from your latest coaching conversation.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender_email === currentUser?.email
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            mine
                              ? 'bg-terracotta text-white'
                              : 'bg-bone-light text-espresso border border-bone-dark'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                          <p className={`text-[11px] mt-2 ${mine ? 'text-white/70' : 'text-stone-light'}`}>
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="border-t border-bone p-4">
                <div className="flex gap-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    className="flex-1 px-4 py-3 bg-bone-light border border-bone-dark rounded-lg text-espresso placeholder-stone-light focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 resize-none"
                    placeholder="Write a private note..."
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="self-end flex items-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-3 px-5 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <HiPaperAirplane />
                    {sending ? 'Sending' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-stone-light p-8">
              <div>
                <HiChatAlt2 className="text-5xl text-terracotta/40 mx-auto mb-3" />
                <p>Select a conversation to view notes.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
