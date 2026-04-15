'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiArrowLeft, HiUserCircle, HiChatAlt2, HiCheckCircle, HiAcademicCap, HiSparkles } from 'react-icons/hi'
import dynamic from 'next/dynamic'
import SandlerBreakdown from '../../components/SandlerBreakdown'

const ScoreRadial = dynamic(() => import('../../components/ScoreRadial'), { ssr: false })
const ScoreTrendChart = dynamic(() => import('../../components/ScoreTrendChart'), { ssr: false })

interface MemberDetail {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

interface CallScore {
  call_date: string
  methodology_scores: Record<string, number> | null
}

interface Goal {
  id: string
  rep_email: string | null
  goal_type: string
  target_value: number
  current_value: number
}

interface CoachingMessage {
  id: string
  subject: string | null
  status: string
  created_at: string
}

interface CelebrationItem {
  id: string
  title: string
  badge_key: string | null
  created_at: string
}

export default function MemberDetailPage({ params }: { params: { memberId: string } }) {
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [callScores, setCallScores] = useState<CallScore[]>([])
  const [avgScores, setAvgScores] = useState<Record<string, number> | null>(null)
  const [pipelineProgress, setPipelineProgress] = useState<{ calls: number; discovery: number; proposals: number; sales: number }>({ calls: 0, discovery: 0, proposals: 0, sales: 0 })
  const [coachingHistory, setCoachingHistory] = useState<CoachingMessage[]>([])
  const [celebrations, setCelebrations] = useState<CelebrationItem[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadMember()
  }, [params.memberId])

  async function loadMember() {
    const { data } = await supabase
      .from('Users')
      .select('id, full_name, email, role, created_at')
      .eq('id', params.memberId)
      .single()

    if (data) {
      setMember(data)
      setSelectedRole(data.role)
      await loadScores(data.email)
      await loadGoals(data.email)
      await loadCoaching(data.email)
      await loadCelebrations(data.email)
    }
    setLoading(false)
  }

  async function loadScores(email: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return

    const { data: scores } = await supabase
      .from('Synced_Conversations')
      .select('call_date, methodology_scores')
      .eq('account_id', userData.account_id)
      .eq('rep_email', email)
      .not('methodology_scores', 'is', null)
      .order('call_date', { ascending: true })
      .limit(20)

    if (scores && scores.length > 0) {
      setCallScores(scores)

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
      setAvgScores(avgs)
    }
  }

  async function loadGoals(email: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: goalsData } = await supabase
      .from('Goals')
      .select('*')
      .eq('account_id', userData.account_id)
      .gte('period_end', monthStart)
      .lte('period_start', monthEnd)

    if (goalsData) {
      const repGoals = goalsData.filter((g: Goal) => g.rep_email === email || g.rep_email === null)

      const pct = (type: string): number => {
        const matched = repGoals.filter((g: Goal) => g.goal_type === type)
        const target = matched.reduce((s: number, g: Goal) => s + g.target_value, 0)
        const current = matched.reduce((s: number, g: Goal) => s + g.current_value, 0)
        if (target === 0) return 0
        return Math.min(Math.round((current / target) * 100), 100)
      }

      setPipelineProgress({
        calls: pct('contacts'),
        discovery: pct('discovery_calls'),
        proposals: pct('proposals'),
        sales: pct('sales'),
      })
    }
  }

  async function loadCoaching(email: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return

    const { data: coaching } = await supabase
      .from('Coaching_Messages')
      .select('id, subject, status, created_at')
      .eq('account_id', userData.account_id)
      .eq('rep_email', email)
      .order('created_at', { ascending: false })
      .limit(5)

    if (coaching) setCoachingHistory(coaching)
  }

  async function loadCelebrations(email: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) return

    const { data } = await supabase
      .from('Celebrations')
      .select('id, title, badge_key, created_at')
      .eq('account_id', userData.account_id)
      .eq('rep_email', email)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) setCelebrations(data)
  }

  async function handleRoleChange() {
    if (!member || selectedRole === member.role) return
    setSaving(true)

    const { error } = await supabase
      .from('Users')
      .update({ role: selectedRole })
      .eq('id', member.id)

    if (!error) {
      setMember({ ...member, role: selectedRole })
    }
    setSaving(false)
  }

  function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
  }

  if (loading) {
    return <div className="text-light-muted">Loading...</div>
  }

  if (!member) {
    return <div className="text-light-muted">Member not found.</div>
  }

  const overallScore = avgScores
    ? Math.round(Object.values(avgScores).reduce((a, b) => a + b, 0) / Object.values(avgScores).length * 10) / 10
    : null

  const trendLabels = callScores.map((s) => new Date(s.call_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  const trendScores = callScores.map((s) => {
    if (!s.methodology_scores) return 0
    const vals = Object.values(s.methodology_scores) as number[]
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0
  })

  return (
    <div>
      <Link
        href="/team"
        className="flex items-center gap-2 text-teal hover:text-aqua mb-6 text-sm"
      >
        <HiArrowLeft /> Back to Team
      </Link>

      <div className="bg-navy-light rounded-2xl border border-teal/10 p-8 mb-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-teal/20 rounded-full flex items-center justify-center">
            <HiUserCircle className="text-teal text-5xl" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-light">{member.full_name || 'Unnamed'}</h1>
            <p className="text-light-muted">{member.email}</p>
            <p className="text-xs text-light-muted mt-1">
              Joined {new Date(member.created_at).toLocaleDateString()}
            </p>
          </div>
          {overallScore !== null && (
            <ScoreRadial score={overallScore} label="Avg Score" />
          )}
        </div>

        {/* Role Management */}
        <div className="border-t border-navy pt-6">
          <h2 className="text-xl font-bold text-light mb-4">Role</h2>
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 bg-navy border border-teal/20 rounded-lg text-light focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              >
                <option value="rep">Sales Rep</option>
                <option value="coach">Coach</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {selectedRole !== member.role && (
              <button
                onClick={handleRoleChange}
                disabled={saving}
                className="bg-teal text-navy font-bold py-3 px-6 rounded-lg hover:bg-aqua transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Role'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Activity Row */}
      <div className="bg-navy-light rounded-2xl border border-teal/10 p-6 mb-6">
        <h2 className="text-xl font-bold text-light mb-4">Pipeline Activity</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-center">
            <ScoreRadial
              score={pipelineProgress.calls}
              maxScore={100}
              size={90}
              label="Calls"
              showPercentage={true}
            />
          </div>
          <div className="flex flex-col items-center">
            <ScoreRadial
              score={pipelineProgress.discovery}
              maxScore={100}
              size={90}
              label="Discovery"
              showPercentage={true}
            />
          </div>
          <div className="flex flex-col items-center">
            <ScoreRadial
              score={pipelineProgress.proposals}
              maxScore={100}
              size={90}
              label="Proposals"
              showPercentage={true}
            />
          </div>
          <div className="flex flex-col items-center">
            <ScoreRadial
              score={pipelineProgress.sales}
              maxScore={100}
              size={90}
              label="Sales"
              showPercentage={true}
            />
          </div>
        </div>
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sandler Breakdown */}
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-xl font-bold text-light mb-4">Sandler Breakdown</h2>
          {avgScores ? (
            <SandlerBreakdown scores={avgScores} />
          ) : (
            <p className="text-light-muted text-sm">
              No analyzed calls yet. Scores will appear after calls are analyzed.
            </p>
          )}
        </div>

        {/* Score Trend */}
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-xl font-bold text-light mb-4">Score Trend</h2>
          {trendLabels.length > 1 ? (
            <ScoreTrendChart labels={trendLabels} scores={trendScores} />
          ) : (
            <p className="text-light-muted text-sm">
              {trendLabels.length === 1
                ? 'Need at least 2 analyzed calls to show trends.'
                : 'No analyzed calls yet.'}
            </p>
          )}
        </div>
      </div>

      {/* Coaching History + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-light">Coaching History</h2>
            <Link href="/coaching" className="text-teal text-xs hover:text-aqua">View All</Link>
          </div>
          {coachingHistory.length > 0 ? (
            <div className="space-y-3">
              {coachingHistory.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-navy/50">
                  {c.status === 'sent' ? (
                    <HiCheckCircle className="text-teal text-lg flex-shrink-0" />
                  ) : (
                    <HiAcademicCap className="text-gold text-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-light truncate">{c.subject || 'Coaching Message'}</p>
                    <p className="text-xs text-light-muted">
                      {c.status === 'sent' ? 'Sent' : c.status} &middot; {getTimeAgo(c.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-light-muted text-sm">No coaching messages yet.</p>
          )}
        </div>

        <div className="space-y-6">
          {/* 1-on-1 Notes Link */}
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
            <h2 className="text-xl font-bold text-light mb-3">1-on-1 Notes</h2>
            <p className="text-light-muted text-sm mb-4">
              Send private notes and prep for your next 1-on-1 meeting.
            </p>
            <Link
              href={`/notes?rep=${encodeURIComponent(member.email)}`}
              className="flex items-center gap-2 bg-gradient-to-r from-teal to-aqua text-navy font-bold py-2.5 px-5 rounded-lg hover:shadow-lg transition-all text-sm"
            >
              <HiChatAlt2 /> Open Notes
            </Link>
          </div>

          {/* Recent Celebrations */}
          <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-light">Badges Earned</h2>
              <Link href="/celebrations" className="text-teal text-xs hover:text-aqua">View All</Link>
            </div>
            {celebrations.length > 0 ? (
              <div className="space-y-3">
                {celebrations.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-navy/50">
                    <HiSparkles className="text-gold text-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-light truncate">{c.title}</p>
                      <p className="text-xs text-light-muted">{getTimeAgo(c.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-light-muted text-sm">No badges earned yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
