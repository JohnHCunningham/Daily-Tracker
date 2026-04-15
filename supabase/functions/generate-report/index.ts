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
    const daysBack = parseInt(period)
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
    const midpoint = new Date(Date.now() - (daysBack / 2) * 24 * 60 * 60 * 1000).toISOString()

    // Fetch all scored conversations in the period
    const { data: conversations } = await supabase
      .from('Synced_Conversations')
      .select('call_date, methodology_scores, rep_email, title')
      .eq('account_id', userData.account_id)
      .not('methodology_scores', 'is', null)
      .gte('call_date', since)
      .order('call_date', { ascending: true })

    // Fetch coaching messages in the period
    const { data: coaching } = await supabase
      .from('Coaching_Messages')
      .select('rep_email, status, created_at, coaching_text, subject')
      .eq('account_id', userData.account_id)
      .gte('created_at', since)

    // Fetch team members
    const { data: members } = await supabase
      .from('Users')
      .select('full_name, email, role')
      .eq('account_id', userData.account_id)

    if (!conversations || conversations.length === 0) {
      return new Response(JSON.stringify({
        summary: null,
        componentAverages: {},
        repMatrix: [],
        trends: { firstHalf: {}, secondHalf: {} },
        coachingStats: { sent: 0, replied: 0, byRep: {} },
        narrative: 'No call data available for this period. Connect your integrations and analyze some calls to generate a report.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Component averages (team-wide) ──
    const componentTotals: Record<string, { sum: number; count: number }> = {}
    const firstHalfTotals: Record<string, { sum: number; count: number }> = {}
    const secondHalfTotals: Record<string, { sum: number; count: number }> = {}

    // ── Per-rep aggregates ──
    const repAgg: Record<string, {
      components: Record<string, { sum: number; count: number }>
      callCount: number
      firstHalfAvg: number[]
      secondHalfAvg: number[]
    }> = {}

    conversations.forEach((conv) => {
      if (!conv.methodology_scores) return
      const scores = conv.methodology_scores as Record<string, number>
      const rep = conv.rep_email || 'unknown'
      const isSecondHalf = conv.call_date >= midpoint

      if (!repAgg[rep]) {
        repAgg[rep] = { components: {}, callCount: 0, firstHalfAvg: [], secondHalfAvg: [] }
      }
      repAgg[rep].callCount++

      const callAvg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
      if (isSecondHalf) repAgg[rep].secondHalfAvg.push(callAvg)
      else repAgg[rep].firstHalfAvg.push(callAvg)

      Object.entries(scores).forEach(([comp, score]) => {
        // Team totals
        if (!componentTotals[comp]) componentTotals[comp] = { sum: 0, count: 0 }
        componentTotals[comp].sum += score
        componentTotals[comp].count++

        // Half-period totals
        const halfTotals = isSecondHalf ? secondHalfTotals : firstHalfTotals
        if (!halfTotals[comp]) halfTotals[comp] = { sum: 0, count: 0 }
        halfTotals[comp].sum += score
        halfTotals[comp].count++

        // Rep totals
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
    Object.entries(firstHalfTotals).forEach(([c, { sum, count }]) => { firstHalfAvgs[c] = Math.round((sum / count) * 10) / 10 })
    Object.entries(secondHalfTotals).forEach(([c, { sum, count }]) => { secondHalfAvgs[c] = Math.round((sum / count) * 10) / 10 })

    // ── Rep matrix ──
    const memberMap: Record<string, string> = {}
    members?.forEach(m => { memberMap[m.email] = m.full_name || m.email })

    const repMatrix = Object.entries(repAgg).map(([email, agg]) => {
      const compAvgs: Record<string, number> = {}
      Object.entries(agg.components).forEach(([comp, { sum, count }]) => {
        compAvgs[comp] = Math.round((sum / count) * 10) / 10
      })
      const overallAvg = Object.values(compAvgs).reduce((a, b) => a + b, 0) / Object.values(compAvgs).length
      const firstAvg = agg.firstHalfAvg.length ? agg.firstHalfAvg.reduce((a, b) => a + b, 0) / agg.firstHalfAvg.length : null
      const secondAvg = agg.secondHalfAvg.length ? agg.secondHalfAvg.reduce((a, b) => a + b, 0) / agg.secondHalfAvg.length : null
      const trend = firstAvg && secondAvg ? (secondAvg > firstAvg + 0.3 ? 'improving' : secondAvg < firstAvg - 0.3 ? 'declining' : 'stable') : 'stable'

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

    // ── Coaching stats ──
    const coachingByRep: Record<string, { sent: number; replied: number }> = {}
    coaching?.forEach(c => {
      if (!coachingByRep[c.rep_email]) coachingByRep[c.rep_email] = { sent: 0, replied: 0 }
      if (c.status === 'sent') coachingByRep[c.rep_email].sent++
      if (c.status === 'replied') coachingByRep[c.rep_email].replied++
    })

    // ── Team summary ──
    const allScores = Object.values(componentAverages)
    const teamOverall = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length * 10) / 10 : 0
    const weakComponents = Object.entries(componentAverages).filter(([, v]) => v < 5).sort(([, a], [, b]) => a - b)
    const strongComponents = Object.entries(componentAverages).filter(([, v]) => v >= 7).sort(([, a], [, b]) => b - a)

    // ── AI Narrative ──
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    let narrative = ''

    if (openAiKey) {
      const prompt = `You are an expert sales coach analyzing a team's Sandler sales methodology performance.

Period: Last ${daysBack} days
Total calls analyzed: ${conversations.length}
Team overall score: ${teamOverall}/10
Team size: ${repMatrix.length} reps

Component averages (0-10):
${Object.entries(componentAverages).map(([k, v]) => `- ${COMPONENT_LABELS[k] || k}: ${v}`).join('\n')}

Trends (first half vs second half of period):
${Object.entries(secondHalfAvgs).map(([k, v]) => {
  const first = firstHalfAvgs[k] || v
  const delta = v - first
  const arrow = delta > 0.2 ? '↑' : delta < -0.2 ? '↓' : '→'
  return `- ${COMPONENT_LABELS[k] || k}: ${arrow} ${v} (was ${first})`
}).join('\n')}

Rep performance summary:
${repMatrix.map(r => `- ${r.name}: ${r.overallAvg}/10 (${r.trend}, ${r.callCount} calls, weakest: ${COMPONENT_LABELS[r.weakest || ''] || r.weakest})`).join('\n')}

Coaching sent this period: ${coaching?.filter(c => c.status === 'sent').length || 0} messages

Write a professional manager report narrative with these EXACT sections:
1. EXECUTIVE SUMMARY (2-3 sentences on team health and direction)
2. GROWING STRENGTHS (2 bullet points on what's improving)
3. SYSTEMIC WEAKNESSES (2-3 bullet points on patterns across the team, not just one rep)
4. PROPOSED SOLUTIONS (3-4 specific, actionable recommendations with concrete exercises)
5. FOCUS FOR NEXT PERIOD (1 clear priority the manager should address)

Keep it professional, specific, and actionable. Reference actual component names and scores.`

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
        teamOverall,
        totalCalls: conversations.length,
        repCount: repMatrix.length,
        period: daysBack,
        weakComponents: weakComponents.slice(0, 3),
        strongComponents: strongComponents.slice(0, 2),
      },
      componentAverages,
      repMatrix,
      trends: { firstHalf: firstHalfAvgs, secondHalf: secondHalfAvgs },
      coachingStats: {
        sent: coaching?.filter(c => c.status === 'sent').length || 0,
        replied: coaching?.filter(c => c.status === 'replied').length || 0,
        byRep: coachingByRep,
      },
      narrative,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
