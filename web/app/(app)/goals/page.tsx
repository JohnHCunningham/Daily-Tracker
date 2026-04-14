'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HiPlus, HiTrash, HiChartBar } from 'react-icons/hi'

interface Goal {
  id: string
  rep_email: string | null
  goal_type: string
  target_value: number
  current_value: number
  period: string
  period_start: string
  period_end: string
}

interface TeamMember {
  id: string
  full_name: string
  email: string
}

const goalTypeLabels: Record<string, string> = {
  contacts: 'Contacts Made',
  discovery_calls: 'Discovery Calls',
  sales: 'Sales Closed',
  quota: 'Revenue Quota',
  sandler_score: 'Sandler Score Target',
}

const goalTypeUnits: Record<string, string> = {
  contacts: '',
  discovery_calls: '',
  sales: '',
  quota: '$',
  sandler_score: '/10',
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formRepEmail, setFormRepEmail] = useState('')
  const [formType, setFormType] = useState('contacts')
  const [formTarget, setFormTarget] = useState('')
  const [formPeriod, setFormPeriod] = useState('monthly')

  const supabase = createClient()

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
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

    setUserRole(userData.role)
    setAccountId(userData.account_id)

    // Load goals
    let query = supabase
      .from('Goals')
      .select('*')
      .eq('account_id', userData.account_id)
      .order('created_at', { ascending: false })

    if (userData.role === 'rep') {
      query = query.eq('rep_email', userData.email)
    }

    const { data: goalsData } = await query
    if (goalsData) setGoals(goalsData)

    // Load team members for goal assignment
    if (['admin', 'manager'].includes(userData.role)) {
      const { data: teamData } = await supabase
        .from('Users')
        .select('id, full_name, email')
        .eq('account_id', userData.account_id)
        .eq('role', 'rep')

      if (teamData) setMembers(teamData)
    }

    setLoading(false)
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    let periodStart: string
    let periodEnd: string

    if (formPeriod === 'weekly') {
      const day = now.getDay()
      const start = new Date(now)
      start.setDate(now.getDate() - day)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      periodStart = start.toISOString().split('T')[0]
      periodEnd = end.toISOString().split('T')[0]
    } else if (formPeriod === 'quarterly') {
      const quarter = Math.floor(now.getMonth() / 3)
      const start = new Date(now.getFullYear(), quarter * 3, 1)
      const end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
      periodStart = start.toISOString().split('T')[0]
      periodEnd = end.toISOString().split('T')[0]
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      periodStart = start.toISOString().split('T')[0]
      periodEnd = end.toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('Goals')
      .insert({
        account_id: accountId,
        rep_email: formRepEmail || null,
        goal_type: formType,
        target_value: parseFloat(formTarget),
        period: formPeriod,
        period_start: periodStart,
        period_end: periodEnd,
        set_by: user.id,
      })

    if (!error) {
      setShowForm(false)
      setFormRepEmail('')
      setFormType('contacts')
      setFormTarget('')
      loadGoals()
    }
    setSaving(false)
  }

  async function handleDeleteGoal(goalId: string) {
    await supabase.from('Goals').delete().eq('id', goalId)
    setGoals(goals.filter((g) => g.id !== goalId))
  }

  function getProgressPercent(current: number, target: number): number {
    if (target === 0) return 0
    return Math.min(Math.round((current / target) * 100), 100)
  }

  function getProgressColor(percent: number): string {
    if (percent >= 75) return 'bg-teal'
    if (percent >= 50) return 'bg-gold'
    return 'bg-pink'
  }

  function getLeadingIndicator(goal: Goal): string | null {
    const percent = getProgressPercent(goal.current_value, goal.target_value)
    const remaining = goal.target_value - goal.current_value

    if (goal.goal_type === 'sales' && percent < 50) {
      const contactsNeeded = Math.ceil(remaining * 10)
      return `You need approximately ${contactsNeeded} more contacts to close ${remaining} more sales.`
    }
    if (goal.goal_type === 'discovery_calls' && percent < 75) {
      const contactsNeeded = Math.ceil(remaining * 3)
      return `Target ${contactsNeeded} more contacts to hit your discovery call goal.`
    }
    return null
  }

  if (loading) {
    return <div className="text-light-muted">Loading goals...</div>
  }

  const isLeader = ['admin', 'manager'].includes(userRole)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-light">Goals</h1>
          <p className="text-light-muted mt-1">
            {isLeader ? 'Set and track goals for your team.' : 'Your performance goals.'}
          </p>
        </div>
        {isLeader && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal to-aqua text-navy font-bold py-2.5 px-5 rounded-lg hover:shadow-lg transition-all"
          >
            <HiPlus className="text-lg" />
            Set Goal
          </button>
        )}
      </div>

      {/* Create Goal Form */}
      {showForm && (
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6 mb-8">
          <h2 className="text-xl font-bold text-light mb-4">New Goal</h2>
          <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light mb-2">Assign To</label>
              <select
                value={formRepEmail}
                onChange={(e) => setFormRepEmail(e.target.value)}
                className="w-full px-4 py-3 bg-navy border border-teal/20 rounded-lg text-light focus:outline-none focus:border-teal"
              >
                <option value="">All Reps (Team Goal)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.email}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-light mb-2">Goal Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-4 py-3 bg-navy border border-teal/20 rounded-lg text-light focus:outline-none focus:border-teal"
              >
                {Object.entries(goalTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-light mb-2">Target</label>
              <input
                type="number"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                required
                min="1"
                className="w-full px-4 py-3 bg-navy border border-teal/20 rounded-lg text-light placeholder-light-muted/50 focus:outline-none focus:border-teal"
                placeholder="e.g. 50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light mb-2">Period</label>
              <select
                value={formPeriod}
                onChange={(e) => setFormPeriod(e.target.value)}
                className="w-full px-4 py-3 bg-navy border border-teal/20 rounded-lg text-light focus:outline-none focus:border-teal"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 bg-navy-light text-light-muted border border-teal/20 rounded-lg hover:border-teal/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-teal text-navy font-bold py-2.5 px-6 rounded-lg hover:bg-aqua transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-8 text-center">
          <HiChartBar className="text-teal text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-light mb-2">No goals set</h2>
          <p className="text-light-muted text-sm">
            {isLeader ? 'Set goals for your team to track performance.' : 'Your manager hasn\'t set any goals yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => {
            const percent = getProgressPercent(goal.current_value, goal.target_value)
            const indicator = getLeadingIndicator(goal)
            const unit = goalTypeUnits[goal.goal_type] || ''

            return (
              <div key={goal.id} className="bg-navy-light rounded-2xl border border-teal/10 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-light">{goalTypeLabels[goal.goal_type]}</h3>
                    <p className="text-xs text-light-muted mt-1">
                      {goal.rep_email || 'Team Goal'} · {goal.period} ·{' '}
                      {new Date(goal.period_start).toLocaleDateString()} - {new Date(goal.period_end).toLocaleDateString()}
                    </p>
                  </div>
                  {isLeader && (
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-light-muted hover:text-pink transition-colors"
                    >
                      <HiTrash />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1">
                    <div className="w-full bg-navy rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${getProgressColor(percent)} transition-all`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-light whitespace-nowrap">
                    {unit === '$' ? `$${goal.current_value}` : goal.current_value}{goal.goal_type === 'sandler_score' ? '/10' : ''} / {unit === '$' ? `$${goal.target_value}` : goal.target_value}{goal.goal_type === 'sandler_score' ? '/10' : ''}
                  </span>
                </div>
                <p className="text-xs text-light-muted">{percent}% complete</p>

                {/* Leading Indicator */}
                {indicator && (
                  <div className="mt-3 bg-gold/10 border border-gold/20 rounded-lg p-3 text-xs text-gold">
                    {indicator}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
