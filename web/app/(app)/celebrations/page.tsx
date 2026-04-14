'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HiSparkles, HiStar, HiFire, HiLightningBolt, HiTrendingUp } from 'react-icons/hi'

interface Celebration {
  id: string
  rep_email: string | null
  type: string
  title: string
  description: string | null
  badge_key: string | null
  created_at: string
}

const badgeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  first_call: { icon: HiSparkles, color: 'bg-teal/20 text-teal border-teal/30' },
  pain_funnel_pro: { icon: HiFire, color: 'bg-pink/20 text-pink border-pink/30' },
  consistent_closer: { icon: HiTrendingUp, color: 'bg-gold/20 text-gold border-gold/30' },
  perfect_score: { icon: HiStar, color: 'bg-gold/20 text-gold border-gold/30' },
  streak_builder: { icon: HiLightningBolt, color: 'bg-aqua/20 text-aqua border-aqua/30' },
}

export default function CelebrationsPage() {
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadCelebrations()
  }, [])

  async function loadCelebrations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('Celebrations')
      .select('*')
      .eq('account_id', userData.account_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setCelebrations(data)
    setLoading(false)
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
    return <div className="text-light-muted">Loading celebrations...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-light mb-2">Celebrations</h1>
      <p className="text-light-muted mb-8">Team victories, badges, and milestones.</p>

      {celebrations.length === 0 ? (
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-8 text-center">
          <HiSparkles className="text-gold text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-light mb-2">No celebrations yet</h2>
          <p className="text-light-muted text-sm">
            Badges and achievements will appear here as your team analyzes calls and improves.
          </p>

          {/* Badge Catalog */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-light mb-4">Available Badges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
              {[
                { key: 'first_call', title: 'First Call Analyzed', desc: 'Have your first call analyzed by the system' },
                { key: 'pain_funnel_pro', title: 'Pain Funnel Pro', desc: 'Score 8+ on Pain three times' },
                { key: 'consistent_closer', title: 'Consistent Closer', desc: 'Score 7+ overall on 5 consecutive calls' },
                { key: 'perfect_score', title: 'Perfect Score', desc: 'Score 10/10 on any Sandler component' },
                { key: 'streak_builder', title: 'Streak Builder', desc: 'Improve scores on 3 consecutive calls' },
              ].map((badge) => {
                const config = badgeConfig[badge.key] || { icon: HiSparkles, color: 'bg-teal/20 text-teal border-teal/30' }
                const Icon = config.icon
                return (
                  <div
                    key={badge.key}
                    className="flex items-center gap-3 p-3 bg-navy rounded-lg border border-navy-light/50"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${config.color}`}>
                      <Icon className="text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-light">{badge.title}</p>
                      <p className="text-xs text-light-muted">{badge.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {celebrations.map((celebration) => {
            const config = celebration.badge_key
              ? badgeConfig[celebration.badge_key] || { icon: HiSparkles, color: 'bg-teal/20 text-teal border-teal/30' }
              : { icon: HiSparkles, color: 'bg-teal/20 text-teal border-teal/30' }
            const Icon = config.icon

            return (
              <div
                key={celebration.id}
                className="flex items-center gap-4 p-4 bg-navy-light rounded-2xl border border-teal/10"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${config.color}`}>
                  <Icon className="text-2xl" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-light">{celebration.title}</p>
                  {celebration.description && (
                    <p className="text-sm text-light-muted mt-0.5">{celebration.description}</p>
                  )}
                  <p className="text-xs text-light-muted mt-1">
                    {celebration.rep_email && <span>{celebration.rep_email} · </span>}
                    {getTimeAgo(celebration.created_at)}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-gold/10 text-gold border-gold/20 capitalize">
                  {celebration.type}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
