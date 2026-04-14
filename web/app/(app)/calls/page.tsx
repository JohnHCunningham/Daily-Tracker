'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiPhone, HiPlay, HiClock, HiUser } from 'react-icons/hi'

interface Call {
  id: string
  call_date: string
  duration_minutes: number | null
  participants: string[] | null
  channel: string | null
  source_provider: string
  ai_summary: string | null
  methodology_scores: Record<string, number> | null
  analyzed_at: string | null
  rep_email: string | null
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadCalls()
  }, [])

  async function loadCalls() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      setLoading(false)
      return
    }

    let query = supabase
      .from('Synced_Conversations')
      .select('id, call_date, duration_minutes, participants, channel, source_provider, ai_summary, methodology_scores, analyzed_at, rep_email')
      .eq('account_id', userData.account_id)
      .order('call_date', { ascending: false })
      .limit(50)

    // Reps only see their own calls
    if (userData.role === 'rep') {
      query = query.eq('rep_email', user.email)
    }

    const { data } = await query

    if (data) setCalls(data)
    setLoading(false)
  }

  function getOverallScore(scores: Record<string, number> | null): number | null {
    if (!scores) return null
    const values = Object.values(scores)
    if (values.length === 0) return null
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  if (loading) {
    return <div className="text-light-muted">Loading calls...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-light mb-2">Calls</h1>
      <p className="text-light-muted mb-8">
        {calls.length} synced conversations
      </p>

      {calls.length === 0 ? (
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-8 text-center">
          <HiPhone className="text-teal text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-light mb-2">No calls yet</h2>
          <p className="text-light-muted text-sm mb-4">
            Connect an integration to start syncing your sales calls.
          </p>
          <Link
            href="/integrations"
            className="inline-block bg-teal text-navy font-bold py-2.5 px-6 rounded-lg hover:bg-aqua transition-colors"
          >
            Set Up Integrations
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => {
            const score = getOverallScore(call.methodology_scores)
            return (
              <Link
                key={call.id}
                href={`/calls/${call.id}`}
                className="flex items-center gap-4 p-4 bg-navy-light rounded-xl border border-teal/10 hover:border-teal/30 transition-colors"
              >
                <div className="w-12 h-12 bg-teal/20 rounded-lg flex items-center justify-center">
                  <HiPhone className="text-teal text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-light truncate">
                      {call.participants?.join(', ') || call.rep_email || 'Unknown'}
                    </p>
                    <span className="text-xs text-light-muted bg-navy px-2 py-0.5 rounded-full shrink-0">
                      {call.source_provider}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-light-muted mt-1">
                    <span className="flex items-center gap-1">
                      <HiClock />
                      {new Date(call.call_date).toLocaleDateString()}
                    </span>
                    {call.duration_minutes && (
                      <span>{call.duration_minutes}min</span>
                    )}
                    {call.channel && (
                      <span className="capitalize">{call.channel}</span>
                    )}
                  </div>
                  {call.ai_summary && (
                    <p className="text-xs text-light-muted mt-1 truncate">{call.ai_summary}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {score !== null ? (
                    <div className={`text-2xl font-bold ${score >= 7 ? 'text-teal' : score >= 5 ? 'text-gold' : 'text-pink'}`}>
                      {score}
                    </div>
                  ) : call.analyzed_at ? (
                    <span className="text-xs text-light-muted">Analyzed</span>
                  ) : (
                    <span className="text-xs text-gold bg-gold/10 px-2 py-1 rounded-full">Pending</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
