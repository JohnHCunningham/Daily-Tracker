'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiArrowLeft, HiUserCircle } from 'react-icons/hi'
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

export default function MemberDetailPage({ params }: { params: { memberId: string } }) {
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [callScores, setCallScores] = useState<CallScore[]>([])
  const [avgScores, setAvgScores] = useState<Record<string, number> | null>(null)
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
      loadScores(data.email)
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

      // Calculate average scores across all calls
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

  if (loading) {
    return <div className="text-light-muted">Loading...</div>
  }

  if (!member) {
    return <div className="text-light-muted">Member not found.</div>
  }

  // Compute overall average score
  const overallScore = avgScores
    ? Math.round(Object.values(avgScores).reduce((a, b) => a + b, 0) / Object.values(avgScores).length * 10) / 10
    : null

  // Trend data
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

      {/* Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  )
}
