'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiUserGroup, HiPhone, HiAcademicCap, HiRefresh, HiExclamationCircle, HiCheckCircle } from 'react-icons/hi'
import dynamic from 'next/dynamic'
import SandlerBreakdown from '../components/SandlerBreakdown'

const ScoreRadial = dynamic(() => import('../components/ScoreRadial'), { ssr: false })
const ScoreTrendChart = dynamic(() => import('../components/ScoreTrendChart'), { ssr: false })

interface UserInfo {
  role: string
  full_name: string
  email: string
  account_id: string
}

interface TeamMemberRow {
  full_name: string
  email: string
  role: string
  avgScore: number
  callCount: number
  trend: 'up' | 'down' | 'flat'
}

interface CoachingPreview {
  id: string
  rep_email: string
  status: string
  created_at: string
  subject: string | null
}

interface NeedsAttention {
  repName: string
  component: string
  score: number
}

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Leader state
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([])
  const [teamAvgScore, setTeamAvgScore] = useState<number | null>(null)
  const [totalCalls, setTotalCalls] = useState(0)
  const [quotaAttainment, setQuotaAttainment] = useState<number | null>(null)
  const [discoveryCallsPct, setDiscoveryCallsPct] = useState<number | null>(null)
  const [approachesPct, setApproachesPct] = useState<number | null>(null)
  const [recentCoaching, setRecentCoaching] = useState<CoachingPreview[]>([])
  const [needsAttention, setNeedsAttention] = useState<NeedsAttention[]>([])
  const [trendLabels, setTrendLabels] = useState<string[]>([])
  const [trendScores, setTrendScores] = useState<number[]>([])

  // Rep state
  const [repScores, setRepScores] = useState<Record<string, number> | null>(null)
  const [repOverallScore, setRepOverallScore] = useState<number | null>(null)
  const [repCallCount, setRepCallCount] = useState(0)
  const [repBenchmarks, setRepBenchmarks] = useState<{ approaches: number; approachesTarget: number; discovery: number; discoveryTarget: number; conversions: number; conversionsTarget: number } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('role, full_name, email, account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) { setLoading(false); return }
    setUserInfo(userData)

    if (['admin', 'manager', 'coach'].includes(userData.role)) {
      await loadLeaderDashboard(userData.account_id)
    } else {
      await loadRepDashboard(userData.account_id, userData.email, user.id)
    }
    setLoading(false)
  }

  async function loadLeaderDashboard(accountId: string) {
    // Calls with scores
    const { data: recentCalls } = await supabase
      .from('Synced_Conversations')
      .select('call_date, methodology_scores, rep_email')
      .eq('account_id', accountId)
      .not('methodology_scores', 'is', null)
      .order('call_date', { ascending: true })
      .limit(50)

    // Team members
    const { data: members } = await supabase
      .from('Users')
      .select('full_name, email, role')
      .eq('account_id', accountId)

    // Recent coaching
    const { data: coaching } = await supabase
      .from('Coaching_Messages')
      .select('id, rep_email, status, created_at, subject')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (coaching) setRecentCoaching(coaching)

    // Benchmarks for quota
    const { data: benchmarks } = await supabase
      .from('Benchmarks')
      .select('*')
      .eq('account_id', accountId)
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (benchmarks && benchmarks.length > 0) {
      const b = benchmarks[0]
      if (b.conversions_target > 0) {
        setQuotaAttainment(Math.round((b.conversions_actual / b.conversions_target) * 100))
      }
      if (b.discovery_calls_target > 0) {
        setDiscoveryCallsPct(Math.round((b.discovery_calls_actual / b.discovery_calls_target) * 100))
      }
      if (b.approaches_target > 0) {
        setApproachesPct(Math.round((b.approaches_actual / b.approaches_target) * 100))
      }
    }

    if (recentCalls && recentCalls.length > 0) {
      setTotalCalls(recentCalls.length)

      // Build rep aggregates
      const repAgg: Record<string, { sum: number; count: number; recent: number; older: number }> = {}
      const attention: NeedsAttention[] = []

      recentCalls.forEach((call) => {
        if (!call.methodology_scores) return
        const vals = Object.values(call.methodology_scores) as number[]
        if (vals.length === 0) return
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length
        const rep = call.rep_email || 'unknown'

        if (!repAgg[rep]) repAgg[rep] = { sum: 0, count: 0, recent: 0, older: 0 }
        repAgg[rep].sum += avg
        repAgg[rep].count += 1

        // Weak components for "needs attention"
        Object.entries(call.methodology_scores).forEach(([comp, score]) => {
          if ((score as number) < 4) {
            const exists = attention.find((a) => a.repName === rep && a.component === comp)
            if (!exists) {
              attention.push({ repName: rep, component: comp, score: score as number })
            }
          }
        })
      })

      // Team avg
      const allAvgs = Object.values(repAgg).map((r) => r.sum / r.count)
      if (allAvgs.length > 0) {
        setTeamAvgScore(Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length * 10) / 10)
      }

      // Team members with scores
      if (members) {
        const memberRows: TeamMemberRow[] = members.map((m) => {
          const agg = repAgg[m.email]
          return {
            full_name: m.full_name || m.email,
            email: m.email,
            role: m.role,
            avgScore: agg ? Math.round(agg.sum / agg.count * 10) / 10 : 0,
            callCount: agg ? agg.count : 0,
            trend: 'flat' as const,
          }
        }).sort((a, b) => b.avgScore - a.avgScore)
        setTeamMembers(memberRows)
      }

      // Needs attention (top 4 worst)
      setNeedsAttention(attention.sort((a, b) => a.score - b.score).slice(0, 4))

      // Trend data
      const weeklyScores: Record<string, number[]> = {}
      recentCalls.forEach((call) => {
        if (!call.methodology_scores) return
        const vals = Object.values(call.methodology_scores) as number[]
        if (vals.length === 0) return
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length
        const date = new Date(call.call_date)
        const weekKey = `${date.getMonth() + 1}/${date.getDate()}`
        if (!weeklyScores[weekKey]) weeklyScores[weekKey] = []
        weeklyScores[weekKey].push(avg)
      })
      setTrendLabels(Object.keys(weeklyScores))
      setTrendScores(Object.keys(weeklyScores).map((k) => {
        const arr = weeklyScores[k]
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10
      }))
    }
  }

  async function loadRepDashboard(accountId: string, email: string, userId: string) {
    const { data: scores } = await supabase
      .from('Synced_Conversations')
      .select('call_date, methodology_scores, rep_email')
      .eq('account_id', accountId)
      .eq('rep_email', email)
      .not('methodology_scores', 'is', null)
      .order('call_date', { ascending: true })
      .limit(20)

    // Benchmarks for this rep
    const { data: benchmarks } = await supabase
      .from('Benchmarks')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (benchmarks && benchmarks.length > 0) {
      const b = benchmarks[0]
      setRepBenchmarks({
        approaches: b.approaches_actual || 0,
        approachesTarget: b.approaches_target || 0,
        discovery: b.discovery_calls_actual || 0,
        discoveryTarget: b.discovery_calls_target || 0,
        conversions: b.conversions_actual || 0,
        conversionsTarget: b.conversions_target || 0,
      })
    }

    if (scores && scores.length > 0) {
      setRepCallCount(scores.length)

      const totals: Record<string, { sum: number; count: number }> = {}
      scores.forEach((s) => {
        if (s.methodology_scores) {
          Object.entries(s.methodology_scores).forEach(([key, val]) => {
            if (!totals[key]) totals[key] = { sum: 0, count: 0 }
            totals[key].sum += val as number
            totals[key].count += 1
          })
        }
      })
      const avgs: Record<string, number> = {}
      Object.entries(totals).forEach(([key, { sum, count }]) => {
        avgs[key] = Math.round((sum / count) * 10) / 10
      })
      setRepScores(avgs)

      const vals = Object.values(avgs)
      if (vals.length > 0) {
        setRepOverallScore(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10)
      }

      // Trend
      const labels = scores.map((s) => new Date(s.call_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      const tScores = scores.map((s) => {
        if (!s.methodology_scores) return 0
        const v = Object.values(s.methodology_scores) as number[]
        return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : 0
      })
      setTrendLabels(labels)
      setTrendScores(tScores)
    }
  }

  async function handleSyncNow() {
    setSyncing(true)
    try {
      await Promise.allSettled([
        supabase.functions.invoke('hubspot-sync'),
        supabase.functions.invoke('fathom-sync'),
        supabase.functions.invoke('aircall-sync'),
      ])
      await loadDashboard()
    } finally {
      setSyncing(false)
    }
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

  // ─── LEADER DASHBOARD ───
  if (isLeader) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-light">
              Good morning, {userInfo.full_name || 'Coach'}
            </h1>
            <p className="text-light-muted text-sm mt-1">Here is your team at a glance.</p>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center gap-2 bg-teal/10 text-teal border border-teal/20 px-4 py-2 rounded-lg hover:bg-teal/20 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <HiRefresh className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* KPI Radials Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
            <ScoreRadial
              score={teamAvgScore ?? 0}
              maxScore={10}
              size={120}
              label="Team Score"
              sublabel="/10"
            />
          </div>
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
            <ScoreRadial
              score={totalCalls}
              maxScore={Math.max(totalCalls, 50)}
              size={120}
              label="Calls Analyzed"
              showPercentage={false}
            />
          </div>
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
            <ScoreRadial
              score={quotaAttainment ?? 0}
              maxScore={100}
              size={120}
              label="Quota Attainment"
              showPercentage={true}
            />
          </div>
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
            <ScoreRadial
              score={discoveryCallsPct ?? 0}
              maxScore={100}
              size={120}
              label="Discovery Calls"
              showPercentage={true}
            />
          </div>
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
            <ScoreRadial
              score={approachesPct ?? 0}
              maxScore={100}
              size={120}
              label="Approaches"
              showPercentage={true}
            />
          </div>
        </div>

        {/* Team Members Table */}
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-light">Team Members</h2>
            <Link href="/team" className="text-teal text-sm hover:text-aqua">Manage Team</Link>
          </div>
          {teamMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-light-muted uppercase tracking-wider border-b border-navy">
                    <th className="pb-3 pr-4">Rep</th>
                    <th className="pb-3 pr-4 text-center">Score</th>
                    <th className="pb-3 pr-4 text-center">Calls</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.email} className="border-b border-navy/50 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-light">{member.full_name}</p>
                        <p className="text-xs text-light-muted">{member.role}</p>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                          member.avgScore >= 7 ? 'text-teal bg-teal/10' :
                          member.avgScore >= 5 ? 'text-gold bg-gold/10' :
                          'text-pink bg-pink/10'
                        }`}>
                          {member.avgScore > 0 ? member.avgScore : '--'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center text-sm text-light-muted">
                        {member.callCount}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/calls?rep=${encodeURIComponent(member.email)}`}
                          className="text-teal text-xs hover:text-aqua"
                        >
                          View Calls
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-light-muted text-sm">
              No team members yet. <Link href="/team/invite" className="text-teal hover:text-aqua">Invite your first rep</Link>
            </p>
          )}
        </div>

        {/* Bottom Row: Trend + Coaching + Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Trends */}
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
            <h2 className="text-lg font-bold text-light mb-4">Score Trends</h2>
            {trendLabels.length > 1 ? (
              <ScoreTrendChart labels={trendLabels} scores={trendScores} height={200} />
            ) : (
              <p className="text-light-muted text-sm">Trends appear after calls are analyzed.</p>
            )}
          </div>

          {/* Recent Coaching */}
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-light">Recent Coaching</h2>
              <Link href="/coaching" className="text-teal text-xs hover:text-aqua">View All</Link>
            </div>
            {recentCoaching.length > 0 ? (
              <div className="space-y-3">
                {recentCoaching.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-navy/50">
                    {c.status === 'sent' ? (
                      <HiCheckCircle className="text-teal text-lg flex-shrink-0" />
                    ) : (
                      <HiAcademicCap className="text-gold text-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-light truncate">{c.rep_email}</p>
                      <p className="text-xs text-light-muted">
                        {c.status === 'sent' ? 'Sent' : 'Pending'} &middot; {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-light-muted text-sm">Coaching messages will appear here.</p>
            )}
          </div>

          {/* Needs Attention */}
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
            <h2 className="text-lg font-bold text-light mb-4">Needs Attention</h2>
            {needsAttention.length > 0 ? (
              <div className="space-y-3">
                {needsAttention.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-pink/5 border border-pink/10">
                    <HiExclamationCircle className="text-pink text-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-light truncate">{item.repName}</p>
                      <p className="text-xs text-pink">
                        {item.component}: {item.score}/10
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-light-muted text-sm">No critical issues detected.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── REP DASHBOARD ───
  return (
    <div>
      <h1 className="text-2xl font-bold text-light mb-1">Your Performance</h1>
      <p className="text-light-muted text-sm mb-8">
        Welcome back, {userInfo.full_name || 'there'}.
      </p>

      {/* Rep KPI Radials */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
          <ScoreRadial
            score={repOverallScore ?? 0}
            maxScore={10}
            size={120}
            label="Sandler Score"
            sublabel="/10"
          />
        </div>
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
          <ScoreRadial
            score={repCallCount}
            maxScore={Math.max(repCallCount, 20)}
            size={120}
            label="Calls Analyzed"
          />
        </div>
        {repBenchmarks ? (
          <>
            <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
              <ScoreRadial
                score={repBenchmarks.approachesTarget > 0 ? Math.round((repBenchmarks.approaches / repBenchmarks.approachesTarget) * 100) : 0}
                maxScore={100}
                size={120}
                label="Approaches"
                showPercentage={true}
              />
            </div>
            <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
              <ScoreRadial
                score={repBenchmarks.discoveryTarget > 0 ? Math.round((repBenchmarks.discovery / repBenchmarks.discoveryTarget) * 100) : 0}
                maxScore={100}
                size={120}
                label="Discovery Calls"
                showPercentage={true}
              />
            </div>
            <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
              <ScoreRadial
                score={repBenchmarks.conversionsTarget > 0 ? Math.round((repBenchmarks.conversions / repBenchmarks.conversionsTarget) * 100) : 0}
                maxScore={100}
                size={120}
                label="Quota"
                showPercentage={true}
              />
            </div>
          </>
        ) : (
          <>
            <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
              <ScoreRadial score={0} maxScore={100} size={120} label="Approaches" showPercentage={true} />
            </div>
            <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
              <ScoreRadial score={0} maxScore={100} size={120} label="Discovery Calls" showPercentage={true} />
            </div>
            <div className="bg-navy-light rounded-2xl border border-teal/10 p-5 flex flex-col items-center">
              <ScoreRadial score={0} maxScore={100} size={120} label="Quota" showPercentage={true} />
            </div>
          </>
        )}
      </div>

      {/* Sandler Breakdown + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-lg font-bold text-light mb-4">Sandler Breakdown</h2>
          {repScores ? (
            <SandlerBreakdown scores={repScores} />
          ) : (
            <p className="text-light-muted text-sm">Scores appear after your first call is analyzed.</p>
          )}
        </div>

        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-lg font-bold text-light mb-4">Score History</h2>
          {trendLabels.length > 1 ? (
            <ScoreTrendChart labels={trendLabels} scores={trendScores} height={200} />
          ) : (
            <p className="text-light-muted text-sm">Trend data appears after multiple calls.</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-lg font-bold text-light mb-3">Latest Coaching</h2>
          <p className="text-light-muted text-sm mb-4">
            Coaching feedback from your manager will appear here.
          </p>
          <Link href="/coaching" className="text-teal hover:text-aqua text-sm font-medium">
            View Coaching Inbox
          </Link>
        </div>
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-lg font-bold text-light mb-3">My Calls</h2>
          <p className="text-light-muted text-sm mb-4">
            {repCallCount > 0 ? `${repCallCount} calls analyzed.` : 'Calls will appear once integrations are connected.'}
          </p>
          <Link href="/calls" className="text-teal hover:text-aqua text-sm font-medium">
            View All Calls
          </Link>
        </div>
      </div>
    </div>
  )
}
