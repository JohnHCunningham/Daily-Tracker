'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiArrowLeft, HiUserCircle, HiChatAlt2, HiCheckCircle, HiAcademicCap, HiSparkles, HiTrash } from 'react-icons/hi'
import dynamic from 'next/dynamic'
import ScoreBreakdown from '../../components/ScoreBreakdown'

const ScoreRadial = dynamic(() => import('../../components/ScoreRadial'), { ssr: false })
const ScoreTrendChart = dynamic(() => import('../../components/ScoreTrendChart'), { ssr: false })

interface MemberDetail {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

interface CurrentUser {
  id: string
  account_id: string
  email: string
  role: string
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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [callScores, setCallScores] = useState<CallScore[]>([])
  const [avgScores, setAvgScores] = useState<Record<string, number> | null>(null)
  const [pipelineProgress, setPipelineProgress] = useState<{ calls: number; discovery: number; proposals: number; sales: number }>({ calls: 0, discovery: 0, proposals: 0, sales: 0 })
  const [coachingHistory, setCoachingHistory] = useState<CoachingMessage[]>([])
  const [celebrations, setCelebrations] = useState<CelebrationItem[]>([])
  const [removing, setRemoving] = useState(false)
  const router = useRouter()

  const loadMember = useCallback(async () => {
    const response = await fetch(`/api/team/members/${params.memberId}`)
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      setLoading(false)
      return
    }

    setCurrentUser(data.currentUser)
    setMember(data.member)
    setSelectedRole(data.member.role)
    setEditedName(data.member.full_name || '')
    setCallScores(data.callScores || [])
    setAvgScores(data.avgScores || null)
    setPipelineProgress(data.pipelineProgress || { calls: 0, discovery: 0, proposals: 0, sales: 0 })
    setCoachingHistory(data.coachingHistory || [])
    setCelebrations(data.celebrations || [])
    setLoading(false)
  }, [params.memberId])

  useEffect(() => {
    void loadMember()
  }, [loadMember])

  async function handleRoleChange() {
    if (!member || selectedRole === member.role) return
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) return
    setSaving(true)

    const response = await fetch(`/api/team/members/${member.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: selectedRole }),
    })

    if (response.ok) {
      setMember({ ...member, role: selectedRole })
    }
    setSaving(false)
  }

  async function handleSaveName() {
    if (!member || !editedName.trim()) return
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) return
    setSaving(true)

    const response = await fetch(`/api/team/members/${member.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ full_name: editedName.trim() }),
    })

    if (response.ok) {
      setMember({ ...member, full_name: editedName.trim() })
      setEditingName(false)
    }
    setSaving(false)
  }

  async function handleRemoveRep() {
    if (!member || !currentUser || !['admin', 'manager'].includes(currentUser.role)) return
    setRemoving(true)

    try {
      const response = await fetch(`/api/team/members/${member.id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        alert(data.error || 'Failed to remove rep')
        return
      }

      router.push('/team')
    } finally {
      setRemoving(false)
    }
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
    return <div className="text-stone-light">Loading...</div>
  }

  if (!member) {
    return <div className="text-stone-light">Member not found.</div>
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
        className="flex items-center gap-2 text-terracotta hover:text-terracotta-bright mb-6 text-sm"
      >
        <HiArrowLeft /> Back to Team
      </Link>

      <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-8 mb-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-terracotta/20 rounded-full flex items-center justify-center">
            <HiUserCircle className="text-terracotta text-5xl" />
          </div>
          <div className="flex-1">
            {editingName && currentUser && ['admin', 'manager'].includes(currentUser.role) ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl font-bold px-3 py-1 border border-terracotta/30 rounded bg-white text-espresso focus:outline-none focus:border-terracotta"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving || !editedName.trim()}
                  className="text-sm bg-terracotta text-white px-3 py-1 rounded hover:bg-terracotta-bright transition-colors disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false)
                    setEditedName(member?.full_name || '')
                  }}
                  className="text-sm text-stone hover:text-espresso"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-espresso">{member.full_name || 'Unnamed'}</h1>
                {currentUser && ['admin', 'manager'].includes(currentUser.role) && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-sm text-terracotta hover:text-terracotta-bright"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
            <p className="text-stone-light">{member.email}</p>
            <p className="text-xs text-stone-light mt-1">
              Joined {new Date(member.created_at).toLocaleDateString()}
            </p>
          </div>
          {overallScore !== null && (
            <ScoreRadial score={overallScore} label="Avg Score" />
          )}
        </div>

        {/* Role Management */}
        <div className="border-t border-bone pt-6">
          <h2 className="text-xl font-bold text-espresso mb-4">Role</h2>
          {currentUser && ['admin', 'manager'].includes(currentUser.role) ? (
            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-3 bg-bone border border-terracotta/20 rounded-lg text-espresso focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-teal/20"
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
                  className="bg-terracotta text-white font-bold py-3 px-6 rounded-lg hover:bg-terracotta-bright transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Role'}
                </button>
              )}
              {member.role === 'rep' && (
                <button
                  onClick={handleRemoveRep}
                  disabled={removing}
                  className="inline-flex items-center gap-2 bg-white text-terracotta border border-terracotta/20 font-bold py-3 px-6 rounded-lg hover:bg-terracotta/5 transition-colors disabled:opacity-50"
                >
                  <HiTrash />
                  {removing ? 'Removing...' : 'Remove Rep'}
                </button>
              )}
            </div>
          ) : (
            <span className="inline-flex text-xs font-bold px-3 py-1 rounded-full border bg-white text-stone-light border-bone-dark">
              {member.role.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline Activity Row */}
      <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-espresso mb-4">Pipeline Activity</h2>
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
        {/* Methodology Breakdown */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-xl font-bold text-espresso mb-4">Methodology Breakdown</h2>
          {avgScores ? (
            <ScoreBreakdown scores={avgScores} />
          ) : (
            <p className="text-stone-light text-sm">
              No analyzed calls yet. Scores will appear after calls are analyzed.
            </p>
          )}
        </div>

        {/* Score Trend */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-xl font-bold text-espresso mb-4">Score Trend</h2>
          {trendLabels.length > 1 ? (
            <ScoreTrendChart labels={trendLabels} scores={trendScores} />
          ) : (
            <p className="text-stone-light text-sm">
              {trendLabels.length === 1
                ? 'Need at least 2 analyzed calls to show trends.'
                : 'No analyzed calls yet.'}
            </p>
          )}
        </div>
      </div>

      {/* Coaching History + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-espresso">Coaching History</h2>
            <Link href="/coaching" className="text-terracotta text-xs hover:text-terracotta-bright">View All</Link>
          </div>
          {coachingHistory.length > 0 ? (
            <div className="space-y-3">
              {coachingHistory.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bone/50">
                  {c.status === 'sent' ? (
                    <HiCheckCircle className="text-terracotta text-lg flex-shrink-0" />
                  ) : (
                    <HiAcademicCap className="text-clay text-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-espresso truncate">{c.subject || 'Coaching Message'}</p>
                    <p className="text-xs text-stone-light">
                      {c.status === 'sent' ? 'Sent' : c.status} &middot; {getTimeAgo(c.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-light text-sm">No coaching messages yet.</p>
          )}
        </div>

        <div className="space-y-6">
          {/* 1-on-1 Notes Link */}
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
            <h2 className="text-xl font-bold text-espresso mb-3">1-on-1 Notes</h2>
            <p className="text-stone-light text-sm mb-4">
              Send private notes and prep for your next 1-on-1 meeting.
            </p>
            <Link
              href={`/notes?rep=${encodeURIComponent(member.email)}`}
              className="flex items-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-5 rounded-lg hover:shadow-lg transition-all text-sm"
            >
              <HiChatAlt2 /> Open Notes
            </Link>
          </div>

          {/* Recent Celebrations */}
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-espresso">Badges Earned</h2>
              <Link href="/celebrations" className="text-terracotta text-xs hover:text-terracotta-bright">View All</Link>
            </div>
            {celebrations.length > 0 ? (
              <div className="space-y-3">
                {celebrations.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bone/50">
                    <HiSparkles className="text-clay text-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-espresso truncate">{c.title}</p>
                      <p className="text-xs text-stone-light">{getTimeAgo(c.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-light text-sm">No badges earned yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
