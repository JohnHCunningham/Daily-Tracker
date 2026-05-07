import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COMPONENT_LABELS: Record<string, string> = {
  bondingRapport: 'Bonding & Rapport',
  upfrontContract: 'Upfront Contract',
  painFunnel: 'Pain Funnel',
  budget: 'Budget',
  decisionProcess: 'Decision Process',
  fulfillment: 'Fulfillment',
  postSell: 'Post-Sell',
  negativeReverseSelling: 'Negative Reverse Selling',
}

type ConversationRow = {
  call_date: string
  methodology_scores: Record<string, number> | null
  rep_email: string | null
  title: string | null
}

type CoachingRow = {
  rep_email: string | null
  status: string
  created_at: string
  coaching_text?: string | null
  subject?: string | null
}

type MemberRow = {
  full_name: string | null
  email: string
  role: string | null
}

type PeriodMetrics = {
  teamOverall: number
  totalCalls: number
  repCount: number
  componentAverages: Record<string, number>
  repMatrix: Array<{
    email: string
    name: string
    overallAvg: number
    callCount: number
    trend: 'improving' | 'declining' | 'stable'
    components: Record<string, number>
    weakest: string | null
  }>
  trends: { firstHalf: Record<string, number>; secondHalf: Record<string, number> }
  coachingStats: { sent: number; replied: number; byRep: Record<string, { sent: number; replied: number }> }
  weakComponents: [string, number][]
  strongComponents: [string, number][]
}

function buildMetrics(
  conversations: ConversationRow[],
  coaching: CoachingRow[] | undefined,
  members: MemberRow[] | undefined,
  windowStartIso: string,
  windowEndIso: string,
): PeriodMetrics {
  const windowStart = new Date(windowStartIso)
  const windowEnd = new Date(windowEndIso)
  const windowMid = new Date(windowStart.getTime() + ((windowEnd.getTime() - windowStart.getTime()) / 2))

  const componentTotals: Record<string, { sum: number; count: number }> = {}
  const firstHalfTotals: Record<string, { sum: number; count: number }> = {}
  const secondHalfTotals: Record<string, { sum: number; count: number }> = {}
  const repAgg: Record<string, {
    components: Record<string, { sum: number; count: number }>
    callCount: number
    firstHalfAvg: number[]
    secondHalfAvg: number[]
  }> = {}

  conversations.forEach((conv) => {
    if (!conv.methodology_scores) return
    const scores = conv.methodology_scores
    const rep = conv.rep_email || 'unknown'
    const isSecondHalf = conv.call_date >= windowMid.toISOString()

    if (!repAgg[rep]) {
      repAgg[rep] = { components: {}, callCount: 0, firstHalfAvg: [], secondHalfAvg: [] }
    }
    repAgg[rep].callCount++

    const callValues = Object.values(scores)
    const callAvg = callValues.length ? callValues.reduce((a, b) => a + b, 0) / callValues.length : 0
    if (isSecondHalf) repAgg[rep].secondHalfAvg.push(callAvg)
    else repAgg[rep].firstHalfAvg.push(callAvg)

    Object.entries(scores).forEach(([comp, score]) => {
      if (!componentTotals[comp]) componentTotals[comp] = { sum: 0, count: 0 }
      componentTotals[comp].sum += score
      componentTotals[comp].count++

      const halfTotals = isSecondHalf ? secondHalfTotals : firstHalfTotals
      if (!halfTotals[comp]) halfTotals[comp] = { sum: 0, count: 0 }
      halfTotals[comp].sum += score
      halfTotals[comp].count++

      if (!repAgg[rep].components[comp]) repAgg[rep].components[comp] = { sum: 0, count: 0 }
      repAgg[rep].components[comp].sum += score
      repAgg[rep].components[comp].count++
    })
  })

  const componentAverages: Record<string, number> = {}
  Object.entries(componentTotals).forEach(([comp, { sum, count }]) => {
    componentAverages[comp] = Math.round((sum / count) * 10) / 10
  })

  const firstHalfAvgs: Record<string, number> = {}
  const secondHalfAvgs: Record<string, number> = {}
  Object.entries(firstHalfTotals).forEach(([comp, { sum, count }]) => {
    firstHalfAvgs[comp] = Math.round((sum / count) * 10) / 10
  })
  Object.entries(secondHalfTotals).forEach(([comp, { sum, count }]) => {
    secondHalfAvgs[comp] = Math.round((sum / count) * 10) / 10
  })

  const memberMap: Record<string, string> = {}
  members?.forEach((m) => {
    memberMap[m.email] = m.full_name || m.email
  })

  const repMatrix = Object.entries(repAgg).map(([email, agg]) => {
    const compAvgs: Record<string, number> = {}
    Object.entries(agg.components).forEach(([comp, { sum, count }]) => {
      compAvgs[comp] = Math.round((sum / count) * 10) / 10
    })

    const values = Object.values(compAvgs)
    const overallAvg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
    const firstAvg = agg.firstHalfAvg.length ? agg.firstHalfAvg.reduce((a, b) => a + b, 0) / agg.firstHalfAvg.length : null
    const secondAvg = agg.secondHalfAvg.length ? agg.secondHalfAvg.reduce((a, b) => a + b, 0) / agg.secondHalfAvg.length : null
    const trend = firstAvg && secondAvg
      ? (secondAvg > firstAvg + 0.3 ? 'improving' : secondAvg < firstAvg - 0.3 ? 'declining' : 'stable')
      : 'stable'

    return {
      email,
      name: memberMap[email] || email,
      overallAvg: Math.round(overallAvg * 10) / 10,
      callCount: agg.callCount,
      trend,
      components: compAvgs,
      weakest: Object.entries(compAvgs).sort(([, a], [, b]) => a - b)[0]?.[0] || null,
    }
  }).sort((a, b) => b.overallAvg - a.overallAvg)

  const coachingByRep: Record<string, { sent: number; replied: number }> = {}
  coaching?.forEach((c) => {
    if (!c.rep_email) return
    if (!coachingByRep[c.rep_email]) coachingByRep[c.rep_email] = { sent: 0, replied: 0 }
    if (c.status === 'sent') coachingByRep[c.rep_email].sent++
    if (c.status === 'replied') coachingByRep[c.rep_email].replied++
  })

  const weakComponents = Object.entries(componentAverages).filter(([, v]) => v < 5).sort(([, a], [, b]) => a - b)
  const strongComponents = Object.entries(componentAverages).filter(([, v]) => v >= 7).sort(([, a], [, b]) => b - a)
  const allScores = Object.values(componentAverages)
  const teamOverall = allScores.length ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0

  return {
    teamOverall,
    totalCalls: conversations.length,
    repCount: repMatrix.length,
    componentAverages,
    repMatrix,
    trends: { firstHalf: firstHalfAvgs, secondHalf: secondHalfAvgs },
    coachingStats: {
      sent: coaching?.filter((c) => c.status === 'sent').length || 0,
      replied: coaching?.filter((c) => c.status === 'replied').length || 0,
      byRep: coachingByRep,
    },
    weakComponents,
    strongComponents,
  }
}

function buildManagerPunchList(current: PeriodMetrics, previous: PeriodMetrics) {
  const items: string[] = []
  const weak = current.weakComponents[0]
  const declines = current.repMatrix.filter((rep) => rep.trend === 'declining')
  const replyRate = current.coachingStats.sent > 0
    ? Math.round((current.coachingStats.replied / current.coachingStats.sent) * 100)
    : null

  const componentDeltas = Object.entries(current.componentAverages).map(([component, score]) => {
    const prev = previous.componentAverages[component] ?? score
    return { component, delta: Math.round((score - prev) * 10) / 10 }
  }).sort((a, b) => a.delta - b.delta)

  const biggestDrop = componentDeltas.find((item) => item.delta < -0.2)
  const biggestGain = [...componentDeltas].sort((a, b) => b.delta - a.delta).find((item) => item.delta > 0.2)

  if (weak) {
    items.push(`Run a focused team review on ${COMPONENT_LABELS[weak[0]] || weak[0]} and show one strong call example.`)
  }

  if (biggestDrop) {
    items.push(`Reverse the decline in ${COMPONENT_LABELS[biggestDrop.component] || biggestDrop.component}; inspect three recent calls and coach to the gap.`)
  }

  if (declines.length > 0) {
    items.push(`Meet with ${declines.slice(0, 2).map((rep) => rep.name).join(' and ')} on their weakest component and set a follow-up score target.`)
  }

  if (replyRate !== null && replyRate < 60) {
    items.push(`Tighten the follow-up loop on coaching messages; reply rate is ${replyRate}%.`)
  }

  if (previous.teamOverall > 0 && current.teamOverall < previous.teamOverall) {
    items.push(`Stabilize the team score before adding new process changes; current score is down ${Math.abs(Math.round((current.teamOverall - previous.teamOverall) * 10) / 10)} points vs the prior period.`)
  }

  if (biggestGain) {
    items.push(`Leverage the improvement in ${COMPONENT_LABELS[biggestGain.component] || biggestGain.component} by having top reps model it in the next team meeting.`)
  }

  if (!items.length) {
    items.push('Keep reinforcing the current strengths and review one representative call from each rep this period.')
  }

  return items.slice(0, 5)
}

function buildShareSummary(current: PeriodMetrics, previous: PeriodMetrics, periodDays: number, punchList: string[]) {
  const teamDelta = previous.teamOverall > 0 ? Math.round((current.teamOverall - previous.teamOverall) * 10) / 10 : 0
  const callDelta = current.totalCalls - previous.totalCalls
  const weakLabels = current.weakComponents.slice(0, 2).map(([comp, score]) => `${COMPONENT_LABELS[comp] || comp} (${score}/10)`)
  const strongLabels = current.strongComponents.slice(0, 2).map(([comp, score]) => `${COMPONENT_LABELS[comp] || comp} (${score}/10)`)

  return [
    `${periodDays === 7 ? 'Weekly' : periodDays === 30 ? 'Monthly' : `${periodDays}-day`} coaching report`,
    `Team score: ${current.teamOverall}/10 ${previous.teamOverall > 0 ? `(${teamDelta >= 0 ? '+' : ''}${teamDelta} vs prior period)` : ''}`,
    `Calls analysed: ${current.totalCalls} ${previous.totalCalls > 0 ? `(${callDelta >= 0 ? '+' : ''}${callDelta} vs prior period)` : ''}`,
    strongLabels.length ? `Where the team is strongest: ${strongLabels.join(', ')}` : 'No confirmed strengths yet',
    weakLabels.length ? `Needs attention: ${weakLabels.join(', ')}` : 'No weak areas surfaced yet',
    `Punch list: ${punchList.join(' | ')}`,
  ].join('\n')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: userData } = await supabase
      .from('Users')
      .select('role, full_name, account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData || !['admin', 'manager', 'coach'].includes(userData.role)) {
      return new Response('Forbidden', { status: 403 })
    }

    const { period = '30' } = await req.json().catch(() => ({}))
    const daysBack = Number.parseInt(String(period), 10) || 30
    const periodLabel = daysBack === 7 ? 'Weekly' : daysBack === 30 ? 'Monthly' : `${daysBack}-day`
    const comparisonLabel = `Previous ${daysBack} days`
    const nowIso = new Date().toISOString()
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
    const previousSince = new Date(Date.now() - (daysBack * 2) * 24 * 60 * 60 * 1000).toISOString()

    const currentConversationsPromise = supabase
      .from('Synced_Conversations')
      .select('call_date, methodology_scores, rep_email, title')
      .eq('account_id', userData.account_id)
      .not('methodology_scores', 'is', null)
      .gte('call_date', since)
      .order('call_date', { ascending: true })
    const previousConversationsPromise = supabase
      .from('Synced_Conversations')
      .select('call_date, methodology_scores, rep_email, title')
      .eq('account_id', userData.account_id)
      .not('methodology_scores', 'is', null)
      .gte('call_date', previousSince)
      .lt('call_date', since)
      .order('call_date', { ascending: true })

    const currentCoachingPromise = supabase
      .from('Coaching_Messages')
      .select('rep_email, status, created_at, coaching_text, subject')
      .eq('account_id', userData.account_id)
      .gte('created_at', since)
    const previousCoachingPromise = supabase
      .from('Coaching_Messages')
      .select('rep_email, status, created_at, coaching_text, subject')
      .eq('account_id', userData.account_id)
      .gte('created_at', previousSince)
      .lt('created_at', since)

    const { data: currentConversations } = await currentConversationsPromise
    const { data: previousConversations } = await previousConversationsPromise
    const { data: coaching } = await currentCoachingPromise
    const { data: previousCoaching } = await previousCoachingPromise
    const { data: members } = await supabase
      .from('Users')
      .select('full_name, email, role')
      .eq('account_id', userData.account_id)

    const currentMetrics = buildMetrics(currentConversations || [], coaching || [], members || [], since, nowIso)
    const previousMetrics = buildMetrics(previousConversations || [], previousCoaching || [], members || [], previousSince, since)
    const managerPunchList = buildManagerPunchList(currentMetrics, previousMetrics)
    const shareSummary = buildShareSummary(currentMetrics, previousMetrics, daysBack, managerPunchList)
    const teamDelta = previousMetrics.teamOverall > 0
      ? Math.round((currentMetrics.teamOverall - previousMetrics.teamOverall) * 10) / 10
      : 0
    const callDelta = currentMetrics.totalCalls - previousMetrics.totalCalls
    const bestImprovement = Object.entries(currentMetrics.componentAverages)
      .map(([component, score]) => ({
        component,
        delta: Math.round(((score - (previousMetrics.componentAverages[component] ?? score)) * 10)) / 10,
      }))
      .sort((a, b) => b.delta - a.delta)[0] || null
    const biggestDrop = Object.entries(currentMetrics.componentAverages)
      .map(([component, score]) => ({
        component,
        delta: Math.round(((score - (previousMetrics.componentAverages[component] ?? score)) * 10)) / 10,
      }))
      .sort((a, b) => a.delta - b.delta)[0] || null

    if (currentMetrics.totalCalls === 0) {
      return new Response(JSON.stringify({
        summary: {
          ...currentMetrics,
          period: daysBack,
          periodLabel,
          comparisonLabel,
          previousTeamOverall: previousMetrics.teamOverall,
          teamDelta,
          previousTotalCalls: previousMetrics.totalCalls,
          callDelta,
          replyRate: currentMetrics.coachingStats.sent > 0
            ? Math.round((currentMetrics.coachingStats.replied / currentMetrics.coachingStats.sent) * 100)
            : 0,
          bestImprovement,
          biggestDrop,
        },
        componentAverages: currentMetrics.componentAverages,
        repMatrix: currentMetrics.repMatrix,
        trends: currentMetrics.trends,
        coachingStats: currentMetrics.coachingStats,
        narrative: `No call data available for the ${periodLabel.toLowerCase()} window. Connect integrations and analyze some calls to generate a report.`,
        managerPunchList,
        shareSummary,
        previousSummary: {
          teamOverall: previousMetrics.teamOverall,
          totalCalls: previousMetrics.totalCalls,
        },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── AI Narrative ──
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    let narrative = ''

    if (openAiKey) {
      const prompt = `You are an expert sales coach writing a manager-facing report that should help a leader see the forest, not just the trees.

Period: ${periodLabel} (${daysBack} days)
Comparison: ${comparisonLabel}
Current period calls analyzed: ${currentMetrics.totalCalls}
Previous period calls analyzed: ${previousMetrics.totalCalls}
Current team overall score: ${currentMetrics.teamOverall}/10
Previous team overall score: ${previousMetrics.teamOverall}/10
Team delta vs previous period: ${teamDelta >= 0 ? '+' : ''}${teamDelta}
Team size: ${currentMetrics.repCount} reps
Reply rate: ${currentMetrics.coachingStats.sent > 0 ? Math.round((currentMetrics.coachingStats.replied / currentMetrics.coachingStats.sent) * 100) : 0}%

Current component averages (0-10):
${Object.entries(currentMetrics.componentAverages).map(([k, v]) => `- ${COMPONENT_LABELS[k] || k}: ${v}`).join('\n')}

Change vs previous period:
${Object.entries(currentMetrics.componentAverages).map(([k, v]) => {
  const prev = previousMetrics.componentAverages[k] ?? v
  const delta = Math.round((v - prev) * 10) / 10
  const arrow = delta > 0.2 ? '↑' : delta < -0.2 ? '↓' : '→'
  return `- ${COMPONENT_LABELS[k] || k}: ${arrow} ${v} (was ${prev})`
}).join('\n')}

Rep performance summary:
${currentMetrics.repMatrix.map(r => `- ${r.name}: ${r.overallAvg}/10 (${r.trend}, ${r.callCount} calls, weakest: ${COMPONENT_LABELS[r.weakest || ''] || r.weakest})`).join('\n')}

Use this report structure exactly:
1. EXECUTIVE SUMMARY (2-3 sentences on team health and direction)
2. GROWING STRENGTHS (2 bullet points on what's improving)
3. SYSTEMIC WEAKNESSES (2-3 bullet points on team-wide patterns)
4. PROPOSED SOLUTIONS (3-4 specific, actionable recommendations with concrete exercises)
5. MANAGER PUNCH LIST (3-5 concrete next actions the manager can execute this week)
6. FOCUS FOR NEXT PERIOD (1 clear priority the manager should address)

Keep it professional, specific, and actionable. Reference actual component names, scores, and rep patterns.`

      try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        })
        const aiData = await aiRes.json()
        narrative = aiData.choices?.[0]?.message?.content || ''
      } catch (e) {
        narrative = 'AI narrative unavailable. Check OpenAI API key.'
      }
    }

    return new Response(JSON.stringify({
      summary: {
        ...currentMetrics,
        period: daysBack,
        periodLabel,
        comparisonLabel,
        previousTeamOverall: previousMetrics.teamOverall,
        teamDelta,
        previousTotalCalls: previousMetrics.totalCalls,
        callDelta,
        replyRate: currentMetrics.coachingStats.sent > 0
          ? Math.round((currentMetrics.coachingStats.replied / currentMetrics.coachingStats.sent) * 100)
          : 0,
        bestImprovement,
        biggestDrop,
      },
      componentAverages: currentMetrics.componentAverages,
      repMatrix: currentMetrics.repMatrix,
      trends: currentMetrics.trends,
      coachingStats: currentMetrics.coachingStats,
      narrative,
      managerPunchList,
      shareSummary,
      previousSummary: {
        teamOverall: previousMetrics.teamOverall,
        totalCalls: previousMetrics.totalCalls,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
