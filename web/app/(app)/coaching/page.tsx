'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HiMail, HiCheck, HiClock, HiEye, HiPencil, HiX, HiReply } from 'react-icons/hi'
import toast from 'react-hot-toast'

interface CoachingMessage {
  id: string
  rep_email: string
  manager_email: string
  status: string
  generated_at: string
  sent_at: string | null
  read_at: string | null
  coaching_content: string
  methodology: string
  rep_response: string | null
  responded_at: string | null
  subject: string | null
}

interface Commitment {
  id: string
  commitment_text: string
  status: string
  completed_at: string | null
}

type TabKey = 'pending' | 'sent' | 'replies'

export default function CoachingPage() {
  const [messages, setMessages] = useState<CoachingMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [commitments, setCommitments] = useState<Record<string, Commitment[]>>({})
  const supabase = createClient()

  useEffect(() => {
    loadCoaching()
  }, [])

  async function loadCoaching() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id, role, email')
      .eq('auth_id', user.id)
      .single()

    if (!userData) { setLoading(false); return }
    setUserRole(userData.role)
    setUserEmail(userData.email)

    let query = supabase
      .from('Coaching_Messages')
      .select('*')
      .eq('account_id', userData.account_id)
      .order('generated_at', { ascending: false })
      .limit(50)

    if (userData.role === 'rep') {
      query = query.eq('rep_email', userData.email)
    }

    const { data } = await query
    if (data) setMessages(data)
    setLoading(false)
  }

  async function handleApproveAndSend(messageId: string) {
    const { error } = await supabase.functions.invoke('send-coaching-email', {
      body: { coaching_message_id: messageId },
    })

    if (!error) {
      toast.success('Coaching sent to rep')
      loadCoaching()
    } else {
      toast.error('Failed to send')
    }
  }

  async function handleSaveEdit(messageId: string) {
    const { error } = await supabase
      .from('Coaching_Messages')
      .update({
        coaching_content: editContent,
        manager_edited: true,
      })
      .eq('id', messageId)

    if (!error) {
      toast.success('Coaching updated')
      setEditingId(null)
      loadCoaching()
    }
  }

  // 4B: Auto-mark-as-read when rep expands a sent message
  async function handleExpand(msgId: string, msg: CoachingMessage) {
    const isAlreadyExpanded = expandedId === msgId
    setExpandedId(isAlreadyExpanded ? null : msgId)

    if (!isAlreadyExpanded) {
      // Load commitments for this message
      loadCommitments(msgId)

      // Auto-mark as read for reps viewing sent messages
      const isRepUser = !['admin', 'manager', 'coach'].includes(userRole)
      if (isRepUser && msg.status === 'sent' && !msg.read_at) {
        await supabase
          .from('Coaching_Messages')
          .update({
            read_at: new Date().toISOString(),
            is_read: true,
            status: 'read',
          })
          .eq('id', msgId)

        // Update local state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, status: 'read', read_at: new Date().toISOString() }
              : m
          )
        )
      }
    }
  }

  // 4C: In-app reply for rep
  async function handleSendReply(messageId: string) {
    if (!replyText.trim()) return

    const { error } = await supabase
      .from('Coaching_Messages')
      .update({
        rep_response: replyText.trim(),
        responded_at: new Date().toISOString(),
        status: 'replied',
      })
      .eq('id', messageId)

    if (!error) {
      toast.success('Reply sent')
      setReplyText('')
      setReplyingTo(null)
      loadCoaching()
    } else {
      toast.error('Failed to send reply')
    }
  }

  // 4D: Load commitments for a coaching message
  async function loadCommitments(messageId: string) {
    const { data } = await supabase
      .from('Coaching_Commitments')
      .select('id, commitment_text, status, completed_at')
      .eq('coaching_message_id', messageId)
      .order('created_at', { ascending: true })

    if (data) {
      setCommitments((prev) => ({ ...prev, [messageId]: data }))
    }
  }

  // 4D: Toggle commitment completion
  async function handleToggleCommitment(commitmentId: string, messageId: string, currentStatus: string) {
    const newStatus = currentStatus === 'open' ? 'completed' : 'open'
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null

    const { error } = await supabase
      .from('Coaching_Commitments')
      .update({ status: newStatus, completed_at: completedAt })
      .eq('id', commitmentId)

    if (!error) {
      setCommitments((prev) => ({
        ...prev,
        [messageId]: (prev[messageId] || []).map((c) =>
          c.id === commitmentId ? { ...c, status: newStatus, completed_at: completedAt } : c
        ),
      }))
    }
  }

  const isLeader = ['admin', 'manager', 'coach'].includes(userRole)

  const filtered = messages.filter((msg) => {
    if (!isLeader) return msg.status === 'sent' || msg.status === 'read' || msg.status === 'replied'
    if (activeTab === 'pending') return msg.status === 'generated' || msg.status === 'approved'
    if (activeTab === 'sent') return msg.status === 'sent' || msg.status === 'read'
    if (activeTab === 'replies') return !!msg.rep_response
    return true
  })

  const pendingCount = messages.filter((m) => m.status === 'generated' || m.status === 'approved').length
  const sentCount = messages.filter((m) => m.status === 'sent' || m.status === 'read').length
  const repliesCount = messages.filter((m) => !!m.rep_response).length
  // 4A: Count unread sent messages (for manager badge)
  const unreadCount = messages.filter((m) => m.status === 'sent' && !m.read_at).length

  const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    generated: { label: 'Pending Review', color: 'text-gold bg-gold/10 border-gold/20', icon: HiClock },
    approved: { label: 'Approved', color: 'text-teal bg-teal/10 border-teal/20', icon: HiCheck },
    sent: { label: 'Sent', color: 'text-aqua bg-aqua/10 border-aqua/20', icon: HiMail },
    read: { label: 'Read', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: HiEye },
    replied: { label: 'Replied', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: HiReply },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-light mb-1">Coaching</h1>
      <p className="text-light-muted text-sm mb-6">
        {isLeader ? 'Review, edit, and approve coaching before sending to reps.' : 'Your coaching feedback.'}
      </p>

      {/* Tabs */}
      {isLeader && (
        <div className="flex gap-1 mb-6 bg-navy-light rounded-lg p-1 w-fit">
          {([
            { key: 'pending' as TabKey, label: 'Pending', count: pendingCount },
            { key: 'sent' as TabKey, label: 'Sent', count: sentCount },
            { key: 'replies' as TabKey, label: 'Replies', count: repliesCount },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-teal/10 text-teal'
                  : 'text-light-muted hover:text-light'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-xs bg-navy rounded-full px-1.5 py-0.5">
                  {tab.count}
                </span>
              )}
              {/* 4A: Unread badge on Sent tab */}
              {tab.key === 'sent' && unreadCount > 0 && (
                <span className="ml-1 inline-block w-2 h-2 bg-aqua rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-8 text-center">
          <HiMail className="text-teal text-4xl mx-auto mb-4" />
          <h2 className="text-lg font-bold text-light mb-2">No {activeTab} messages</h2>
          <p className="text-light-muted text-sm">
            {activeTab === 'pending'
              ? 'Coaching messages will be generated after calls are analyzed.'
              : activeTab === 'replies'
              ? 'Rep replies will appear here.'
              : 'Sent coaching will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => {
            const config = statusConfig[msg.status] || statusConfig.generated
            const StatusIcon = config.icon
            const isExpanded = expandedId === msg.id
            const isEditing = editingId === msg.id
            const msgCommitments = commitments[msg.id] || []
            // 4A: Show unread dot for manager on sent messages not yet read
            const showUnreadDot = isLeader && msg.status === 'sent' && !msg.read_at

            return (
              <div key={msg.id} className="bg-navy-light rounded-2xl border border-teal/10 overflow-hidden">
                <button
                  onClick={() => handleExpand(msg.id, msg)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-navy/50 transition-colors"
                >
                  <div className="relative w-10 h-10 bg-teal/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <HiMail className="text-teal text-xl" />
                    {/* 4A: Pulsing unread dot */}
                    {showUnreadDot && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-aqua rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-light text-sm">
                      {isLeader ? `To: ${msg.rep_email}` : `From: ${msg.manager_email}`}
                    </p>
                    <p className="text-xs text-light-muted mt-0.5">
                      {new Date(msg.generated_at).toLocaleString()}
                    </p>
                  </div>
                  {msg.rep_response && (
                    <span className="text-xs bg-aqua/10 text-aqua px-2 py-0.5 rounded-full border border-aqua/20">
                      Replied
                    </span>
                  )}
                  <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${config.color}`}>
                    <StatusIcon className="text-sm" />
                    {config.label}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-navy px-4 pb-4 pt-4">
                    {/* Coaching Content */}
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={12}
                          className="w-full bg-navy border border-teal/20 rounded-lg p-3 text-sm text-light focus:outline-none focus:border-teal resize-y"
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="flex items-center gap-1 bg-teal text-navy font-bold py-2 px-4 rounded-lg text-sm hover:bg-aqua transition-colors"
                          >
                            <HiCheck /> Save Changes
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 text-light-muted hover:text-light py-2 px-4 rounded-lg text-sm transition-colors"
                          >
                            <HiX /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-navy rounded-lg p-4 text-sm text-light-muted whitespace-pre-wrap">
                        {msg.coaching_content}
                      </div>
                    )}

                    {/* 4D: Commitments Display */}
                    {msgCommitments.length > 0 && (
                      <div className="mt-4 bg-gold/5 border border-gold/20 rounded-lg p-4">
                        <p className="text-xs font-bold text-gold mb-3">Commitments</p>
                        <div className="space-y-2">
                          {msgCommitments.map((c) => (
                            <label
                              key={c.id}
                              className="flex items-start gap-3 cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={c.status === 'completed'}
                                onChange={() => handleToggleCommitment(c.id, msg.id, c.status)}
                                className="mt-0.5 w-4 h-4 rounded border-gold/30 text-teal focus:ring-teal/50 bg-navy"
                              />
                              <span className={`text-sm ${c.status === 'completed' ? 'text-light-muted line-through' : 'text-light'}`}>
                                {c.commitment_text}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rep Response */}
                    {msg.rep_response && (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-light mb-2">Rep Reply:</p>
                        <div className="bg-teal/5 border border-teal/10 rounded-lg p-3 text-sm text-light-muted">
                          {msg.rep_response}
                        </div>
                        <p className="text-xs text-light-muted mt-1">
                          {msg.responded_at && `Replied ${new Date(msg.responded_at).toLocaleString()}`}
                        </p>
                      </div>
                    )}

                    {/* 4C: In-app reply for rep (only on sent/read messages without a response) */}
                    {!isLeader && (msg.status === 'sent' || msg.status === 'read') && !msg.rep_response && (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-light mb-2">Reply to your coach:</p>
                        <textarea
                          value={replyingTo === msg.id ? replyText : ''}
                          onChange={(e) => { setReplyingTo(msg.id); setReplyText(e.target.value) }}
                          onFocus={() => setReplyingTo(msg.id)}
                          placeholder="Type your response..."
                          rows={3}
                          className="w-full bg-navy border border-teal/20 rounded-lg p-3 text-sm text-light focus:outline-none focus:border-teal resize-y"
                        />
                        <button
                          onClick={() => handleSendReply(msg.id)}
                          disabled={!replyText.trim() || replyingTo !== msg.id}
                          className="mt-2 flex items-center gap-2 bg-teal text-navy font-bold py-2 px-4 rounded-lg text-sm hover:bg-aqua transition-colors disabled:opacity-50"
                        >
                          <HiReply /> Send Reply
                        </button>
                      </div>
                    )}

                    {/* Leader Actions */}
                    {isLeader && msg.status === 'generated' && !isEditing && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => handleApproveAndSend(msg.id)}
                          className="flex items-center gap-2 bg-teal text-navy font-bold py-2 px-4 rounded-lg hover:bg-aqua transition-colors text-sm"
                        >
                          <HiCheck /> Approve & Send
                        </button>
                        <button
                          onClick={() => { setEditingId(msg.id); setEditContent(msg.coaching_content) }}
                          className="flex items-center gap-2 bg-navy text-light-muted border border-teal/20 py-2 px-4 rounded-lg hover:text-light hover:border-teal/40 transition-colors text-sm"
                        >
                          <HiPencil /> Edit First
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
