'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiArrowLeft, HiPlay, HiClock, HiRefresh, HiPhone, HiMail, HiCalendar, HiClipboardList, HiExternalLink } from 'react-icons/hi'

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

const hubspotTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  call: HiPhone,
  email: HiMail,
  meeting: HiCalendar,
  task: HiClipboardList,
}

const sandlerComponents = [
  'Bonding & Rapport',
  'Up-Front Contract',
  'Pain',
  'Budget',
  'Decision',
  'Fulfillment',
  'Post-Sell',
  'Overall',
]

export default function CallDetailPage({ params }: { params: { callId: string } }) {
  const [call, setCall] = useState<CallDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hubspotActivities, setHubspotActivities] = useState<HubSpotActivity[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadCall()
  }, [params.callId])

  async function loadCall() {
    const { data } = await supabase
      .from('Synced_Conversations')
      .select('*')
      .eq('id', params.callId)
      .single()

    if (data) {
      setCall(data)
      if (data.rep_email && data.call_date) {
        loadHubspotActivities(data.rep_email, data.call_date)
      }
    }
    setLoading(false)
  }

  async function loadHubspotActivities(repEmail: string, callDate: string) {
    const dateStr = new Date(callDate).toISOString().split('T')[0]
    const { data } = await supabase
      .from('Synced_Activities')
      .select('id, activity_type, activity_date, source_url, metadata')
      .eq('rep_email', repEmail)
      .eq('source_provider', 'hubspot')
      .gte('activity_date', `${dateStr}T00:00:00`)
      .lt('activity_date', `${dateStr}T23:59:59`)

    if (data) setHubspotActivities(data)
  }

  async function handleAnalyze() {
    if (!call) return
    setAnalyzing(true)
    setMessage(null)

    const { error } = await supabase.functions.invoke('analyze-call', {
      body: { conversation_id: call.id },
    })

    if (error) {
      setMessage({ type: 'error', text: 'Analysis failed. Please try again.' })
    } else {
      setMessage({ type: 'success', text: 'Analysis complete.' })
      loadCall()
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

        {/* Right: Sandler Scores */}
        <div className="space-y-6">
          {/* Analyze Button */}
          {!call.analyzed_at && (
            <div className="bg-white rounded-2xl border border-clay/30 p-6">
              <h2 className="text-lg font-bold text-espresso mb-2">Ready to Analyze</h2>
              <p className="text-sm text-stone-light mb-4">
                Run Sandler methodology analysis on this call.
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

          {/* Sandler Breakdown */}
          {scores && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
              <h2 className="text-xl font-bold text-espresso mb-4">Sandler Scores</h2>
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
              <p className="text-sm text-stone-light">
                Analysis complete. Coaching can be generated from the coaching page.
              </p>
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
