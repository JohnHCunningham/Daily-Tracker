'use client'

import { useState } from 'react'
import { HiAcademicCap, HiChevronDown, HiChevronUp, HiCheckCircle } from 'react-icons/hi'

interface CoachingMessage {
  id: string
  subject: string | null
  coaching_content: string | null
  sent_at: string
  status: string
}

interface CoachingFeedProps {
  messages: CoachingMessage[]
}

export default function CoachingFeed({ messages }: CoachingFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isExpanded = expandedId === msg.id
        return (
          <div key={msg.id} className="bg-navy/50 rounded-xl border border-teal/5">
            <button
              onClick={() => setExpandedId(isExpanded ? null : msg.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-navy/80 rounded-xl transition-colors"
            >
              {msg.status === 'sent' ? (
                <HiCheckCircle className="text-teal text-lg flex-shrink-0" />
              ) : (
                <HiAcademicCap className="text-gold text-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-light truncate">
                  {msg.subject || 'Coaching Message'}
                </p>
                <p className="text-xs text-light-muted">
                  {new Date(msg.sent_at).toLocaleDateString()}
                </p>
              </div>
              {isExpanded ? (
                <HiChevronUp className="text-light-muted flex-shrink-0" />
              ) : (
                <HiChevronDown className="text-light-muted flex-shrink-0" />
              )}
            </button>
            {isExpanded && msg.coaching_content && (
              <div className="px-3 pb-3">
                <div className="bg-navy rounded-lg p-3 text-sm text-light-muted leading-relaxed whitespace-pre-wrap">
                  {msg.coaching_content}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
