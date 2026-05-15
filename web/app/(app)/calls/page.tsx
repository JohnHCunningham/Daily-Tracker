'use client'

import { useCallback, useEffect, useState } from 'react'
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

  const loadCalls = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id, role, email')
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
      query = query.eq('rep_email', userData.email)
    }

    const { data } = await query

    if (data) setCalls(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadCalls()
  }, [loadCalls])

  function getOverallScore(scores: Record<string, number> | null): number | null {
    if (!scores) return null
    const values = Object.values(scores)
    if (values.length === 0) return null
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  if (loading) {
    return <div className="text-stone-light">Loading calls...</div>
  }

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-terracotta/10">
        <h1 className="text-3xl font-bold text-espresso mb-2">Calls</h1>
        <p className="text-stone-light">
          {calls.length} synced conversations
        </p>
      </div>

      {calls.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-bone-light/30 rounded-2xl border-t-4 border-t-terracotta border-l border-r border-b border-bone-dark/50 shadow-sm p-8 text-center">
          <HiPhone className="text-terracotta text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-espresso mb-2">No calls yet</h2>
          <p className="text-stone-light text-sm mb-4">
            Connect an integration to start syncing your sales calls.
          </p>
          <Link
            href="/integrations"
            className="inline-block bg-terracotta text-white font-bold py-2.5 px-6 rounded-lg hover:bg-terracotta-bright transition-colors"
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
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-bone-light/20 rounded-xl border-l-4 border-l-terracotta/30 border-t border-r border-b border-bone-dark/50 hover:border-terracotta/50 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-terracotta/20 to-terracotta/10 rounded-lg flex items-center justify-center">
                  <HiPhone className="text-terracotta text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-espresso truncate">
                      {call.participants?.join(', ') || call.rep_email || 'Unknown'}
                    </p>
                    <span className="text-xs text-stone-light bg-bone px-2 py-0.5 rounded-full shrink-0">
                      {call.source_provider}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-light mt-1">
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
                    <p className="text-xs text-stone-light mt-1 truncate">{call.ai_summary}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {score !== null ? (
                    <div className={`text-2xl font-bold ${score >= 7 ? 'text-teal' : score >= 5 ? 'text-gold' : 'text-pink'}`}>
                      {score}
                    </div>
                  ) : call.analyzed_at ? (
                    <span className="text-xs text-stone-light">Analyzed</span>
                  ) : (
                    <span className="text-xs text-clay bg-clay/10 px-2 py-1 rounded-full">Pending</span>
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
