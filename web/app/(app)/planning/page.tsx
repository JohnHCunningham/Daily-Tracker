'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const ScoreRadial = dynamic(() => import('../components/ScoreRadial'), { ssr: false })

interface Benchmark {
  id?: string
  period: string
  approaches_target: number
  discovery_calls_target: number
  conversions_target: number
  approaches_actual: number
  discovery_calls_actual: number
  conversions_actual: number
  user_id: string | null
}

interface TeamMember {
  auth_id: string
  full_name: string
  email: string
  role: string
}

export default function PlanningPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [selectedRep, setSelectedRep] = useState<string>('team')
  const [benchmark, setBenchmark] = useState<Benchmark>({
    period: 'weekly',
    approaches_target: 25,
    discovery_calls_target: 10,
    conversions_target: 4,
    approaches_actual: 0,
    discovery_calls_actual: 0,
    conversions_actual: 0,
    user_id: null,
  })
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (accountId) loadBenchmark()
  }, [selectedRep, accountId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData) { setLoading(false); return }
    setAccountId(userData.account_id)

    const { data: teamMembers } = await supabase
      .from('Users')
      .select('auth_id, full_name, email, role')
      .eq('account_id', userData.account_id)
      .eq('role', 'rep')

    if (teamMembers) setMembers(teamMembers)
    setLoading(false)
  }

  async function loadBenchmark() {
    if (!accountId) return

    let query = supabase
      .from('Benchmarks')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (selectedRep === 'team') {
      query = query.is('user_id', null)
    } else {
      query = query.eq('user_id', selectedRep)
    }

    const { data } = await query

    if (data && data.length > 0) {
      setBenchmark(data[0])
    } else {
      setBenchmark({
        period: 'weekly',
        approaches_target: 25,
        discovery_calls_target: 10,
        conversions_target: 4,
        approaches_actual: 0,
        discovery_calls_actual: 0,
        conversions_actual: 0,
        user_id: selectedRep === 'team' ? null : selectedRep,
      })
    }
  }

  async function handleSave() {
    if (!accountId) return
    setSaving(true)

    const payload = {
      account_id: accountId,
      user_id: selectedRep === 'team' ? null : selectedRep,
      period: benchmark.period,
      approaches_target: benchmark.approaches_target,
      discovery_calls_target: benchmark.discovery_calls_target,
      conversions_target: benchmark.conversions_target,
      approaches_actual: benchmark.approaches_actual,
      discovery_calls_actual: benchmark.discovery_calls_actual,
      conversions_actual: benchmark.conversions_actual,
      updated_at: new Date().toISOString(),
    }

    if (benchmark.id) {
      await supabase.from('Benchmarks').update(payload).eq('id', benchmark.id)
    } else {
      await supabase.from('Benchmarks').insert(payload)
    }

    toast.success('Benchmarks saved')
    setSaving(false)
    loadBenchmark()
  }

  function pct(actual: number, target: number): number {
    if (target === 0) return 0
    return Math.min(Math.round((actual / target) * 100), 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-light">Planning & Benchmarks</h1>
          <p className="text-light-muted text-sm mt-1">Set targets and track progress against quota.</p>
        </div>
        <select
          value={selectedRep}
          onChange={(e) => setSelectedRep(e.target.value)}
          className="bg-navy-light border border-teal/20 text-light text-sm rounded-lg px-3 py-2 focus:border-teal outline-none"
        >
          <option value="team">Team-Wide</option>
          {members.map((m) => (
            <option key={m.auth_id} value={m.auth_id}>
              {m.full_name || m.email}
            </option>
          ))}
        </select>
      </div>

      {/* Progress Radials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6 flex flex-col items-center">
          <ScoreRadial
            score={pct(benchmark.approaches_actual, benchmark.approaches_target)}
            maxScore={100}
            size={140}
            label="Approaches"
            showPercentage={true}
          />
          <p className="text-sm text-light-muted mt-3">
            {benchmark.approaches_actual} / {benchmark.approaches_target} target
          </p>
        </div>
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6 flex flex-col items-center">
          <ScoreRadial
            score={pct(benchmark.discovery_calls_actual, benchmark.discovery_calls_target)}
            maxScore={100}
            size={140}
            label="Discovery Calls"
            showPercentage={true}
          />
          <p className="text-sm text-light-muted mt-3">
            {benchmark.discovery_calls_actual} / {benchmark.discovery_calls_target} target
          </p>
        </div>
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6 flex flex-col items-center">
          <ScoreRadial
            score={pct(benchmark.conversions_actual, benchmark.conversions_target)}
            maxScore={100}
            size={140}
            label="Conversions (Quota)"
            showPercentage={true}
          />
          <p className="text-sm text-light-muted mt-3">
            {benchmark.conversions_actual} / {benchmark.conversions_target} target
          </p>
        </div>
      </div>

      {/* Edit Targets */}
      <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
        <h2 className="text-lg font-bold text-light mb-4">
          Set Targets {selectedRep === 'team' ? '(Team-Wide)' : `(${members.find(m => m.auth_id === selectedRep)?.full_name || 'Rep'})`}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Targets Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-light-muted uppercase tracking-wider">Targets</h3>
            <div>
              <label className="text-sm text-light-muted block mb-1">Approaches / Week</label>
              <input
                type="number"
                value={benchmark.approaches_target}
                onChange={(e) => setBenchmark({ ...benchmark, approaches_target: parseInt(e.target.value) || 0 })}
                className="w-full bg-navy border border-teal/20 text-light rounded-lg px-3 py-2 text-sm focus:border-teal outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-light-muted block mb-1">Discovery Calls / Week</label>
              <input
                type="number"
                value={benchmark.discovery_calls_target}
                onChange={(e) => setBenchmark({ ...benchmark, discovery_calls_target: parseInt(e.target.value) || 0 })}
                className="w-full bg-navy border border-teal/20 text-light rounded-lg px-3 py-2 text-sm focus:border-teal outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-light-muted block mb-1">Conversions / Week (Quota)</label>
              <input
                type="number"
                value={benchmark.conversions_target}
                onChange={(e) => setBenchmark({ ...benchmark, conversions_target: parseInt(e.target.value) || 0 })}
                className="w-full bg-navy border border-teal/20 text-light rounded-lg px-3 py-2 text-sm focus:border-teal outline-none"
              />
            </div>
          </div>

          {/* Actuals Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-light-muted uppercase tracking-wider">Actuals (This Period)</h3>
            <div>
              <label className="text-sm text-light-muted block mb-1">Approaches Made</label>
              <input
                type="number"
                value={benchmark.approaches_actual}
                onChange={(e) => setBenchmark({ ...benchmark, approaches_actual: parseInt(e.target.value) || 0 })}
                className="w-full bg-navy border border-teal/20 text-light rounded-lg px-3 py-2 text-sm focus:border-teal outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-light-muted block mb-1">Discovery Calls Made</label>
              <input
                type="number"
                value={benchmark.discovery_calls_actual}
                onChange={(e) => setBenchmark({ ...benchmark, discovery_calls_actual: parseInt(e.target.value) || 0 })}
                className="w-full bg-navy border border-teal/20 text-light rounded-lg px-3 py-2 text-sm focus:border-teal outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-light-muted block mb-1">Conversions Closed</label>
              <input
                type="number"
                value={benchmark.conversions_actual}
                onChange={(e) => setBenchmark({ ...benchmark, conversions_actual: parseInt(e.target.value) || 0 })}
                className="w-full bg-navy border border-teal/20 text-light rounded-lg px-3 py-2 text-sm focus:border-teal outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 bg-gradient-to-r from-teal to-aqua text-navy font-bold py-2.5 px-8 rounded-lg hover:shadow-glow-teal transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Benchmarks'}
        </button>
      </div>
    </div>
  )
}
