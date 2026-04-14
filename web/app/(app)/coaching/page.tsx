'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HiMail, HiCheck, HiClock, HiEye, HiPencil, HiX } from 'react-icons/hi'
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

type TabKey = 'pending' | 'sent' | 'replies'

export default function CoachingPage() {
  const [messages, setMessages] = useState<CoachingMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
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
      .update({ coaching_content: editContent })
      .eq('id', messageId)

    if (!error) {
      toast.success('Coaching updated')
      setEditingId(null)
      loadCoaching()
    }
  }

  const isLeader = ['admin', 'manager', 'coach'].includes(userRole)

  const filtered = messages.filter((msg) => {
    if (activeTab === 'pending') return msg.status === 'generated' || msg.status === 'approved'
    if (activeTab === 'sent') return msg.status === 'sent' || msg.status === 'read'
    if (activeTab === 'replies') return !!msg.rep_response
    return true
  })

  const pendingCount = messages.filter((m) => m.status === 'generated' || m.status === 'approved').length
  const sentCount = messages.filter((m) => m.status === 'sent' || m.status === 'read').length
  const repliesCount = messages.filter((m) => !!m.rep_response).length

  const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    generated: { label: 'Pending Review', color: 'text-gold bg-gold/10 border-gold/20', icon: HiClock },
    approved: { label: 'Approved', color: 'text-teal bg-teal/10 border-teal/20', icon: HiCheck },
    sent: { label: 'Sent', color: 'text-aqua bg-aqua/10 border-aqua/20', icon: HiMail },
    read: { label: 'Read', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: HiEye },
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

            return (
              <div key={msg.id} className="bg-navy-light rounded-2xl border border-teal/10 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-navy/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-teal/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <HiMail className="text-teal text-xl" />
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
