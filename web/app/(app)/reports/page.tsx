'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  HiDocumentReport,
  HiRefresh,
  HiPrinter,
  HiTrendingUp,
  HiTrendingDown,
  HiMinus,
  HiExclamationCircle,
  HiCheckCircle,
  HiLightBulb,
  HiSparkles,
  HiClipboardCopy,
} from 'react-icons/hi'

const COMPONENT_LABELS: Record<string, string> = {
  bondingRapport: 'Bonding & Rapport',
  upfrontContract: 'Upfront Contract',
  painFunnel: 'Pain Funnel',
  budget: 'Budget',
  decisionProcess: 'Decision Process',
  fulfillment: 'Fulfillment',
  postSell: 'Post-Sell',
  negativeReverseSelling: 'Negative Reverse Selling',
}

const REPORT_PERIODS = {
  weekly: { label: 'Weekly report', days: 7, compare: 'previous 7 days' },
  monthly: { label: 'Monthly report', days: 30, compare: 'previous 30 days' },
} as const

interface RepRow {
  email: string
  name: string
  overallAvg: number
  callCount: number
  trend: 'improving' | 'declining' | 'stable'
  components: Record<string, number>
  weakest: string | null
}

interface ReportData {
  summary: {
    teamOverall: number
    totalCalls: number
    repCount: number
    period: number
    periodLabel: string
    comparisonLabel: string
    previousTeamOverall: number
    teamDelta: number
    previousTotalCalls: number
    callDelta: number
    replyRate: number
    bestImprovement: { component: string; delta: number } | null
    biggestDrop: { component: string; delta: number } | null
    weakComponents: [string, number][]
    strongComponents: [string, number][]
  } | null
  componentAverages: Record<string, number>
  repMatrix: RepRow[]
  trends: { firstHalf: Record<string, number>; secondHalf: Record<string, number> }
  coachingStats: { sent: number; replied: number; byRep: Record<string, { sent: number; replied: number }> }
  narrative: string
  managerPunchList: string[]
  shareSummary: string
  previousSummary: { teamOverall: number; totalCalls: number }
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100)
  const color = score >= 7 ? 'bg-teal' : score >= 5 ? 'bg-gold' : 'bg-pink'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-bone rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold w-6 text-right ${score >= 7 ? 'text-teal' : score >= 5 ? 'text-gold' : 'text-pink'}`}>
        {score}
      </span>
    </div>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <HiTrendingUp className="text-terracotta text-lg" />
  if (trend === 'declining') return <HiTrendingDown className="text-terracotta text-lg" />
  return <HiMinus className="text-stone-light text-lg" />
}

function TrendBadge({ value, prev }: { value: number; prev?: number }) {
  if (!prev) return null
  const delta = value - prev
  if (Math.abs(delta) < 0.2) return null
  const up = delta > 0
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${up ? 'bg-terracotta/10 text-teal' : 'bg-pink/10 text-pink'}`}>
      {up ? '+' : ''}{delta.toFixed(1)}
    </span>
  )
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState<keyof typeof REPORT_PERIODS>('weekly')
  const [userRole, setUserRole] = useState('')
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const supabase = createClient()

  const checkRole = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('Users').select('role').eq('auth_id', user.id).single()
    if (data) setUserRole(data.role)
  }, [supabase])

  useEffect(() => {
    void checkRole()
  }, [checkRole])

  async function generateReport() {
    setGenerating(true)
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { period: REPORT_PERIODS[period].days },
      })
      if (error) throw error
      setReport(data)
    } catch (err) {
      console.error('Report error:', err)
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  async function copySummary() {
    if (!report?.shareSummary) return
    await navigator.clipboard.writeText(report.shareSummary)
    setCopyStatus('Summary copied')
    window.setTimeout(() => setCopyStatus(null), 2000)
  }

  function printReport() {
    window.print()
  }

  const isLeader = ['admin', 'manager', 'coach'].includes(userRole)

  if (!isLeader) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-stone-light">Reports are available to managers and coaches only.</p>
      </div>
    )
  }

  return (
    <div className="print:bg-white print:text-black">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 print:mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <HiDocumentReport className="text-terracotta text-2xl print:hidden" />
            <h1 className="text-2xl font-bold text-espresso print:text-black">Manager Report</h1>
          </div>
          <p className="text-stone-light text-sm print:text-gray-600">
            {report?.summary?.periodLabel || 'Weekly / monthly'} performance analysis · compares against {report?.summary?.comparisonLabel || 'the previous period'} · Generated {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <div className="inline-flex rounded-lg border border-terracotta/20 bg-white p-1">
            {(Object.keys(REPORT_PERIODS) as Array<keyof typeof REPORT_PERIODS>).map((key) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  period === key ? 'bg-terracotta text-white' : 'text-espresso hover:bg-terracotta/10'
                }`}
              >
                {REPORT_PERIODS[key].label}
              </button>
            ))}
          </div>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-terracotta-bright transition-colors disabled:opacity-50"
          >
            <HiRefresh className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating...' : report ? 'Regenerate' : 'Generate Report'}
          </button>
          {report && (
            <>
              <button
                onClick={copySummary}
                className="flex items-center gap-2 bg-white text-espresso border border-terracotta/20 px-4 py-2 rounded-lg text-sm hover:bg-terracotta/10 transition-colors"
              >
                <HiClipboardCopy />
                Copy Summary
              </button>
              <button
                onClick={printReport}
                className="flex items-center gap-2 bg-white text-espresso border border-terracotta/20 px-4 py-2 rounded-lg text-sm hover:bg-terracotta/10 transition-colors"
              >
                <HiPrinter />
                Print / PDF
              </button>
            </>
          )}
        </div>
      </div>

      {copyStatus && (
        <div className="mb-4 inline-flex items-center rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal print:hidden">
          {copyStatus}
        </div>
      )}

      {/* Empty state */}
      {!report && !loading && (
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-16 text-center">
          <HiDocumentReport className="text-terracotta text-5xl mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold text-espresso mb-2">Ready to Generate Your Report</h2>
          <p className="text-stone-light text-sm max-w-md mx-auto mb-6">
            Select a time period and click Generate. The report analyses your team's Sandler methodology trends, identifies systemic weaknesses, and produces AI-powered coaching recommendations.
          </p>
          <button
            onClick={generateReport}
            className="bg-terracotta text-white px-6 py-3 rounded-lg font-bold hover:bg-terracotta-bright transition-colors"
          >
            Generate Report
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-10 h-10 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-light text-sm">Analysing team performance and generating insights...</p>
        </div>
      )}

      {/* Report content */}
      {report && !loading && (
        <div className="space-y-6">

          {/* ── Section 1: Executive Summary ── */}
          {report.summary && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 print:border print:border-gray-200 print:rounded-lg">
              <h2 className="text-lg font-bold text-espresso mb-4 print:text-black">Executive Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-bone/50 rounded-xl p-4 text-center print:bg-gray-50">
                  <div className={`text-3xl font-bold mb-1 ${report.summary.teamOverall >= 7 ? 'text-teal' : report.summary.teamOverall >= 5 ? 'text-gold' : 'text-pink'}`}>
                    {report.summary.teamOverall}
                    <span className="text-lg font-normal text-stone-light">/10</span>
                  </div>
                  <p className="text-xs text-stone-light">Team Sandler Score</p>
                </div>
                <div className="bg-bone/50 rounded-xl p-4 text-center print:bg-gray-50">
                  <div className="text-3xl font-bold text-espresso mb-1">{report.summary.totalCalls}</div>
                  <p className="text-xs text-stone-light">Calls Analysed</p>
                </div>
                <div className="bg-bone/50 rounded-xl p-4 text-center print:bg-gray-50">
                  <div className="text-3xl font-bold text-espresso mb-1">{report.summary.repCount}</div>
                  <p className="text-xs text-stone-light">Active Reps</p>
                </div>
                <div className="bg-bone/50 rounded-xl p-4 text-center print:bg-gray-50">
                  <div className="text-3xl font-bold text-espresso mb-1">{report.coachingStats.sent}</div>
                  <p className="text-xs text-stone-light">Coaching Sent</p>
                </div>
              </div>

              {/* Strengths / Weaknesses callout */}
              {(report.summary.strongComponents.length > 0 || report.summary.weakComponents.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {report.summary.strongComponents.length > 0 && (
                    <div className="bg-teal/5 border border-terracotta/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HiCheckCircle className="text-terracotta" />
                        <span className="text-sm font-bold text-terracotta">Team Strengths</span>
                      </div>
                      {report.summary.strongComponents.map(([comp, score]) => (
                        <p key={comp} className="text-sm text-stone-light">
                          {COMPONENT_LABELS[comp] || comp} — <span className="text-terracotta font-medium">{score}/10</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {report.summary.weakComponents.length > 0 && (
                    <div className="bg-pink/5 border border-pink/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HiExclamationCircle className="text-terracotta" />
                        <span className="text-sm font-bold text-terracotta">Needs Attention</span>
                      </div>
                      {report.summary.weakComponents.map(([comp, score]) => (
                        <p key={comp} className="text-sm text-stone-light">
                          {COMPONENT_LABELS[comp] || comp} — <span className="text-terracotta font-medium">{score}/10</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(report.summary.bestImprovement || report.summary.biggestDrop) && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {report.summary.bestImprovement && (
                    <div className="rounded-xl border border-teal/20 bg-teal/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HiTrendingUp className="text-teal" />
                        <span className="text-sm font-bold text-teal">Biggest Improvement</span>
                      </div>
                      <p className="text-sm text-stone-light">
                        {COMPONENT_LABELS[report.summary.bestImprovement.component] || report.summary.bestImprovement.component} is up{' '}
                        <span className="font-medium text-teal">+{report.summary.bestImprovement.delta}</span> vs the previous period.
                      </p>
                    </div>
                  )}
                  {report.summary.biggestDrop && (
                    <div className="rounded-xl border border-pink/20 bg-pink/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HiTrendingDown className="text-pink" />
                        <span className="text-sm font-bold text-pink">Biggest Drop</span>
                      </div>
                      <p className="text-sm text-stone-light">
                        {COMPONENT_LABELS[report.summary.biggestDrop.component] || report.summary.biggestDrop.component} is down{' '}
                        <span className="font-medium text-pink">{report.summary.biggestDrop.delta}</span> vs the previous period.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Section 1b: Manager Punch List ── */}
          {report.managerPunchList.length > 0 && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 print:border print:border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <HiCheckCircle className="text-terracotta" />
                <h2 className="text-lg font-bold text-espresso print:text-black">Manager Punch List</h2>
              </div>
              <ol className="space-y-3 list-decimal list-inside">
                {report.managerPunchList.map((item) => (
                  <li key={item} className="text-sm text-stone-light leading-6">
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Section 1c: Share Summary ── */}
          {report.shareSummary && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 print:border print:border-gray-200">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <HiClipboardCopy className="text-terracotta" />
                  <h2 className="text-lg font-bold text-espresso print:text-black">Shareable Summary</h2>
                </div>
                <button
                  onClick={copySummary}
                  className="text-xs font-medium text-terracotta hover:text-terracotta-bright print:hidden"
                >
                  Copy to clipboard
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-stone-light leading-6 font-sans bg-bone/30 rounded-xl p-4 overflow-x-auto">
                {report.shareSummary}
              </pre>
            </div>
          )}

          {/* ── Section 2: Methodology Component Scores ── */}
          {Object.keys(report.componentAverages).length > 0 && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 print:border print:border-gray-200">
              <h2 className="text-lg font-bold text-espresso mb-1 print:text-black">Sandler Methodology Scores</h2>
              <p className="text-xs text-stone-light mb-4">Team averages across all analysed calls this period</p>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(COMPONENT_LABELS).map(([key, label]) => {
                  const score = report.componentAverages[key]
                  if (score === undefined) return null
                  const prev = report.trends.firstHalf[key]
                  const curr = report.trends.secondHalf[key]
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-stone-light">{label}</span>
                        <div className="flex items-center gap-2">
                          <TrendBadge value={curr} prev={prev} />
                        </div>
                      </div>
                      <ScoreBar score={score} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Section 3: Rep Performance Matrix ── */}
          {report.repMatrix.length > 0 && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 print:border print:border-gray-200">
              <h2 className="text-lg font-bold text-espresso mb-1 print:text-black">Rep Performance Matrix</h2>
              <p className="text-xs text-stone-light mb-4">Individual scores, trends, and areas for development</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-stone-light uppercase tracking-wider border-b border-bone">
                      <th className="pb-3 pr-4">Rep</th>
                      <th className="pb-3 pr-4 text-center">Overall</th>
                      <th className="pb-3 pr-4 text-center">Calls</th>
                      <th className="pb-3 pr-4 text-center">Trend</th>
                      <th className="pb-3 pr-4">Weakest Area</th>
                      <th className="pb-3 text-center">Coaching</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.repMatrix.map((rep) => {
                      const coachStats = report.coachingStats.byRep[rep.email]
                      return (
                        <tr key={rep.email} className="border-b border-bone-dark last:border-0">
                          <td className="py-3 pr-4">
                            <p className="text-sm font-medium text-espresso">{rep.name}</p>
                            <p className="text-xs text-stone-light truncate max-w-32">{rep.email}</p>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                              rep.overallAvg >= 7 ? 'text-terracotta bg-terracotta/10' :
                              rep.overallAvg >= 5 ? 'text-clay bg-clay/10' :
                              'text-terracotta bg-pink/10'
                            }`}>
                              {rep.overallAvg}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-center text-sm text-stone-light">{rep.callCount}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center justify-center gap-1">
                              <TrendIcon trend={rep.trend} />
                              <span className={`text-xs ${rep.trend === 'improving' ? 'text-teal' : rep.trend === 'declining' ? 'text-pink' : 'text-stone-light'}`}>
                                {rep.trend}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            {rep.weakest && (
                              <span className="text-xs text-terracotta bg-pink/10 px-2 py-1 rounded-full">
                                {COMPONENT_LABELS[rep.weakest] || rep.weakest}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-center text-xs text-stone-light">
                            {coachStats ? `${coachStats.sent} sent` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Section 4: Coaching Effectiveness ── */}
          {report.coachingStats.sent > 0 && (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 print:border print:border-gray-200">
              <h2 className="text-lg font-bold text-espresso mb-1 print:text-black">Coaching Effectiveness</h2>
              <p className="text-xs text-stone-light mb-4">Engagement with coaching messages this period</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-bone/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-espresso mb-1">{report.coachingStats.sent}</div>
                  <p className="text-xs text-stone-light">Coaching Sent</p>
                </div>
                <div className="bg-bone/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-terracotta mb-1">{report.coachingStats.replied}</div>
                  <p className="text-xs text-stone-light">Reps Replied</p>
                </div>
                <div className="bg-bone/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-clay mb-1">
                    {report.coachingStats.sent > 0
                      ? Math.round((report.coachingStats.replied / report.coachingStats.sent) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-stone-light">Reply Rate</p>
                </div>
              </div>
              {Object.keys(report.coachingStats.byRep).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(report.coachingStats.byRep).map(([email, stats]) => {
                    const rep = report.repMatrix.find(r => r.email === email)
                    return (
                      <div key={email} className="flex items-center justify-between py-2 border-b border-bone-dark last:border-0">
                        <span className="text-sm text-espresso">{rep?.name || email}</span>
                        <div className="flex items-center gap-4 text-xs text-stone-light">
                          <span>{stats.sent} messages sent</span>
                          {stats.replied > 0 && (
                            <span className="text-terracotta">{stats.replied} replied</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Section 5: AI Narrative ── */}
          {report.narrative && (
            <div className="bg-gradient-to-br from-navy-light to-navy border border-terracotta/20 rounded-2xl p-6 print:border print:border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <HiSparkles className="text-clay text-xl print:hidden" />
                <h2 className="text-lg font-bold text-espresso print:text-black">AI Coaching Analysis & Recommendations</h2>
              </div>
              <p className="text-xs text-stone-light mb-4">
                {report.summary?.periodLabel || 'Weekly report'} · compares against {report.summary?.comparisonLabel || 'the previous period'}
              </p>
              <div className="prose prose-sm max-w-none">
                {report.narrative.split('\n').map((line, i) => {
                  if (!line.trim()) return <div key={i} className="h-2" />
                  const isHeader = /^\d+\.|^#+|^[A-Z][A-Z\s&]+:/.test(line.trim())
                  const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•')
                  if (isHeader) {
                    return (
                      <h3 key={i} className="text-terracotta font-bold text-sm mt-4 mb-2 uppercase tracking-wide print:text-blue-700">
                        {line.replace(/^\d+\.\s*/, '').replace(/^#+\s*/, '').replace(/:$/, '')}
                      </h3>
                    )
                  }
                  if (isBullet) {
                    return (
                      <div key={i} className="flex gap-2 mb-1">
                        <span className="text-terracotta mt-1 flex-shrink-0">▸</span>
                        <p className="text-stone-light text-sm print:text-gray-700">
                          {line.replace(/^[-•]\s*/, '')}
                        </p>
                      </div>
                    )
                  }
                  return <p key={i} className="text-stone-light text-sm mb-2 print:text-gray-700">{line}</p>
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-bone-dark flex items-center gap-2">
                <HiLightBulb className="text-clay text-sm" />
                <p className="text-xs text-stone-light">Generated by AI based on {report.summary?.totalCalls} calls over the last {report.summary?.period} days</p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          aside, nav { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  )
}
