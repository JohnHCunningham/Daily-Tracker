'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { HiArrowLeft, HiPlay, HiClock, HiRefresh, HiPhone, HiMail, HiCalendar, HiClipboardList, HiExternalLink, HiLightningBolt } from 'react-icons/hi'

interface CallDetail {
  id: string
  call_date: string
  duration_minutes: number | null
  participants: string[] | null
  transcript: string | null
  ai_summary: string | null
  recording_url: string | null
  channel: string | null
  source_provider: string
  rep_email: string | null
  methodology_scores: Record<string, number> | null
  analyzed_at: string | null
  coaching_generated: boolean
}

interface HubSpotActivity {
  id: string
  activity_type: string
  activity_date: string
  source_url: string | null
  metadata: Record<string, any> | null
}

interface CurrentUser {
  account_id: string
  email: string
  role: string
}

const hubspotTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  call: HiPhone,
  email: HiMail,
  meeting: HiCalendar,
  task: HiClipboardList,
}


export default function CallDetailPage({ params }: { params: { callId: string } }) {
  const [call, setCall] = useState<CallDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSyncNow = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/sync-now', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Synced ${data.results?.calls || 0} calls. Refresh the page to see them.` })
      } else {
        setMessage({ type: 'error', text: 'Sync failed. Check integrations are connected.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Sync failed. Is the server running?' })
    } finally {
      setSyncing(false)
    }
  }
  const [hubspotActivities, setHubspotActivities] = useState<HubSpotActivity[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const loadCall = useCallback(async () => {
    const response = await fetch(`/api/calls/${params.callId}`)
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setLoading(false)
      return
    }

    setCurrentUser(data.currentUser)
    setCall(data.call)
    setHubspotActivities(data.hubspotActivities || [])
    setLoading(false)
  }, [params.callId])

  useEffect(() => {
    void loadCall()
  }, [loadCall])

  async function handleAnalyze() {
    if (!call) return
    if (!currentUser || currentUser.role === 'rep') return
    setAnalyzing(true)
    setMessage(null)

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.functions.invoke('analyze-call', {
      body: { conversation_id: call.id },
    })

    if (error) {
      setMessage({ type: 'error', text: 'Analysis failed. Please try again.' })
    } else {
      setMessage({ type: 'success', text: 'Analysis complete.' })
      void loadCall()
    }
    setAnalyzing(false)
  }

  function getScoreColor(score: number): string {
    if (score >= 7) return 'text-terracotta bg-terracotta/20 border-terracotta/30'
    if (score >= 5) return 'text-clay bg-clay/20 border-clay/30'
    return 'text-terracotta bg-pink/20 border-pink/30'
  }

  if (loading) {
    return <div className="text-stone-light">Loading call...</div>
  }

  if (!call) {
    return <div className="text-stone-light">Call not found.</div>
  }

  const scores = call.methodology_scores

  return (
    <div>
      <Link
        href="/calls"
        className="flex items-center gap-2 text-terracotta hover:text-terracotta-bright mb-6 text-sm"
      >
        <HiArrowLeft /> Back to Calls
      </Link>

      {message && (
        <div className={`rounded-lg p-3 text-sm mb-6 ${message.type === 'success' ? 'bg-green-400/10 border border-green-400/30 text-green-400' : 'bg-pink/10 border border-pink/30 text-pink'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-espresso mb-2">
              {call.participants?.join(', ') || call.rep_email || 'Call Details'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-stone-light">
              <span className="flex items-center gap-1">
                <HiClock />
                {new Date(call.call_date).toLocaleString()}
              </span>
              {call.duration_minutes && <span>{call.duration_minutes} min</span>}
              <span className="capitalize">{call.source_provider}</span>
              {call.channel && <span className="capitalize">{call.channel}</span>}
            </div>
          </div>
          {call.recording_url && (
            <a
              href={call.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-terracotta/10 text-terracotta border border-terracotta/20 px-4 py-2 rounded-lg hover:bg-terracotta/20 transition-colors text-sm font-medium"
            >
              <HiPlay /> Play Recording
            </a>
          )}
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center gap-2 bg-terracotta/10 text-terracotta border border-terracotta/20 px-4 py-2 rounded-lg hover:bg-terracotta/20 transition-all text-sm font-medium disabled:opacity-50"
          >
            <HiRefresh className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transcript + Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          {call.ai_summary && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
              <h2 className="text-xl font-bold text-espresso mb-3">AI Summary</h2>
              <p className="text-stone-light text-sm whitespace-pre-wrap">{call.ai_summary}</p>
            </div>
          )}

          {/* Transcript */}
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
            <h2 className="text-xl font-bold text-espresso mb-3">Transcript</h2>
            {call.transcript ? (
              <div className="max-h-[500px] overflow-y-auto">
                <pre className="text-stone-light text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {call.transcript}
                </pre>
              </div>
            ) : (
              <p className="text-stone-light text-sm">No transcript available.</p>
            )}
          </div>
        </div>

        {/* Right: Methodology Scores */}
        <div className="space-y-6">
          {/* Analyze Button */}
          {!call.analyzed_at && currentUser?.role !== 'rep' && (
            <div className="bg-white rounded-2xl border border-clay/30 p-6">
              <h2 className="text-lg font-bold text-espresso mb-2">Ready to Analyze</h2>
              <p className="text-sm text-stone-light mb-4">
                Run methodology analysis on this call.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                <HiRefresh className={analyzing ? 'animate-spin' : ''} />
                {analyzing ? 'Analyzing...' : 'Analyze Call'}
              </button>
            </div>
          )}

          {/* Methodology Breakdown */}
          {scores && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
              <h2 className="text-xl font-bold text-espresso mb-4">Methodology Scores</h2>
              <div className="space-y-3">
                {Object.entries(scores).map(([component, score]) => (
                  <div key={component} className="flex items-center justify-between">
                    <span className="text-sm text-stone-light">{component}</span>
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${getScoreColor(score as number)}`}>
                      {score}/10
                    </span>
                  </div>
                ))}
              </div>

              {/* Overall */}
              {(() => {
                const values = Object.values(scores) as number[]
                const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
                return (
                  <div className="mt-4 pt-4 border-t border-bone flex items-center justify-between">
                    <span className="font-bold text-espresso">Overall</span>
                    <span className={`text-lg font-bold px-3 py-1 rounded-lg border ${getScoreColor(avg)}`}>
                      {avg}/10
                    </span>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Coaching Status */}
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
            <h2 className="text-lg font-bold text-espresso mb-2">Coaching</h2>
            {call.coaching_generated ? (
              <div className="flex items-center gap-2 text-terracotta text-sm">
                <span className="w-2 h-2 bg-terracotta rounded-full" />
                Coaching generated
              </div>
            ) : call.analyzed_at ? (
              <div className="space-y-3">
                <p className="text-sm text-stone-light">
                  Analysis complete. Generate coaching from the coaching page.
                </p>
                <Link
                  href="/coaching"
                  className="inline-flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-terracotta-bright transition-colors"
                >
                  <HiLightningBolt /> Open Coaching
                </Link>
              </div>
            ) : (
              <p className="text-sm text-stone-light">
                Analyze this call first to generate coaching.
              </p>
            )}
          </div>

          {/* CRM Activity (HubSpot) */}
          {hubspotActivities.length > 0 && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
              <h2 className="text-lg font-bold text-espresso mb-4">CRM Activity</h2>
              <div className="space-y-3">
                {hubspotActivities.map((activity) => {
                  const IconComponent = hubspotTypeIcons[activity.activity_type] || HiClipboardList
                  const title = activity.metadata?.title || activity.metadata?.subject || activity.activity_type
                  const duration = activity.metadata?.duration_minutes

                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bone/50">
                      <div className="w-8 h-8 bg-clay/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="text-clay text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-espresso font-medium truncate capitalize">{title}</p>
                        <div className="flex items-center gap-2 text-xs text-stone-light mt-0.5">
                          <span className="capitalize">{activity.activity_type}</span>
                          {duration && <span>{duration} min</span>}
                        </div>
                      </div>
                      {activity.source_url && (
                        <a
                          href={activity.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-terracotta hover:text-terracotta-bright flex-shrink-0"
                        >
                          <HiExternalLink className="text-sm" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
