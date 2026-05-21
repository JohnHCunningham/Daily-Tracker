'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiUserGroup, HiPhone, HiAcademicCap, HiRefresh, HiExclamationCircle, HiCheckCircle, HiSparkles, HiChatAlt2, HiMail, HiClipboardCheck } from 'react-icons/hi'
import dynamic from 'next/dynamic'
import SandlerBreakdown from '../components/SandlerBreakdown'
import { getCelebrationBadgeConfig } from '@/lib/celebrations'
import ManagerOnboardingMap, { type OnboardingStep } from '../components/ManagerOnboardingMap'

const ScoreRadial = dynamic(() => import('../components/ScoreRadial'), { ssr: false })
const ScoreTrendChart = dynamic(() => import('../components/ScoreTrendChart'), { ssr: false })
const ActivityFunnel = dynamic(() => import('../components/ActivityFunnel'), { ssr: false })
const CoachingFeed = dynamic(() => import('../components/CoachingFeed'), { ssr: false })

interface UserInfo {
  role: string
  full_name: string
  email: string
  account_id: string
}

interface TeamMemberInfo {
  id: string
  full_name: string
  email: string
  role: string
}

interface OnboardingContext {
  company_name: string | null
  unique_customer_profile: string | null
  competitor_context: string | null
  subscription_status: string | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  created_at?: string
}

interface IntegrationConnection {
  provider: string
  connection_status: string
}

interface RecentCall {
  call_date: string
  methodology_scores: Record<string, number> | null
  rep_email: string | null
}

interface RepGoalProgress {
  approachesPercent: number
  discoveryPercent: number
  proposalsPercent: number
  salesPercent: number
  sandlerScore: number | null
}

interface CoachingPreview {
  id: string
  rep_email: string
  status: string
  created_at: string
  subject: string | null
  coaching_content: string | null
}

interface NeedsAttention {
  repName: string
  component: string
  score: number
}

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

interface PipelineStage {
  stage: string
  actual: number
  target: number
}

interface CelebrationPreview {
  id: string
  title: string
  badge_key: string | null
  rep_email: string | null
  created_at: string
}

interface DirectMessagePreview {
  unreadCount: number
  lastMessage: string | null
  lastSender: string | null
}

interface PendingInvitationPreview {
  id: string
  email: string
  role: string
  token: string
  expires_at: string
}

interface DashboardNotifications {
  role: string
  coachingUnread: number
  coachingRead: number
  coachingReplied: number
  notesUnread: number
  celebrationsRecent: number
  latestCelebrationTitle: string | null
  latestCelebrationBadgeKey: string | null
  latestCoachName: string | null
  latestNoteSenderName: string | null
  latestNoteSenderEmail: string | null
}

interface CommitmentItem {
  id: string
  commitment_text: string
  rep_email: string
  status: string
  completed_at: string | null
}

interface BillingSnapshot {
  status: string
  amountPaid: number
  amountDue: number
  currency: string
  createdAt: string
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  number: string | null
}

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Leader state
  const [teamMembersInfo, setTeamMembersInfo] = useState<TeamMemberInfo[]>([])
  const [repGoalMap, setRepGoalMap] = useState<Record<string, RepGoalProgress>>({})
  const [teamAvgScore, setTeamAvgScore] = useState<number | null>(null)
  const [totalCalls, setTotalCalls] = useState(0)
  const [recentCoaching, setRecentCoaching] = useState<CoachingPreview[]>([])
  const [needsAttention, setNeedsAttention] = useState<NeedsAttention[]>([])
  const [trendLabels, setTrendLabels] = useState<string[]>([])
  const [trendScores, setTrendScores] = useState<number[]>([])
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([])
  const [teamSandlerScores, setTeamSandlerScores] = useState<Record<string, number> | null>(null)
  const [recentCelebrations, setRecentCelebrations] = useState<CelebrationPreview[]>([])
  const [billingSnapshot, setBillingSnapshot] = useState<BillingSnapshot | null>(null)
  const [onboardingContext, setOnboardingContext] = useState<OnboardingContext | null>(null)
  const [integrationConnections, setIntegrationConnections] = useState<IntegrationConnection[]>([])
  const [leaderGoalCount, setLeaderGoalCount] = useState(0)

  // Commitments state (shared)
  const [openCommitments, setOpenCommitments] = useState<CommitmentItem[]>([])

  // Rep state
  const [repScores, setRepScores] = useState<Record<string, number> | null>(null)
  const [repOverallScore, setRepOverallScore] = useState<number | null>(null)
  const [repCallCount, setRepCallCount] = useState(0)
  const [repPipeline, setRepPipeline] = useState<{ callsPercent: number; discoveryPercent: number; proposalsPercent: number; salesPercent: number } | null>(null)
  const [repCoachingMessages, setRepCoachingMessages] = useState<CoachingPreview[]>([])
  const [repNotesPreview, setRepNotesPreview] = useState<DirectMessagePreview>({ unreadCount: 0, lastMessage: null, lastSender: null })
  const [repInvitation, setRepInvitation] = useState<PendingInvitationPreview | null>(null)
  const [notifications, setNotifications] = useState<DashboardNotifications | null>(null)

  const supabase = createClient()

  function getProgressPercent(current: number, target: number): number {
    if (target === 0) return 0
    return Math.min(Math.round((current / target) * 100), 100)
  }

  const loadCelebrations = useCallback(async (accountId: string) => {
    const { data } = await supabase
      .from('Celebrations')
      .select('id, title, badge_key, rep_email, created_at')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(2)

    if (data) setRecentCelebrations(data)
  }, [supabase])

  const loadNotifications = useCallback(async () => {
    const response = await fetch('/api/dashboard-notifications')
    const data = await response.json().catch(() => null)

    if (response.ok && data) {
      setNotifications(data)
    }
  }, [])

  const loadBillingSnapshot = useCallback(async () => {
    const response = await fetch('/api/stripe/billing-history')
    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.success) {
      setBillingSnapshot(null)
      return
    }

    const latestInvoice = data.invoices?.[0] || null
    if (!latestInvoice) {
      setBillingSnapshot(null)
      return
    }

    setBillingSnapshot({
      status: latestInvoice.status,
      amountPaid: latestInvoice.amountPaid,
      amountDue: latestInvoice.amountDue,
      currency: latestInvoice.currency,
      createdAt: latestInvoice.createdAt,
      hostedInvoiceUrl: latestInvoice.hostedInvoiceUrl,
      invoicePdf: latestInvoice.invoicePdf,
      number: latestInvoice.number,
    })
  }, [])

  const loadCommitments = useCallback(async (accountId: string, email?: string) => {
    let query = supabase
      .from('Coaching_Commitments')
      .select('id, commitment_text, rep_email, status, completed_at')
      .eq('account_id', accountId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10)

    if (email) {
      query = query.eq('rep_email', email)
    }

    const { data } = await query
    if (data) setOpenCommitments(data)
  }, [supabase])

  async function handleCompleteCommitment(commitmentId: string) {
    const { error } = await supabase
      .from('Coaching_Commitments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', commitmentId)

    if (!error) {
      setOpenCommitments((prev) => prev.filter((c) => c.id !== commitmentId))
    }
  }

  const loadLeaderDashboard = useCallback(async (accountId: string) => {
    const { data: account } = await supabase
      .from('Accounts')
      .select('company_name, unique_customer_profile, competitor_context, subscription_status, stripe_subscription_id, stripe_customer_id, created_at')
      .eq('id', accountId)
      .single()

    if (account) {
      setOnboardingContext({
        company_name: account.company_name,
        unique_customer_profile: account.unique_customer_profile,
        competitor_context: account.competitor_context,
        subscription_status: account.subscription_status,
        stripe_subscription_id: account.stripe_subscription_id,
        stripe_customer_id: account.stripe_customer_id,
        created_at: account.created_at,
      })
    } else {
      setOnboardingContext(null)
    }

    const { data: connections } = await supabase
      .from('API_Connections')
      .select('provider, connection_status')
      .eq('account_id', accountId)

    setIntegrationConnections((connections || []) as IntegrationConnection[])

    const { count: goalCount } = await supabase
      .from('Goals')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)

    setLeaderGoalCount(goalCount || 0)

    // Calls with scores
    const { data: recentCallsData } = await supabase
      .from('Synced_Conversations')
      .select('call_date, methodology_scores, rep_email')
      .eq('account_id', accountId)
      .not('methodology_scores', 'is', null)
      .order('call_date', { ascending: true })
      .limit(50)
    const recentCalls = (recentCallsData || []) as RecentCall[]

    // Team members
    const { data: members } = await supabase
      .from('Users')
      .select('id, full_name, email, role')
      .eq('account_id', accountId)

    // Recent coaching
    const { data: coaching } = await supabase
      .from('Coaching_Messages')
      .select('id, rep_email, status, created_at, subject, coaching_content')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (coaching) setRecentCoaching(coaching)

    // Goals for current month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: goalsData } = await supabase
      .from('Goals')
      .select('*')
      .eq('account_id', accountId)
      .gte('period_end', monthStart)
      .lte('period_start', monthEnd)

    // Try loading pipeline stats via RPC
    let hasRpcPipeline = false
    try {
      const { data: pipelineStats } = await supabase.rpc('get_pipeline_stats', {
        p_account_id: accountId,
        p_start_date: monthStart,
        p_end_date: monthEnd,
      })

      if (pipelineStats && pipelineStats.length > 0) {
        // Aggregate across all reps
        const stageAgg: Record<string, { actual: number; target: number }> = {}
        pipelineStats.forEach((row: { stage: string; actual_count: number; target: number }) => {
          if (!stageAgg[row.stage]) stageAgg[row.stage] = { actual: 0, target: 0 }
          stageAgg[row.stage].actual += Number(row.actual_count)
          stageAgg[row.stage].target += Number(row.target)
        })

        const stageOrder = ['calls', 'discovery', 'proposals', 'sales']
        const stageLabels: Record<string, string> = { calls: 'Calls', discovery: 'Discovery', proposals: 'Proposals', sales: 'Sales' }
        const funnel: PipelineStage[] = stageOrder
          .filter((s) => stageAgg[s])
          .map((s) => ({ stage: stageLabels[s], actual: stageAgg[s].actual, target: stageAgg[s].target }))

        setPipelineData(funnel)
        hasRpcPipeline = true
      }
    } catch {
      // RPC may not exist yet if migration hasn't run — fall back to goals-based pipeline
    }

    // Build rep goal progress map (expanded with proposals + sales)
    if (goalsData && members) {
      const goalMap: Record<string, RepGoalProgress> = {}

      // Also build pipeline fallback from goals if RPC unavailable
      let fallbackPipeline: PipelineStage[] = []
      const teamGoalAgg: Record<string, { current: number; target: number }> = {
        contacts: { current: 0, target: 0 },
        discovery_calls: { current: 0, target: 0 },
        proposals: { current: 0, target: 0 },
        sales: { current: 0, target: 0 },
      }

      members.forEach((m: TeamMemberInfo) => {
        const repGoals = goalsData.filter(
          (g: Goal) => g.rep_email === m.email || g.rep_email === null
        )

        const approaches = repGoals.filter((g: Goal) => g.goal_type === 'contacts')
        const discovery = repGoals.filter((g: Goal) => g.goal_type === 'discovery_calls')
        const proposals = repGoals.filter((g: Goal) => g.goal_type === 'proposals')
        const sales = repGoals.filter((g: Goal) => g.goal_type === 'sales')

        const aTarget = approaches.reduce((s: number, g: Goal) => s + g.target_value, 0)
        const aCurrent = approaches.reduce((s: number, g: Goal) => s + g.current_value, 0)
        const dTarget = discovery.reduce((s: number, g: Goal) => s + g.target_value, 0)
        const dCurrent = discovery.reduce((s: number, g: Goal) => s + g.current_value, 0)
        const pTarget = proposals.reduce((s: number, g: Goal) => s + g.target_value, 0)
        const pCurrent = proposals.reduce((s: number, g: Goal) => s + g.current_value, 0)
        const sTarget = sales.reduce((s: number, g: Goal) => s + g.target_value, 0)
        const sCurrent = sales.reduce((s: number, g: Goal) => s + g.current_value, 0)

        if (m.role === 'rep') {
          teamGoalAgg.contacts.current += aCurrent
          teamGoalAgg.contacts.target += aTarget
          teamGoalAgg.discovery_calls.current += dCurrent
          teamGoalAgg.discovery_calls.target += dTarget
          teamGoalAgg.proposals.current += pCurrent
          teamGoalAgg.proposals.target += pTarget
          teamGoalAgg.sales.current += sCurrent
          teamGoalAgg.sales.target += sTarget
        }

        // Per-rep Sandler score from calls
        let repSandler: number | null = null
        if (recentCalls) {
          const repCalls = recentCalls.filter((c) => c.rep_email === m.email && c.methodology_scores)
          if (repCalls.length > 0) {
            const allAvgs = repCalls.map((c) => {
              const vals = Object.values(c.methodology_scores!) as number[]
              return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
            })
            repSandler = Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length * 10) / 10
          }
        }

        goalMap[m.email] = {
          approachesPercent: getProgressPercent(aCurrent, aTarget),
          discoveryPercent: getProgressPercent(dCurrent, dTarget),
          proposalsPercent: getProgressPercent(pCurrent, pTarget),
          salesPercent: getProgressPercent(sCurrent, sTarget),
          sandlerScore: repSandler,
        }
      })

      setRepGoalMap(goalMap)

      // Fallback pipeline if RPC didn't load
      if (!hasRpcPipeline) {
        fallbackPipeline = [
          { stage: 'Calls', actual: teamGoalAgg.contacts.current, target: teamGoalAgg.contacts.target },
          { stage: 'Discovery', actual: teamGoalAgg.discovery_calls.current, target: teamGoalAgg.discovery_calls.target },
          { stage: 'Proposals', actual: teamGoalAgg.proposals.current, target: teamGoalAgg.proposals.target },
          { stage: 'Sales', actual: teamGoalAgg.sales.current, target: teamGoalAgg.sales.target },
        ]
        setPipelineData(fallbackPipeline)
      }
    }

    if (members) {
      setTeamMembersInfo(members)
    }

    if (recentCalls && recentCalls.length > 0) {
      setTotalCalls(recentCalls.length)

      const repAgg: Record<string, { sum: number; count: number }> = {}
      const attention: NeedsAttention[] = []
      const componentAgg: Record<string, { sum: number; count: number }> = {}

      recentCalls.forEach((call) => {
        if (!call.methodology_scores) return
        const vals = Object.values(call.methodology_scores) as number[]
        if (vals.length === 0) return
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length
        const rep = call.rep_email || 'unknown'

        if (!repAgg[rep]) repAgg[rep] = { sum: 0, count: 0 }
        repAgg[rep].sum += avg
        repAgg[rep].count += 1

        // Aggregate per component for team Sandler breakdown
        Object.entries(call.methodology_scores).forEach(([comp, score]) => {
          if (!componentAgg[comp]) componentAgg[comp] = { sum: 0, count: 0 }
          componentAgg[comp].sum += score as number
          componentAgg[comp].count += 1

          if ((score as number) < 4) {
            const exists = attention.find((a) => a.repName === rep && a.component === comp)
            if (!exists) {
              attention.push({ repName: rep, component: comp, score: score as number })
            }
          }
        })
      })

      const allAvgs = Object.values(repAgg).map((r) => r.sum / r.count)
      if (allAvgs.length > 0) {
        setTeamAvgScore(Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length * 10) / 10)
      }

      // Team Sandler breakdown
      const teamScores: Record<string, number> = {}
      Object.entries(componentAgg).forEach(([comp, { sum, count }]) => {
        teamScores[comp] = Math.round((sum / count) * 10) / 10
      })
      setTeamSandlerScores(teamScores)

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
  }, [supabase])

  const loadRepDashboard = useCallback(async (accountId: string, email: string, userId: string) => {
    const { data: scoresData } = await supabase
      .from('Synced_Conversations')
      .select('call_date, methodology_scores, rep_email')
      .eq('account_id', accountId)
      .eq('rep_email', email)
      .not('methodology_scores', 'is', null)
      .order('call_date', { ascending: true })
      .limit(20)
    const scores = (scoresData || []) as RecentCall[]

    // Goals for current month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: goalsData } = await supabase
      .from('Goals')
      .select('*')
      .eq('account_id', accountId)
      .gte('period_end', monthStart)
      .lte('period_start', monthEnd)

    if (goalsData) {
      const myGoals = goalsData.filter((g: Goal) => g.rep_email === email || g.rep_email === null)

      const approaches = myGoals.filter((g: Goal) => g.goal_type === 'contacts')
      const discovery = myGoals.filter((g: Goal) => g.goal_type === 'discovery_calls')
      const proposals = myGoals.filter((g: Goal) => g.goal_type === 'proposals')
      const sales = myGoals.filter((g: Goal) => g.goal_type === 'sales')

      const aTarget = approaches.reduce((s: number, g: Goal) => s + g.target_value, 0)
      const aCurrent = approaches.reduce((s: number, g: Goal) => s + g.current_value, 0)
      const dTarget = discovery.reduce((s: number, g: Goal) => s + g.target_value, 0)
      const dCurrent = discovery.reduce((s: number, g: Goal) => s + g.current_value, 0)
      const pTarget = proposals.reduce((s: number, g: Goal) => s + g.target_value, 0)
      const pCurrent = proposals.reduce((s: number, g: Goal) => s + g.current_value, 0)
      const sTarget = sales.reduce((s: number, g: Goal) => s + g.target_value, 0)
      const sCurrent = sales.reduce((s: number, g: Goal) => s + g.current_value, 0)

      setRepPipeline({
        callsPercent: getProgressPercent(aCurrent, aTarget),
        discoveryPercent: getProgressPercent(dCurrent, dTarget),
        proposalsPercent: getProgressPercent(pCurrent, pTarget),
        salesPercent: getProgressPercent(sCurrent, sTarget),
      })
    }

    // Coaching messages sent to this rep
    const { data: coachingData } = await supabase
      .from('Coaching_Messages')
      .select('id, rep_email, status, created_at, subject, coaching_content')
      .eq('account_id', accountId)
      .eq('rep_email', email)
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(3)

    if (coachingData) setRepCoachingMessages(coachingData)

    const { data: invitationData } = await supabase
      .from('Invitations')
      .select('id, email, role, token, expires_at')
      .eq('account_id', accountId)
      .eq('email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (invitationData) {
      setRepInvitation(invitationData)
    } else {
      setRepInvitation(null)
    }

    // 1-on-1 notes preview
    try {
      const { data: unreadData } = await supabase
        .from('Direct_Messages')
        .select('id', { count: 'exact' })
        .eq('account_id', accountId)
        .eq('recipient_email', email)
        .eq('is_read', false)

      const { data: lastMsg } = await supabase
        .from('Direct_Messages')
        .select('message_text, sender_email')
        .eq('account_id', accountId)
        .or(`sender_email.eq.${email},recipient_email.eq.${email}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setRepNotesPreview({
        unreadCount: unreadData?.length ?? 0,
        lastMessage: lastMsg?.message_text ?? null,
        lastSender: lastMsg?.sender_email ?? null,
      })
    } catch {
      // Direct_Messages table may not exist yet
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
  }, [supabase])

  const loadDashboard = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('role, full_name, email, account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      setLoading(false)
      return
    }
    setUserInfo(userData)
    await loadNotifications()

    if (['admin', 'manager', 'coach'].includes(userData.role)) {
      await loadLeaderDashboard(userData.account_id)
      if (['admin', 'manager'].includes(userData.role)) {
        await loadBillingSnapshot()
      } else {
        setBillingSnapshot(null)
      }
      await loadCommitments(userData.account_id)
    } else {
      setBillingSnapshot(null)
      await loadRepDashboard(userData.account_id, userData.email, user.id)
      await loadCommitments(userData.account_id, userData.email)
    }

    await loadCelebrations(userData.account_id)

    setLoading(false)
  }, [
    supabase,
    loadNotifications,
    loadBillingSnapshot,
    loadLeaderDashboard,
    loadCommitments,
    loadRepDashboard,
    loadCelebrations,
  ])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  async function handleSyncNow() {
    setSyncing(true)
    try {
      await Promise.allSettled([
        supabase.functions.invoke('hubspot-sync'),
        supabase.functions.invoke('fathom-sync'),
      ])
      await loadDashboard()
    } finally {
      setSyncing(false)
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!userInfo) {
    return <div className="text-stone-light">Unable to load user data.</div>
  }

  const isLeader = ['admin', 'manager', 'coach'].includes(userInfo.role)

  // ─── LEADER DASHBOARD ───
  if (isLeader) {
    const repMembers = teamMembersInfo.filter((m) => m.role === 'rep')
    const latestBillingStatus = billingSnapshot?.status || null
    const latestBillingDate = billingSnapshot?.createdAt
      ? new Date(billingSnapshot.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null
    const latestBillingLabel = billingSnapshot?.number ? `Invoice #${billingSnapshot.number}` : 'Latest invoice'
    const billingNeedsAttention = ['open', 'past_due', 'uncollectible', 'void'].includes(latestBillingStatus || '')
    const billingCurrency = (billingSnapshot?.currency || 'usd').toUpperCase()
    const billingComplete = Boolean(
      onboardingContext?.stripe_subscription_id &&
      ['active', 'trialing'].includes(onboardingContext.subscription_status || '')
    )
    const companyContextComplete = Boolean(onboardingContext?.unique_customer_profile?.trim())
    const competitorContextComplete = Boolean(onboardingContext?.competitor_context?.trim())
    const goalsComplete = leaderGoalCount > 0
    const repsComplete = repMembers.length > 0
    const integrationsComplete = integrationConnections.some((connection) => connection.connection_status === 'active')

    const onboardingSteps: OnboardingStep[] = [
      {
        key: 'billing',
        title: 'Billing',
        description: 'Choose monthly or annual billing and activate the account.',
        href: '/settings#billing',
        cta: 'Open Billing',
        complete: billingComplete,
      },
      {
        key: 'company-context',
        title: 'Company context',
        description: 'Define the unique customer, pain points, and buying context.',
        href: '/settings#company-context',
        cta: 'Add Context',
        complete: companyContextComplete,
      },
      {
        key: 'goals',
        title: 'Goals and targets',
        description: 'Set rep targets for activity, discovery, sales, and quota.',
        href: '/goals',
        cta: 'Set Goals',
        complete: goalsComplete,
      },
      {
        key: 'competitors',
        title: 'Competitors',
        description: 'Capture the 3 to 4 rivals the team sees most often.',
        href: '/settings#company-context',
        cta: 'Add Competitors',
        complete: competitorContextComplete,
      },
      {
        key: 'reps',
        title: 'Invite reps',
        description: 'Add the first rep so coaching and notes have somewhere to land.',
        href: '/team',
        cta: 'Invite Rep',
        complete: repsComplete,
      },
      {
        key: 'integrations',
        title: 'Integrations',
        description: 'Connect HubSpot or Fathom once the team structure is in place.',
        href: '/integrations',
        cta: 'Connect Tools',
        complete: integrationsComplete,
      },
    ]

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-terracotta/10">
          <div>
            <h1 className="text-2xl font-bold text-espresso">
              Good morning, {userInfo.full_name || userInfo.email?.split('@')[0] || 'Manager'}
            </h1>
            <p className="text-stone text-sm mt-1">Here is your team at a glance.</p>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center gap-2 bg-gradient-to-r from-terracotta/10 to-terracotta/5 text-terracotta border border-terracotta/30 px-4 py-2 rounded-lg hover:bg-terracotta/20 hover:border-terracotta/50 transition-all text-sm font-medium disabled:opacity-50 shadow-sm"
          >
            <HiRefresh className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Trial Expiration Warning */}
        {onboardingContext?.subscription_status === 'trialing' && onboardingContext.created_at && (() => {
          const trialEnd = new Date(onboardingContext.created_at)
          trialEnd.setDate(trialEnd.getDate() + 14)
          const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          
          if (daysLeft <= 7 && daysLeft >= 0) {
            return (
              <div className="mb-8 rounded-2xl border border-gold/30 bg-gradient-to-r from-white to-gold/10 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <HiExclamationCircle className="text-gold text-3xl flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-espresso">
                      {daysLeft === 0 ? 'Trial ends today' : `Trial ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
                    </h2>
                    <p className="text-sm text-stone mt-1">
                      Your 14-day trial expires on {trialEnd.toLocaleDateString()}. Add billing details to continue uninterrupted access.
                    </p>
                  </div>
                  <Link
                    href="/settings#billing"
                    className="bg-gold text-white font-semibold px-4 py-2 rounded-lg hover:bg-gold-bright transition-colors text-sm whitespace-nowrap"
                  >
                    Add Payment
                  </Link>
                </div>
              </div>
            )
          }
          return null
        })()}

        {billingSnapshot && (
          <div className={`mb-8 rounded-2xl border p-5 shadow-sm ${
            billingNeedsAttention
              ? 'border-pink/20 bg-gradient-to-r from-white to-pink/5'
              : 'border-bone-dark bg-gradient-to-r from-white to-bone/30'
          }`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${
                  billingNeedsAttention ? 'text-terracotta' : 'text-stone-light'
                }`}>
                  {billingNeedsAttention ? 'Billing needs attention' : 'Billing status'}
                </p>
                <h2 className="text-lg font-bold text-espresso mt-1">
                  {billingNeedsAttention
                    ? 'Review the latest invoice'
                    : 'Billing is current'}
                </h2>
                <p className="text-sm text-stone-light mt-1">
                  {latestBillingLabel}
                  {latestBillingDate ? ` · ${latestBillingDate}` : ''}
                  {latestBillingStatus === 'paid'
                    ? billingSnapshot.amountPaid > 0
                      ? ` · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: billingCurrency }).format(billingSnapshot.amountPaid / 100)} paid`
                      : ' · Paid'
                    : billingSnapshot.amountDue > 0
                      ? ` · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: billingCurrency }).format(billingSnapshot.amountDue / 100)} due`
                      : '' }
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/settings#billing-history"
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    billingNeedsAttention
                      ? 'bg-terracotta text-white hover:bg-terracotta-bright'
                      : 'border border-terracotta/30 bg-white text-terracotta hover:bg-terracotta/5'
                  }`}
                >
                  View Billing History
                </Link>
                <Link
                  href="/settings#billing"
                  className="inline-flex items-center justify-center rounded-lg border border-bone-dark bg-white px-4 py-2.5 text-sm font-semibold text-espresso hover:bg-bone-light transition-colors"
                >
                  Manage Billing
                </Link>
              </div>
            </div>
            {billingNeedsAttention && (
              <p className="mt-3 text-xs text-stone-light">
                Payment issues do not close the account immediately. You get a grace window before access is soft-locked.
              </p>
            )}
          </div>
        )}\n\n        {isLeader && <ManagerOnboardingMap steps={onboardingSteps} />}\n
        {/* Pipeline Funnel */}
        {pipelineData.length > 0 && (
          <div className="bg-white rounded-2xl border-t-4 border-t-terracotta border-l border-r border-b border-bone-dark/50 p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-bold text-espresso mb-4 pb-2 border-b-2 border-terracotta/20">Pipeline Funnel</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {pipelineData.map((stage) => (
                <div key={stage.stage} className="text-center">
                  <p className="text-xs text-stone-light uppercase tracking-wider mb-1">{stage.stage}</p>
                  <p className="text-lg font-bold text-espresso">
                    {stage.actual}<span className="text-stone font-normal">/{stage.target}</span>
                  </p>
                </div>
              ))}
            </div>
            <ActivityFunnel data={pipelineData} />
          </div>
        )}

        {/* KPI Radials Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-bone-light/30 rounded-2xl border-l-4 border-l-terracotta border-t border-r border-b border-bone-dark/50 p-5 flex flex-col items-center shadow-sm">
            <ScoreRadial
              score={teamAvgScore ?? 0}
              maxScore={10}
              size={120}
              label="Team Score"
              sublabel="/10"
            />
          </div>
          <div className="bg-gradient-to-br from-white to-bone-light/30 rounded-2xl border-l-4 border-l-clay border-t border-r border-b border-bone-dark/50 p-5 flex flex-col items-center shadow-sm">
            <ScoreRadial
              score={totalCalls}
              maxScore={Math.max(totalCalls, 50)}
              size={120}
              label="Calls Analyzed"
              showPercentage={false}
            />
          </div>
          <div className="bg-gradient-to-br from-white to-bone-light/30 rounded-2xl border-l-4 border-l-terracotta/60 border-t border-r border-b border-bone-dark/50 p-5 flex flex-col items-center shadow-sm">
            {trendLabels.length > 1 ? (
              <ScoreTrendChart labels={trendLabels} scores={trendScores} height={100} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-stone-light text-xs text-center">Score trends appear after calls are analyzed.</p>
              </div>
            )}
            <p className="text-xs font-medium text-stone-light mt-1">Score Trend</p>
          </div>
        </div>

        {/* Rep Cards Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-espresso">Team Members</h2>
            <Link href="/team" className="text-terracotta text-sm hover:text-terracotta-bright">Manage Team</Link>
          </div>
          {repMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repMembers.map((member) => {
                const progress = repGoalMap[member.email] || { approachesPercent: 0, discoveryPercent: 0, proposalsPercent: 0, salesPercent: 0, sandlerScore: null }
                return (
                  <Link
                    key={member.id}
                    href={`/team/${member.id}`}
                    className="bg-gradient-to-br from-white to-bone-light/40 rounded-2xl border-t-2 border-t-clay/40 border-l border-r border-b border-bone-dark/50 p-5 hover:border-terracotta/50 hover:shadow-md transition-all cursor-pointer shadow-sm"
                  >
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <ScoreRadial
                        score={progress.approachesPercent}
                        maxScore={100}
                        size={65}
                        label="Calls"
                        showPercentage={true}
                      />
                      <ScoreRadial
                        score={progress.discoveryPercent}
                        maxScore={100}
                        size={65}
                        label="Discovery"
                        showPercentage={true}
                      />
                      <ScoreRadial
                        score={progress.proposalsPercent}
                        maxScore={100}
                        size={65}
                        label="Proposals"
                        showPercentage={true}
                      />
                      <ScoreRadial
                        score={progress.salesPercent}
                        maxScore={100}
                        size={65}
                        label="Sales"
                        showPercentage={true}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-espresso">{member.full_name || member.email}</p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta uppercase tracking-wider">
                          {member.role}
                        </span>
                        {progress.sandlerScore !== null && (
                          <span className="text-xs text-stone-light">
                            Avg: {progress.sandlerScore}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-bone-light/50 rounded-2xl border border-bone-dark p-6 shadow-sm">
              <p className="text-stone text-sm">
                No team members yet. <Link href="/team" className="text-terracotta hover:text-terracotta-bright">Invite your first rep</Link>
              </p>
            </div>
          )}
        </div>

        {/* Bottom Row: Methodology Breakdown + Coaching + Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Team Methodology Breakdown */}
          <div className="bg-white rounded-2xl border-l-4 border-l-clay border-t border-r border-b border-bone-dark/50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-espresso mb-4 pb-2 border-b-2 border-clay/20">Team Methodology Breakdown</h2>
            {teamSandlerScores && Object.keys(teamSandlerScores).length > 0 ? (
              <SandlerBreakdown scores={teamSandlerScores} />
            ) : (
              <p className="text-stone-light text-sm">Breakdown appears after calls are analyzed.</p>
            )}
          </div>

          {/* Recent Coaching */}
          <div className="bg-white rounded-2xl border-l-4 border-l-terracotta/60 border-t border-r border-b border-bone-dark/50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-terracotta/10">
              <h2 className="text-lg font-bold text-espresso">Recent Coaching</h2>
              <Link href="/coaching" className="text-terracotta text-xs hover:text-terracotta-bright">View All</Link>
            </div>
            {recentCoaching.length > 0 ? (
              <div className="space-y-3">
                {recentCoaching.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bone/50">
                    {c.status === 'sent' ? (
                      <HiCheckCircle className="text-terracotta text-lg flex-shrink-0" />
                    ) : (
                      <HiAcademicCap className="text-clay text-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-espresso truncate">{c.rep_email}</p>
                      <p className="text-xs text-stone-light">
                        {c.status === 'sent' ? 'Sent' : 'Pending'} &middot; {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-light text-sm">Coaching messages will appear here.</p>
            )}
          </div>

          {/* Needs Attention */}
          <div className="bg-white rounded-2xl border-l-4 border-l-terracotta border-t border-r border-b border-bone-dark/50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-espresso mb-4 pb-2 border-b-2 border-terracotta/20">Needs Attention</h2>
            {needsAttention.length > 0 ? (
              <div className="space-y-3">
                {needsAttention.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-terracotta/5 border border-terracotta/20">
                    <HiExclamationCircle className="text-terracotta text-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-espresso truncate">{item.repName}</p>
                      <p className="text-xs text-terracotta-dark">
                        {item.component}: {item.score}/10
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-light text-sm">No critical issues detected.</p>
            )}
          </div>
        </div>

        {/* Open Commitments (Manager view) */}
        {openCommitments.length > 0 && (
          <div className="bg-gradient-to-br from-clay/5 to-white rounded-2xl border-t-4 border-t-clay border-l border-r border-b border-clay/30 p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-clay/20">
              <HiClipboardCheck className="text-clay text-lg" />
              <h2 className="text-lg font-bold text-espresso">Open Commitments</h2>
              <span className="text-xs bg-clay/10 text-clay-dark px-2 py-0.5 rounded-full border border-clay/30">
                {openCommitments.length}
              </span>
            </div>
            <div className="space-y-2">
              {openCommitments.map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bone/50">
                  <span className="w-2 h-2 bg-clay rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-espresso">{c.commitment_text}</p>
                    <p className="text-xs text-stone-light mt-0.5">{c.rep_email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Celebrations Preview */}
        {recentCelebrations.length > 0 && (
          <div className="bg-gradient-to-br from-white to-clay/5 rounded-2xl border-t-2 border-t-clay border-l border-r border-b border-bone-dark/50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-clay/20">
              <h2 className="text-lg font-bold text-espresso">Recent Wins</h2>
              <Link href="/celebrations" className="text-terracotta text-xs hover:text-terracotta-bright">View All</Link>
            </div>
            <div className="space-y-3">
              {recentCelebrations.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bone/50">
                  <HiSparkles className="text-clay text-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-espresso truncate">{c.title}</p>
                    <p className="text-xs text-stone-light">
                      {c.rep_email && <span>{c.rep_email} &middot; </span>}
                      {getTimeAgo(c.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── REP DASHBOARD ───
  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-terracotta/10">
        <h1 className="text-2xl font-bold text-espresso mb-1">Your Performance</h1>
        <p className="text-stone text-sm">
          Welcome back, {userInfo.full_name || userInfo.email?.split('@')[0] || 'there'}.
        </p>
      </div>

      {notifications && (notifications.coachingUnread > 0 || notifications.notesUnread > 0 || notifications.celebrationsRecent > 0) && (
        <div className="bg-white rounded-2xl border-l-4 border-l-terracotta border-t border-r border-b border-bone-dark/50 p-5 mb-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-terracotta opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-terracotta" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-espresso">
                  {notifications.role === 'rep'
                    ? 'You have a new message'
                    : 'New activity needs your attention'}
                </h2>
                <p className="text-sm text-stone-light">
                  {notifications.role === 'rep'
                    ? [
                        notifications.celebrationsRecent > 0
                          ? `a team win: ${notifications.latestCelebrationTitle || 'new celebration'}`
                          : null,
                        notifications.coachingUnread > 0
                          ? `coaching from ${notifications.latestCoachName || 'your manager'}`
                          : null,
                        notifications.notesUnread > 0
                          ? `a note from ${notifications.latestNoteSenderName || 'your manager'}`
                          : null,
                      ].filter(Boolean).join(' and ')
                    : 'Review coaching, celebrations, and 1-on-1 notes that are waiting for action.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {notifications.celebrationsRecent > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                  Team wins {notifications.celebrationsRecent}
                </span>
              )}
              {notifications.coachingUnread > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-terracotta/20 bg-terracotta/5 px-3 py-1 text-xs font-semibold text-terracotta">
                  Coaching unread {notifications.coachingUnread}
                </span>
              )}
              {notifications.coachingRead > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-clay/20 bg-clay/5 px-3 py-1 text-xs font-semibold text-clay">
                  Coaching read {notifications.coachingRead}
                </span>
              )}
              {notifications.coachingReplied > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1 text-xs font-semibold text-green-600">
                  Coaching replied {notifications.coachingReplied}
                </span>
              )}
              {notifications.notesUnread > 0 && (
                <Link href={`/notes${notifications.latestNoteSenderEmail ? `?rep=${encodeURIComponent(notifications.latestNoteSenderEmail)}` : ''}`}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-aqua/20 bg-aqua/5 px-3 py-1 text-xs font-semibold text-espresso hover:bg-aqua/10 hover:border-aqua/30 transition-colors cursor-pointer">
                    Notes unread {notifications.notesUnread} →
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {recentCelebrations.length > 0 && (
        <div className="bg-gradient-to-br from-white to-clay/5 rounded-2xl border-t-2 border-t-clay border-l border-r border-b border-bone-dark/50 p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-3">
            {(() => {
              const config = getCelebrationBadgeConfig(recentCelebrations[0].badge_key)
              const Icon = config.icon
              return (
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${config.color}`}>
                  <Icon className="text-2xl" />
                </div>
              )
            })()}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">Team win</p>
              <h2 className="text-lg font-bold text-espresso truncate">
                {recentCelebrations[0].title}
              </h2>
              <p className="text-sm text-stone-light truncate">
                {recentCelebrations[0].rep_email && <span>{recentCelebrations[0].rep_email} · </span>}
                {getTimeAgo(recentCelebrations[0].created_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {repInvitation && (
        <div className="bg-white rounded-2xl border-l-4 border-l-terracotta border-t border-r border-b border-bone-dark/50 p-5 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-terracotta font-semibold">Invitation pending</p>
              <h2 className="text-lg font-bold text-espresso mt-1">Finish your team setup</h2>
              <p className="text-sm text-stone-light mt-1">
                You were invited as a {repInvitation.role}. Open your invitation to complete setup and unlock the rep dashboard.
              </p>
            </div>
            <Link
              href={`/accept-invite?token=${repInvitation.token}`}
              className="inline-flex items-center justify-center bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta-dark transition-colors text-sm font-medium"
            >
              Finish Setup
            </Link>
          </div>
        </div>
      )}

      {/* Hero: Methodology Score */}
      <div className="bg-gradient-to-br from-white via-bone-light/20 to-terracotta/5 rounded-2xl border-t-4 border-t-terracotta border-l border-r border-b border-bone-dark/50 p-6 mb-8 flex flex-col items-center shadow-md">
        <ScoreRadial
          score={repOverallScore ?? 0}
          maxScore={10}
          size={160}
          label="Methodology Score"
          sublabel="/10"
        />
      </div>

      {/* 4 Pipeline Radials */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-white to-bone-light/30 rounded-2xl border-l-4 border-l-terracotta border-t border-r border-b border-bone-dark/50 p-5 flex flex-col items-center shadow-sm">
          <ScoreRadial
            score={repPipeline?.callsPercent ?? 0}
            maxScore={100}
            size={110}
            label="Calls"
            showPercentage={true}
          />
        </div>
        <div className="bg-gradient-to-br from-white to-bone-light/30 rounded-2xl border-l-4 border-l-clay border-t border-r border-b border-bone-dark/50 p-5 flex flex-col items-center shadow-sm">
          <ScoreRadial
            score={repPipeline?.discoveryPercent ?? 0}
            maxScore={100}
            size={110}
            label="Discovery"
            showPercentage={true}
          />
        </div>
        <div className="bg-gradient-to-br from-white to-bone-light/30 rounded-2xl border-l-4 border-l-terracotta/60 border-t border-r border-b border-bone-dark/50 p-5 flex flex-col items-center shadow-sm">
          <ScoreRadial
            score={repPipeline?.proposalsPercent ?? 0}
            maxScore={100}
            size={110}
            label="Proposals"
            showPercentage={true}
          />
        </div>
        <div className="bg-gradient-to-br from-white to-bone-light/30 rounded-2xl border-l-4 border-l-clay/70 border-t border-r border-b border-bone-dark/50 p-5 flex flex-col items-center shadow-sm">
          <ScoreRadial
            score={repPipeline?.salesPercent ?? 0}
            maxScore={100}
            size={110}
            label="Sales"
            showPercentage={true}
          />
        </div>
      </div>

      {/* Coaching Feed + Methodology Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border-l-4 border-l-terracotta/60 border-t border-r border-b border-bone-dark/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-terracotta/10">
            <h2 className="text-lg font-bold text-espresso">Coaching Feed</h2>
            {notifications?.coachingUnread ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">
                <span className="h-2 w-2 rounded-full bg-terracotta animate-pulse" />
                New
              </span>
            ) : null}
            <Link href="/coaching" className="text-terracotta text-xs hover:text-terracotta-bright">View All</Link>
          </div>
          {repCoachingMessages.length > 0 ? (
            <CoachingFeed messages={repCoachingMessages.map((m) => ({
              id: m.id,
              subject: m.subject,
              coaching_content: m.coaching_content,
              sent_at: m.created_at,
              status: m.status,
            }))} />
          ) : (
            <p className="text-stone-light text-sm">Coaching messages will appear here after calls are analyzed.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border-l-4 border-l-clay border-t border-r border-b border-bone-dark/50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-espresso mb-4 pb-2 border-b-2 border-clay/20">Methodology Breakdown</h2>
          {repScores ? (
            <SandlerBreakdown scores={repScores} />
          ) : (
            <p className="text-stone-light text-sm">Scores appear after your first call is analyzed.</p>
          )}
        </div>
      </div>

      {/* My Commitments (Rep view) */}
      {openCommitments.length > 0 && (
        <div className="bg-gradient-to-br from-clay/5 to-white rounded-2xl border-t-4 border-t-clay border-l border-r border-b border-clay/30 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-clay/20">
            <HiClipboardCheck className="text-clay text-lg" />
            <h2 className="text-lg font-bold text-espresso">My Commitments</h2>
            <span className="text-xs bg-clay/10 text-clay-dark px-2 py-0.5 rounded-full border border-clay/30">
              {openCommitments.length}
            </span>
          </div>
          <div className="space-y-2">
            {openCommitments.map((c) => (
              <label key={c.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bone/50 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleCompleteCommitment(c.id)}
                  className="mt-0.5 w-4 h-4 rounded border-clay/30 text-terracotta focus:ring-terracotta/50 bg-white"
                />
                <span className="text-sm text-espresso group-hover:text-terracotta transition-colors">
                  {c.commitment_text}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Score History + 1-on-1 Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border-l-4 border-l-terracotta/60 border-t border-r border-b border-bone-dark/50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-espresso mb-4 pb-2 border-b-2 border-terracotta/20">Score History</h2>
          {trendLabels.length > 1 ? (
            <ScoreTrendChart labels={trendLabels} scores={trendScores} height={200} />
          ) : (
            <p className="text-stone-light text-sm">Trend data appears after multiple calls.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border-l-4 border-l-clay border-t border-r border-b border-bone-dark/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-clay/20">
            <h2 className="text-lg font-bold text-espresso">1-on-1 Notes</h2>
            {notifications?.notesUnread ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">
                <span className="h-2 w-2 rounded-full bg-terracotta animate-pulse" />
                {notifications.notesUnread} unread
              </span>
            ) : repNotesPreview.unreadCount > 0 && (
              <span className="bg-terracotta text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {repNotesPreview.unreadCount} unread
              </span>
            )}
          </div>
          {repNotesPreview.lastMessage ? (
            <div className="mb-4">
              <p className="text-xs text-stone-light mb-1">Last message from {repNotesPreview.lastSender}:</p>
              <p className="text-sm text-espresso line-clamp-3">{repNotesPreview.lastMessage}</p>
            </div>
          ) : (
            <p className="text-stone-light text-sm mb-4">No messages yet. Your manager can send notes here.</p>
          )}
          <Link href="/notes" className="flex items-center gap-2 text-terracotta hover:text-terracotta-bright text-sm font-medium">
            <HiChatAlt2 /> Open Notes
          </Link>
        </div>
      </div>

      {/* Celebrations Preview */}
      {recentCelebrations.length > 0 && (
        <div className="bg-gradient-to-br from-white to-clay/5 rounded-2xl border-t-2 border-t-clay border-l border-r border-b border-bone-dark/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-clay/20">
            <h2 className="text-lg font-bold text-espresso">Recent Wins</h2>
            <Link href="/celebrations" className="text-terracotta text-xs hover:text-terracotta-bright">View All</Link>
          </div>
          <div className="space-y-3">
            {recentCelebrations.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bone/50">
                {(() => {
                  const config = getCelebrationBadgeConfig(c.badge_key)
                  const Icon = config.icon
                  return <Icon className="text-clay text-lg flex-shrink-0" />
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-espresso truncate">{c.title}</p>
                  <p className="text-xs text-stone-light">
                    {c.rep_email && <span>{c.rep_email} &middot; </span>}
                    {getTimeAgo(c.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
