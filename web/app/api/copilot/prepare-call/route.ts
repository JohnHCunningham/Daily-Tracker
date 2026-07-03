import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-placeholder',
  baseURL: 'https://api.deepseek.com/v1',
})

interface MethodologyConfig {
  label: string
  systemPrompt: string
}

const methodologyConfigs: Record<string, MethodologyConfig> = {
  generic: {
    label: 'General',
    systemPrompt: `You are a sales coach preparing a rep for their next call.

Coach from general sales best practices: understand what methodology the rep's team uses (Sandler, Challenger, SPIN, Gap Selling, MEDDIC, MEDDPICC). Focus on practical, actionable guidance. Help the rep build a structured agenda with clear objectives, discovery questions, and next steps. Be direct, practical, and focused on behavior change — not theory.`
  },
  sandler: {
    label: 'Sandler',
    systemPrompt: `You are a Sandler-trained sales coach inside One Click Coaching, preparing a rep for their next call. Coach from the full Sandler Selling System: equal business stature, up-front contracts (every call starts with clear agenda, time, outcomes, and permission to say no), pain before product (use the Pain Funnel — surface problem to quantified impact to personal consequences), budget and decision clarity before any presentation, and a willingness to help the rep disqualify bad-fit opportunities. Be calm, direct, and practical. The rep should walk into the call with a structured agenda and specific opening language.`
  },
  challenger: {
    label: 'Challenger',
    systemPrompt: `You are a Challenger Sales coach inside One Click Coaching, preparing a rep for their next call. Coach from the full Challenger model: Teach for differentiation (arm the rep with a commercial insight that reframes the customer's assumptions), Tailor for resonance (adjust the message to each stakeholder's value drivers and language), and Take Control (set the agenda, ask the hard questions about money, lock specific dated next steps). Push the rep to lead with insight, not discovery. The prep should include: the reframe they'll deliver, the data that drowns it, and the control move that ends the meeting.`
  },
  spin: {
    label: 'SPIN',
    systemPrompt: `You are a SPIN Selling coach preparing a rep for their next call.

Coach from SPIN principles: help the rep build a sequence of Situation, Problem, Implication, and Need-Payoff questions. Keep the buyer doing the thinking. Build explicit need before presenting value.`
  },
  gap: {
    label: 'Gap Selling',
    systemPrompt: `You are a Gap Selling coach preparing a rep for their next call.

Coach from Gap Selling principles: diagnose the customer's Current State and Future State. Quantify the gap. Identify root causes and business impact before any solution talk. Be clinically diagnostic.`
  },
  meddic: {
    label: 'MEDDPICC',
    systemPrompt: `You are a MEDDPICC deal coach preparing a rep for their next call.

Coach from the full eight-part framework: Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, and Competition. Be rigorous. Close the largest deal gap first.`
  },
  meddpicc: {
    label: 'MEDDPICC',
    systemPrompt: `You are a MEDDPICC deal coach preparing a rep for their next call.

Coach from the full eight-part framework: Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, and Competition. Be rigorous. Close the largest deal gap first.`
  },
}

function getMethodologyConfig(methodology: string | null | undefined): MethodologyConfig {
  const normalized = methodology?.trim().toLowerCase()
  if (!normalized || !methodologyConfigs[normalized]) {
    return methodologyConfigs.generic
  }
  return methodologyConfigs[normalized]
}

export async function POST(request: Request) {
  try {
    const { prospect, company, stage, concerns } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('id, email, account_id, full_name')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get account methodology
    const { data: account } = await supabase
      .from('Accounts')
      .select('methodology, company_name, unique_customer_profile, competitor_context')
      .eq('id', userData.account_id)
      .single()

    const config = getMethodologyConfig(account?.methodology)

    // Pull context: recent notes about this prospect
    const { data: notes } = await supabase
      .from('Notes')
      .select('content, created_at, sender_email')
      .eq('account_id', userData.account_id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Pull recent coaching messages
    const { data: coaching } = await supabase
      .from('Coaching_Messages')
      .select('subject, coaching_content, rep_email, created_at')
      .eq('account_id', userData.account_id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Pull recent commitments
    const { data: commitments } = await supabase
      .from('Commitments')
      .select('commitment_text, rep_email, status, created_at')
      .eq('account_id', userData.account_id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10)

    // Pull recent calls (Synced_Conversations)
    const { data: calls } = await supabase
      .from('Synced_Conversations')
      .select('call_date, ai_summary, methodology_scores, rep_email, participants')
      .eq('account_id', userData.account_id)
      .order('call_date', { ascending: false })
      .limit(5)

    // Build context injection
    const contextParts: string[] = []

    if (account?.company_name) {
      contextParts.push(`Company: ${account.company_name}`)
    }
    if (account?.unique_customer_profile) {
      contextParts.push(`Ideal Customer: ${account.unique_customer_profile}`)
    }
    if (account?.competitor_context) {
      contextParts.push(`Key Competitors: ${account.competitor_context}`)
    }

    if (notes && notes.length > 0) {
      contextParts.push(`\nRecent Notes:\n${notes.map(n =>
        `[${new Date(n.created_at).toLocaleDateString()}] ${n.sender_email}: ${(n.content || '').slice(0, 300)}`
      ).join('\n')}`)
    }

    if (coaching && coaching.length > 0) {
      contextParts.push(`\nRecent Coaching:\n${coaching.map(c =>
        `[${c.rep_email}] ${c.subject}: ${(c.coaching_content || '').slice(0, 200)}`
      ).join('\n')}`)
    }

    if (commitments && commitments.length > 0) {
      contextParts.push(`\nOpen Commitments:\n${commitments.map(c =>
        `[${c.rep_email}] ${c.commitment_text}`
      ).join('\n')}`)
    }

    if (calls && calls.length > 0) {
      contextParts.push(`\nRecent Calls:\n${calls.map(c =>
        `[${c.call_date}] ${c.rep_email || 'Unknown'}: ${(c.ai_summary || 'No summary').slice(0, 200)}`
      ).join('\n')}`)
    }

    const contextBlock = contextParts.join('\n')

    const prompt = `${config.systemPrompt}

Rep: ${userData.full_name || userData.email}
${prospect ? `Prospect: ${prospect}` : ''}${company ? `\nCompany: ${company}` : ''}${stage ? `\nDeal Stage: ${stage}` : ''}${concerns ? `\nSpecific Concerns: ${concerns}` : ''}

${contextBlock ? `\nBACKGROUND CONTEXT:\n${contextBlock}` : ''}

Generate a structured call preparation agenda for the rep's next call with this prospect. Follow ${config.label} methodology throughout.

Format your response as:

## Call Objective
One clear sentence stating what the rep should accomplish on this call.

## Pre-Call Setup
2-3 things the rep should review or prepare before the call.

## Opening (Up-Front Contract)
A suggested opening that sets equal business stature and a clear agenda. Include the specific words the rep can say.

## Key Questions
4-6 methodology-specific questions the rep should ask, organized in the right sequence.

## Traps to Avoid
2-3 common mistakes reps make at this stage, and what to do instead.

## Next Step
What the rep should lock in before ending the call. Be specific.

Keep it practical. No theory. No fluff. The rep should be able to read this in 3 minutes and walk into the call prepared.`

    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const agenda = completion.choices[0].message.content

    // Log the interaction
    await supabase.from('Copilot_Interactions').insert({
      account_id: userData.account_id,
      user_id: userData.id,
      user_email: userData.email,
      question: `Call prep: ${prospect || 'Unknown'}${company ? ` at ${company}` : ''}${stage ? ` (${stage})` : ''}`,
      intent_matched: 'call-prep',
      response: agenda,
    })

    return NextResponse.json({
      agenda,
      methodology: config.label,
      contextSources: {
        notes: notes?.length || 0,
        coaching: coaching?.length || 0,
        commitments: commitments?.length || 0,
        calls: calls?.length || 0,
      },
    })

  } catch (error) {
    console.error('Call prep error:', error)
    return NextResponse.json(
      { error: 'Failed to generate call agenda' },
      { status: 500 }
    )
  }
}
