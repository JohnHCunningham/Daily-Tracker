'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HiSparkles, HiStar, HiFire, HiLightningBolt, HiTrendingUp, HiHeart } from 'react-icons/hi'

interface Celebration {
  id: string
  rep_email: string | null
  type: string
  title: string
  description: string | null
  badge_key: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}

interface LeaderboardEntry {
  rep_email: string
  rep_name: string
  count: number
}

const badgeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  first_call: { icon: HiSparkles, color: 'bg-terracotta/20 text-terracotta border-terracotta/30' },
  pain_funnel_pro: { icon: HiFire, color: 'bg-pink/20 text-terracotta border-pink/30' },
  consistent_closer: { icon: HiTrendingUp, color: 'bg-clay/20 text-clay border-clay/30' },
  perfect_score: { icon: HiStar, color: 'bg-clay/20 text-clay border-clay/30' },
  streak_builder: { icon: HiLightningBolt, color: 'bg-terracotta-bright/20 text-terracotta-bright border-aqua/30' },
  score_champion: { icon: HiStar, color: 'bg-terracotta/20 text-terracotta border-terracotta/30' },
  quota_hit: { icon: HiTrendingUp, color: 'bg-clay/20 text-clay border-clay/30' },
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'milestone', label: 'Milestones' },
  { key: 'streak', label: 'Streaks' },
  { key: 'badge', label: 'Badges' },
]

export default function CelebrationsPage() {
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [celebratedIds, setCelebratedIds] = useState<Set<string>>(new Set())
  const [userEmail, setUserEmail] = useState('')
  const [accountId, setAccountId] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadCelebrations()
  }, [])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (accountId) refreshCelebrations()
    }, 60000)
    return () => clearInterval(interval)
  }, [accountId])

  async function loadCelebrations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id, email')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      setLoading(false)
      return
    }

    setUserEmail(userData.email)
    setAccountId(userData.account_id)

    await fetchCelebrations(userData.account_id)

    // Build leaderboard
    await buildLeaderboard(userData.account_id)

    setLoading(false)
  }

  async function fetchCelebrations(accId: string) {
    const { data } = await supabase
      .from('Celebrations')
      .select('*')
      .eq('account_id', accId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setCelebrations(data)
  }

  async function refreshCelebrations() {
    await fetchCelebrations(accountId)
  }

  async function buildLeaderboard(accId: string) {
    const { data } = await supabase
      .from('Celebrations')
      .select('rep_email')
      .eq('account_id', accId)

    if (!data) return

    // Load user names
    const { data: users } = await supabase
      .from('Users')
      .select('email, full_name')
      .eq('account_id', accId)

    const nameMap: Record<string, string> = {}
    if (users) {
      users.forEach((u) => { nameMap[u.email] = u.full_name || u.email })
    }

    const counts: Record<string, number> = {}
    data.forEach((c) => {
      if (c.rep_email) {
        counts[c.rep_email] = (counts[c.rep_email] || 0) + 1
      }
    })

    const sorted = Object.entries(counts)
      .map(([email, count]) => ({
        rep_email: email,
        rep_name: nameMap[email] || email,
        count,
      }))
      .sort((a, b) => b.count - a.count)

    setLeaderboard(sorted)
  }

  async function handleCelebrate(celebrationId: string) {
    if (celebratedIds.has(celebrationId)) return

    // Use Win_Celebrations pattern: try to find a matching Team_Wins entry, or just track locally
    setCelebratedIds((prev) => new Set(prev).add(celebrationId))
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

  const filteredCelebrations = activeTab === 'all'
    ? celebrations
    : celebrations.filter((c) => c.type === activeTab)

  if (loading) {
    return <div className="text-stone-light">Loading celebrations...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-espresso mb-2">Celebrations</h1>
      <p className="text-stone-light mb-8">Team victories, badges, and milestones.</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaderboard Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-espresso mb-4">Leaderboard</h2>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, i) => (
                  <div key={entry.rep_email} className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-clay/20 text-gold' : i === 1 ? 'bg-light/10 text-stone-light' : i === 2 ? 'bg-pink/10 text-pink' : 'bg-bone text-stone-light'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-espresso truncate">{entry.rep_name}</p>
                    </div>
                    <span className="text-sm font-bold text-terracotta">{entry.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-light text-sm">Leaderboard appears after achievements are earned.</p>
            )}
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-terracotta/10 text-terracotta border border-terracotta/20'
                    : 'text-stone-light hover:text-espresso hover:bg-white border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredCelebrations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-8 text-center">
              <HiSparkles className="text-clay text-4xl mx-auto mb-4" />
              <h2 className="text-xl font-bold text-espresso mb-2">
                {activeTab === 'all' ? 'No celebrations yet' : `No ${activeTab}s yet`}
              </h2>
              <p className="text-stone-light text-sm">
                Badges and achievements will appear here as your team analyzes calls and improves.
              </p>

              {activeTab === 'all' && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-espresso mb-4">Available Badges</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                    {[
                      { key: 'first_call', title: 'First Call Analyzed', desc: 'Have your first call analyzed by the system' },
                      { key: 'pain_funnel_pro', title: 'Pain Funnel Pro', desc: 'Score 8+ on Pain three times' },
                      { key: 'consistent_closer', title: 'Consistent Closer', desc: 'Score 7+ overall on 5 consecutive calls' },
                      { key: 'perfect_score', title: 'Perfect Score', desc: 'Score 10/10 on any Sandler component' },
                      { key: 'streak_builder', title: 'Streak Builder', desc: 'Improve scores on 3 consecutive calls' },
                      { key: 'score_champion', title: 'Score Champion', desc: 'Achieve an average Sandler score of 8+' },
                      { key: 'quota_hit', title: 'Quota Crusher', desc: 'Hit or exceed a target goal' },
                    ].map((badge) => {
                      const config = badgeConfig[badge.key] || { icon: HiSparkles, color: 'bg-terracotta/20 text-terracotta border-terracotta/30' }
                      const Icon = config.icon
                      return (
                        <div
                          key={badge.key}
                          className="flex items-center gap-3 p-3 bg-bone rounded-lg border border-bone-dark/50"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${config.color}`}>
                            <Icon className="text-lg" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-espresso">{badge.title}</p>
                            <p className="text-xs text-stone-light">{badge.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCelebrations.map((celebration) => {
                const config = celebration.badge_key
                  ? badgeConfig[celebration.badge_key] || { icon: HiSparkles, color: 'bg-terracotta/20 text-terracotta border-terracotta/30' }
                  : { icon: HiSparkles, color: 'bg-terracotta/20 text-terracotta border-terracotta/30' }
                const Icon = config.icon
                const isCelebrated = celebratedIds.has(celebration.id)

                return (
                  <div
                    key={celebration.id}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-bone-dark"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${config.color}`}>
                      <Icon className="text-2xl" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-espresso">{celebration.title}</p>
                      {celebration.description && (
                        <p className="text-sm text-stone-light mt-0.5">{celebration.description}</p>
                      )}
                      <p className="text-xs text-stone-light mt-1">
                        {celebration.rep_email && <span>{celebration.rep_email} · </span>}
                        {getTimeAgo(celebration.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleCelebrate(celebration.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isCelebrated
                            ? 'bg-pink/20 text-terracotta border border-pink/30'
                            : 'bg-bone text-stone-light hover:text-terracotta hover:bg-pink/10 border border-bone-dark/50'
                        }`}
                      >
                        <HiHeart className={isCelebrated ? 'text-pink' : ''} />
                        {isCelebrated ? 'Celebrated' : 'Celebrate'}
                      </button>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-clay/10 text-clay border-clay/30 capitalize">
                        {celebration.type}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
