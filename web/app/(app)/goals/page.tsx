'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HiPlus, HiTrash, HiChartBar } from 'react-icons/hi'
import dynamic from 'next/dynamic'

const ScoreRadial = dynamic(() => import('../components/ScoreRadial'), { ssr: false })

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
  contacts: 'Sales Approaches',
  discovery_calls: 'Discovery Calls',
  proposals: 'Proposals Sent',
  sales: 'Sales Closed',
  quota: 'Revenue Quota',
  sandler_score: 'Sandler Score Target',
}

const goalTypeUnits: Record<string, string> = {
  contacts: '',
  discovery_calls: '',
  proposals: '',
  sales: '',
  quota: '$',
  sandler_score: '/10',
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formRepEmail, setFormRepEmail] = useState('')
  const [formType, setFormType] = useState('contacts')
  const [formTarget, setFormTarget] = useState('')

  const supabase = createClient()

  const loadGoals = useCallback(async () => {
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
    setUserEmail(userData.email)
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
  }, [supabase])

  useEffect(() => {
    void loadGoals()
  }, [loadGoals])

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const periodStart = start.toISOString().split('T')[0]
    const periodEnd = end.toISOString().split('T')[0]

    const { error } = await supabase
      .from('Goals')
      .insert({
        account_id: accountId,
        rep_email: formRepEmail || null,
        goal_type: formType,
        target_value: parseFloat(formTarget),
        period: 'monthly',
        period_start: periodStart,
        period_end: periodEnd,
        set_by: user.id,
      })

    if (!error) {
      setShowForm(false)
      setFormRepEmail('')
      setFormType('contacts')
      setFormTarget('')
      void loadGoals()
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

  // Compute current month goals
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const currentMonthGoals = goals.filter(
    (g) => g.period_start <= currentMonthEnd && g.period_end >= currentMonthStart
  )

  // Aggregate by goal type for summary radials
  function aggregateGoals(filteredGoals: Goal[], goalType: string) {
    const matching = filteredGoals.filter((g) => g.goal_type === goalType)
    const totalTarget = matching.reduce((sum, g) => sum + g.target_value, 0)
    const totalCurrent = matching.reduce((sum, g) => sum + g.current_value, 0)
    return { target: totalTarget, current: totalCurrent, percent: getProgressPercent(totalCurrent, totalTarget) }
  }

  // Annual rollup: all goals in current year
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  const yearEnd = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]

  const yearGoals = goals.filter(
    (g) => g.period_start >= yearStart && g.period_end <= yearEnd
  )

  // For rep view, filter to own goals
  const myMonthGoals = currentMonthGoals.filter(
    (g) => g.rep_email === userEmail || g.rep_email === null
  )
  const myYearGoals = yearGoals.filter(
    (g) => g.rep_email === userEmail || g.rep_email === null
  )

  // Group goals by rep for manager list
  const goalsByRep: Record<string, Goal[]> = {}
  goals.forEach((g) => {
    const key = g.rep_email || 'Team Goal'
    if (!goalsByRep[key]) goalsByRep[key] = []
    goalsByRep[key].push(g)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isLeader = ['admin', 'manager'].includes(userRole)

  // ─── MANAGER VIEW ───
  if (isLeader) {
    const teamApproaches = aggregateGoals(currentMonthGoals, 'contacts')
    const teamDiscovery = aggregateGoals(currentMonthGoals, 'discovery_calls')
    const teamQuota = aggregateGoals(currentMonthGoals, 'quota')

    const ytdApproaches = aggregateGoals(yearGoals, 'contacts')
    const ytdDiscovery = aggregateGoals(yearGoals, 'discovery_calls')
    const ytdQuota = aggregateGoals(yearGoals, 'quota')

    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-espresso">Goals & Targets</h1>
            <p className="text-stone-light mt-1">Set and track goals for your team.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-5 rounded-lg hover:shadow-lg transition-all"
          >
            <HiPlus className="text-lg" />
            Set Goal
          </button>
        </div>

        {/* Team Monthly Summary */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-stone-light uppercase tracking-wider mb-3">Monthly Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-5 flex flex-col items-center">
              <ScoreRadial
                score={teamApproaches.percent}
                maxScore={100}
                size={130}
                label="Sales Approaches"
                showPercentage={true}
              />
              <p className="text-sm text-stone-light mt-2">
                {teamApproaches.current} / {teamApproaches.target}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-5 flex flex-col items-center">
              <ScoreRadial
                score={teamDiscovery.percent}
                maxScore={100}
                size={130}
                label="Discovery Calls"
                showPercentage={true}
              />
              <p className="text-sm text-stone-light mt-2">
                {teamDiscovery.current} / {teamDiscovery.target}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-5 flex flex-col items-center">
              <ScoreRadial
                score={teamQuota.percent}
                maxScore={100}
                size={130}
                label="Sales Quota"
                showPercentage={true}
              />
              <p className="text-sm text-stone-light mt-2">
                ${teamQuota.current} / ${teamQuota.target}
              </p>
            </div>
          </div>
        </div>

        {/* Annual Rollup */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-stone-light uppercase tracking-wider mb-3">Year-to-Date</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-4 flex items-center gap-4">
              <ScoreRadial
                score={ytdApproaches.percent}
                maxScore={100}
                size={70}
                showPercentage={true}
              />
              <div>
                <p className="text-sm font-medium text-espresso">Sales Approaches</p>
                <p className="text-xs text-stone-light">{ytdApproaches.current} / {ytdApproaches.target} YTD</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-4 flex items-center gap-4">
              <ScoreRadial
                score={ytdDiscovery.percent}
                maxScore={100}
                size={70}
                showPercentage={true}
              />
              <div>
                <p className="text-sm font-medium text-espresso">Discovery Calls</p>
                <p className="text-xs text-stone-light">{ytdDiscovery.current} / {ytdDiscovery.target} YTD</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-4 flex items-center gap-4">
              <ScoreRadial
                score={ytdQuota.percent}
                maxScore={100}
                size={70}
                showPercentage={true}
              />
              <div>
                <p className="text-sm font-medium text-espresso">Sales Quota</p>
                <p className="text-xs text-stone-light">${ytdQuota.current} / ${ytdQuota.target} YTD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Goal Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-espresso mb-4">New Monthly Goal</h2>
            <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-2">Assign To</label>
                <select
                  value={formRepEmail}
                  onChange={(e) => setFormRepEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-bone border border-terracotta/20 rounded-lg text-espresso focus:outline-none focus:border-terracotta"
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
                <label className="block text-sm font-medium text-espresso mb-2">Goal Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-4 py-3 bg-bone border border-terracotta/20 rounded-lg text-espresso focus:outline-none focus:border-terracotta"
                >
                  {Object.entries(goalTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-2">Target</label>
                <input
                  type="number"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-bone border border-terracotta/20 rounded-lg text-espresso placeholder-light-muted/50 focus:outline-none focus:border-terracotta"
                  placeholder="e.g. 50"
                />
              </div>
              <div className="flex items-end">
                <p className="text-sm text-stone-light">
                  Period: <span className="text-espresso font-medium">Monthly</span> (current month)
                </p>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-white text-stone-light border border-terracotta/20 rounded-lg hover:border-teal/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-terracotta text-white font-bold py-2.5 px-6 rounded-lg hover:bg-terracotta-bright transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals List Grouped by Rep */}
        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-8 text-center">
            <HiChartBar className="text-terracotta text-4xl mx-auto mb-4" />
            <h2 className="text-xl font-bold text-espresso mb-2">No goals set</h2>
            <p className="text-stone-light text-sm">
              Set goals for your team to track performance.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(goalsByRep).map(([repKey, repGoals]) => (
              <div key={repKey} className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
                <h3 className="text-lg font-bold text-espresso mb-4">{repKey}</h3>
                <div className="grid gap-3">
                  {repGoals.map((goal) => {
                    const percent = getProgressPercent(goal.current_value, goal.target_value)
                    const indicator = getLeadingIndicator(goal)
                    const unit = goalTypeUnits[goal.goal_type] || ''

                    return (
                      <div key={goal.id} className="bg-bone/50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-espresso text-sm">{goalTypeLabels[goal.goal_type]}</p>
                            <p className="text-xs text-stone-light mt-0.5">
                              {goal.period} &middot;{' '}
                              {new Date(goal.period_start).toLocaleDateString()} - {new Date(goal.period_end).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-stone-light hover:text-terracotta transition-colors"
                          >
                            <HiTrash />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 mb-1">
                          <div className="flex-1">
                            <div className="w-full bg-bone rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${getProgressColor(percent)} transition-all`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-espresso whitespace-nowrap">
                            {unit === '$' ? `$${goal.current_value}` : goal.current_value}{goal.goal_type === 'sandler_score' ? '/10' : ''} / {unit === '$' ? `$${goal.target_value}` : goal.target_value}{goal.goal_type === 'sandler_score' ? '/10' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-stone-light">{percent}%</p>

                        {indicator && (
                          <div className="mt-2 bg-clay/10 border border-clay/30 rounded-lg p-2 text-xs text-clay">
                            {indicator}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── REP VIEW ───
  const repApproaches = aggregateGoals(myMonthGoals, 'contacts')
  const repDiscovery = aggregateGoals(myMonthGoals, 'discovery_calls')
  const repQuota = aggregateGoals(myMonthGoals, 'quota')

  const repYtdApproaches = aggregateGoals(myYearGoals, 'contacts')
  const repYtdDiscovery = aggregateGoals(myYearGoals, 'discovery_calls')
  const repYtdQuota = aggregateGoals(myYearGoals, 'quota')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-espresso">My Goals</h1>
        <p className="text-stone-light mt-1">Your performance goals set by your manager.</p>
      </div>

      {/* Monthly Progress */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-stone-light uppercase tracking-wider mb-3">Monthly Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-5 flex flex-col items-center">
            <ScoreRadial
              score={repApproaches.percent}
              maxScore={100}
              size={130}
              label="Sales Approaches"
              showPercentage={true}
            />
            <p className="text-sm text-stone-light mt-2">
              {repApproaches.current} / {repApproaches.target}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-5 flex flex-col items-center">
            <ScoreRadial
              score={repDiscovery.percent}
              maxScore={100}
              size={130}
              label="Discovery Calls"
              showPercentage={true}
            />
            <p className="text-sm text-stone-light mt-2">
              {repDiscovery.current} / {repDiscovery.target}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-5 flex flex-col items-center">
            <ScoreRadial
              score={repQuota.percent}
              maxScore={100}
              size={130}
              label="Sales Quota"
              showPercentage={true}
            />
            <p className="text-sm text-stone-light mt-2">
              ${repQuota.current} / ${repQuota.target}
            </p>
          </div>
        </div>
      </div>

      {/* Annual Rollup */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-stone-light uppercase tracking-wider mb-3">Year-to-Date</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-4 flex items-center gap-4">
            <ScoreRadial
              score={repYtdApproaches.percent}
              maxScore={100}
              size={70}
              showPercentage={true}
            />
            <div>
              <p className="text-sm font-medium text-espresso">Sales Approaches</p>
              <p className="text-xs text-stone-light">{repYtdApproaches.current} / {repYtdApproaches.target} YTD</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-4 flex items-center gap-4">
            <ScoreRadial
              score={repYtdDiscovery.percent}
              maxScore={100}
              size={70}
              showPercentage={true}
            />
            <div>
              <p className="text-sm font-medium text-espresso">Discovery Calls</p>
              <p className="text-xs text-stone-light">{repYtdDiscovery.current} / {repYtdDiscovery.target} YTD</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-4 flex items-center gap-4">
            <ScoreRadial
              score={repYtdQuota.percent}
              maxScore={100}
              size={70}
              showPercentage={true}
            />
            <div>
              <p className="text-sm font-medium text-espresso">Sales Quota</p>
              <p className="text-xs text-stone-light">${repYtdQuota.current} / ${repYtdQuota.target} YTD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals List (read-only) */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-8 text-center">
          <HiChartBar className="text-terracotta text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-espresso mb-2">No goals set</h2>
          <p className="text-stone-light text-sm">
            Your manager hasn&apos;t set any goals yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => {
            const percent = getProgressPercent(goal.current_value, goal.target_value)
            const indicator = getLeadingIndicator(goal)
            const unit = goalTypeUnits[goal.goal_type] || ''

            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
                <div className="mb-3">
                  <h3 className="font-bold text-espresso">{goalTypeLabels[goal.goal_type]}</h3>
                  <p className="text-xs text-stone-light mt-1">
                    {goal.period} &middot;{' '}
                    {new Date(goal.period_start).toLocaleDateString()} - {new Date(goal.period_end).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1">
                    <div className="w-full bg-bone rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${getProgressColor(percent)} transition-all`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-espresso whitespace-nowrap">
                    {unit === '$' ? `$${goal.current_value}` : goal.current_value}{goal.goal_type === 'sandler_score' ? '/10' : ''} / {unit === '$' ? `$${goal.target_value}` : goal.target_value}{goal.goal_type === 'sandler_score' ? '/10' : ''}
                  </span>
                </div>
                <p className="text-xs text-stone-light">{percent}% complete</p>

                {indicator && (
                  <div className="mt-3 bg-clay/10 border border-clay/30 rounded-lg p-3 text-xs text-clay">
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
