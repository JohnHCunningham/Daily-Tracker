import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

import sandlerIntents from '@/lib/sales-copilot-intents.json'
import challengerIntents from '@/lib/methodologies/challenger-intents.json'
import gapIntents from '@/lib/methodologies/gap-intents.json'
import meddicIntents from '@/lib/methodologies/meddic-intents.json'
import meddpiccIntents from '@/lib/methodologies/meddpicc-intents.json'
import spinIntents from '@/lib/methodologies/spin-intents.json'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// ─── RAG Search (local, for copilot context injection) ───
async function ragSearchLocally(
  query: string,
  methodology: string,
  matchCount = 5,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) return ''

  try {
    const supabase = createAdminClient()

    // Generate embedding
    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })
    const embedding = embRes.data[0].embedding

    // Search knowledge base
    const { data, error } = await supabase.rpc('search_sandler_content', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: 0.3,
      match_count: matchCount,
      filter_content_types: ['best_practice', 'process', 'pitfall', 'script'],
      filter_methodology: methodology,
    })

    if (error || !data?.length) return ''

    return data
      .map((r: any, i: number) => {
        const label = r.content_type === 'pitfall' ? '⚠️ WATCH OUT' :
                      r.content_type === 'script' ? '📋 SCRIPT' :
                      r.content_type === 'process' ? '📋 PROCESS' : '📖 KNOWLEDGE'
        return `[${label}] ${r.chunk_title}\n${r.chunk_text}`
      })
      .join('\n\n')
  } catch (e) {
    console.warn('Copilot RAG search failed, continuing without:', e)
    return ''
  }
}

interface CopilotIntent {
  name: string
  stage: string
  sample_user_utterances: string[]
  bot_behavior: string
  response_templates: string[]
}

interface MethodologyConfig {
  label: string
  classifierName: string
  systemPrompt: string
  helpMessage: string
  fallbackMessage: string
  intents: CopilotIntent[]
}

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-placeholder',
  baseURL: 'https://api.deepseek.com/v1',
})

const methodologyConfigs: Record<string, MethodologyConfig> = {
  sandler: {
    label: 'Sandler',
    classifierName: 'Sandler sales coaching bot',
    intents: sandlerIntents as CopilotIntent[],
    systemPrompt: `You are a Sandler-trained sales coach inside One Click Coaching, helping a rep mid-call or between calls. Coach from the full Sandler Selling System: equal business stature, up-front contracts, pain before product (Pain Funnel), budget and decision clarity before presentation, negative reversals delivered softly and curiously (never smug), and a genuine willingness to disqualify bad-fit opportunities. Be calm, direct, and practical. Your job is to change what the rep does in the next 30 seconds — not deliver theory. If the rep signals urgency mid-call, give one scriptable line immediately before asking any diagnostic questions. Coach the behavior in plain language — don't require the rep to know Sandler terms. Never give closing scripts when the Pain compartment is still open.`,
    helpMessage: `**I'm your Sandler sales coach.**

I can help you execute Sandler methodology before or during calls. Try asking:

• "Give me an upfront contract"
• "Give me pain funnel questions"
• "They asked for pricing early"
• "How do I handle 'think it over'?"
• "How do I set a clear next step?"`,
    fallbackMessage: `I'm not sure how to help with that specific Sandler question.

Try asking:
• "Give me pain funnel questions"
• "They asked for pricing early"
• "How do I handle 'think it over'?"
• "Help" to see available topics`,
  },
  challenger: {
    label: 'Challenger',
    classifierName: 'Challenger sales coaching bot',
    intents: challengerIntents as CopilotIntent[],
    systemPrompt: `You are a Challenger Sales coach inside One Click Coaching, helping a rep mid-call or between calls. Coach from the full Challenger model: Teach for differentiation (bring insight that reframes their business), Tailor for resonance (translate to each stakeholder's value drivers), and Take Control (be assertive about money, process, and next steps — tolerate the tension that creates). Push the rep to lead with insight, not discovery. Reject insights that don't lead uniquely back to the rep's solution. Insist on constructive tension — if the customer is comfortable, the status quo wins. The biggest competitor is no-decision.`,
    helpMessage: `**I'm your Challenger sales coach.**

I can help you teach, tailor, and take control. Try asking:

• "Help me build a commercial insight"
• "How do I tailor this for the CFO?"
• "They are comparing us to competitors"
• "How do I create constructive tension?"
• "Help me reframe their thinking"`,
    fallbackMessage: `I'm not sure how to help with that specific Challenger question.

Try asking:
• "Help me build a commercial insight"
• "How do I tailor for the CFO?"
• "They're comparing us to competitors"
• "Help" to see available topics`,
  },
  spin: {
    label: 'SPIN',
    classifierName: 'SPIN Selling coaching bot',
    intents: spinIntents as CopilotIntent[],
    systemPrompt: `You are a SPIN Selling coach for B2B sales reps.

Coach from SPIN principles: help the rep ask better Situation, Problem, Implication, and Need-Payoff questions in the right sequence. Keep the buyer doing the thinking. Build explicit need before presenting value.`,
    helpMessage: `**I'm your SPIN Selling coach.**

I can help you build the right question sequence. Try asking:

• "Give me implication questions"
• "What situation questions should I ask?"
• "How do I build urgency?"
• "Help me with need-payoff questions"
• "What stage is this buyer in?"`,
    fallbackMessage: `I'm not sure how to help with that specific SPIN question.

Try asking:
• "Give me implication questions"
• "What stage is this buyer in?"
• "How do I build urgency?"
• "Help" to see available topics`,
  },
  gap: {
    label: 'Gap Selling',
    classifierName: 'Gap Selling coaching bot',
    intents: gapIntents as CopilotIntent[],
    systemPrompt: `You are a Gap Selling coach for B2B sales reps.

Coach from Gap Selling principles: diagnose the customer's Current State, Future State, impact, root cause, and gap value before any solution talk. Be clinically diagnostic. Push vague pain into quantified business impact.`,
    helpMessage: `**I'm your Gap Selling coach.**

I can help you diagnose before prescribing. Try asking:

• "Help me build an impact table"
• "How do I find the root cause?"
• "What's the gap value?"
• "Help me quantify this problem"
• "How do I connect my product to the gap?"`,
    fallbackMessage: `I'm not sure how to help with that specific Gap Selling question.

Try asking:
• "Help me build an impact table"
• "How do I find the root cause?"
• "What's the gap value?"
• "Help" to see available topics`,
  },
  meddic: {
    label: 'MEDDPICC',
    classifierName: 'MEDDPICC sales coaching bot',
    intents: meddicIntents as CopilotIntent[],
    systemPrompt: `You are a MEDDPICC coach for enterprise B2B sales reps.

Coach from deal qualification principles: Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion, Competition, and Paper Process. Be rigorous. If an element is weak, call it a forecast risk and give the next concrete action.`,
    helpMessage: `**I'm your MEDDPICC deal coach.**

I can help you qualify the deal and find risk. Try asking:

• "Run a MEDDPICC audit"
• "How do I get to the economic buyer?"
• "Is my champion strong enough?"
• "What metrics do I need?"
• "Help me clean up this forecast"`,
    fallbackMessage: `I'm not sure how to help with that specific MEDDPICC question.

Try asking:
• "Run a MEDDPICC audit"
• "Is my champion strong enough?"
• "How do I get to the economic buyer?"
• "Help" to see available topics`,
  },
  meddpicc: {
    label: 'MEDDPICC',
    classifierName: 'MEDDPICC sales coaching bot',
    intents: meddpiccIntents as CopilotIntent[],
    systemPrompt: `You are a MEDDPICC coach for enterprise B2B sales reps.

Coach from the full eight-part framework: Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, and Competition. Be rigorous. Test whether the rep has evidence or just hope, then give the next concrete action to close the largest deal gap.`,
    helpMessage: `**I'm your MEDDPICC deal coach.**

I can help you qualify the deal and find risk. Try asking:

• "Run a MEDDPICC audit"
• "Is my champion strong enough?"
• "How do I get to the economic buyer?"
• "What is missing from paper process?"
• "Help me clean up this forecast"`,
    fallbackMessage: `I'm not sure how to help with that specific MEDDPICC question.

Try asking:
• "Run a MEDDPICC audit"
• "Is my champion strong enough?"
• "How do I get to the economic buyer?"
• "Help" to see available topics`,
  },
}

function getMethodologyConfig(methodology: string | null | undefined): MethodologyConfig {
  const normalized = methodology?.trim().toLowerCase()
  if (!normalized || !methodologyConfigs[normalized]) {
    return methodologyConfigs.challenger
  }
  return methodologyConfigs[normalized]
}

async function matchIntent(question: string, config: MethodologyConfig) {
  const intentList = config.intents.map((intent, idx) =>
    `${idx + 1}. **${intent.name}** (${intent.stage})\n   Examples: ${intent.sample_user_utterances.slice(0, 2).join('; ')}`
  ).join('\n')

  const prompt = `You are an intent classifier for a ${config.classifierName}.

Given this question from a sales rep:
"${question}"

Match it to ONE of these intents:
${intentList}

Return ONLY the intent name, nothing else.
If none match well, return "unknown".`

  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }],
    })

    const intentName = completion.choices[0].message.content?.trim()
    if (!intentName || intentName === 'unknown') return null

    return config.intents.find((intent) => intent.name === intentName) || null
  } catch (error) {
    console.error('Intent matching error:', error)
    return null
  }
}

async function generateResponse(intent: CopilotIntent, question: string, config: MethodologyConfig, ragContext = '') {
  const ragSection = ragContext
    ? `\n\nCOACHING KNOWLEDGE from your knowledge base:\n${ragContext}\n\nUse this knowledge to inform your response. Reference specific patterns, scripts, or pitfalls that apply.`
    : ''

  const fullPrompt = `${config.systemPrompt}${ragSection}

Intent: ${intent.name}
Stage: ${intent.stage}
Bot Behavior: ${intent.bot_behavior}

User's question: "${question}"

Response templates:
${intent.response_templates.join('\n\n---\n\n')}

Generate a helpful, actionable response following ${config.label}.
Keep it concise: 2-3 short paragraphs max. The rep may be preparing for a call or needing fast guidance during one.
Use clear formatting with bullets where useful.`

  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 600,
      messages: [{ role: 'user', content: fullPrompt }],
    })

    const text = completion.choices[0].message.content
    if (!text) throw new Error('Empty response')
    return text
  } catch (error) {
    console.error('Response generation error:', error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('id, email, account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { data: account } = await supabase
      .from('Accounts')
      .select('methodology')
      .eq('id', userData.account_id)
      .single()

    const config = getMethodologyConfig(account?.methodology)

    if (question.toLowerCase().includes('help') || question.trim().length < 3) {
      await supabase
        .from('Copilot_Interactions')
        .insert({
          account_id: userData.account_id,
          user_id: userData.id,
          user_email: userData.email,
          question,
          intent_matched: 'help',
          response: config.helpMessage,
        })

      return NextResponse.json({
        response: config.helpMessage,
        intent: 'help',
        methodology: config.label,
      })
    }

    const intent = await matchIntent(question, config)

    if (!intent) {
      await supabase
        .from('Copilot_Interactions')
        .insert({
          account_id: userData.account_id,
          user_id: userData.id,
          user_email: userData.email,
          question,
          intent_matched: null,
          response: config.fallbackMessage,
        })

      return NextResponse.json({
        response: config.fallbackMessage,
        intent: null,
        methodology: config.label,
      })
    }

    // Query RAG for methodology-specific coaching knowledge
    const methodology = account?.methodology || 'challenger'
    const ragContext = await ragSearchLocally(question, methodology)

    const response = await generateResponse(intent, question, config, ragContext)

    const { data: interaction } = await supabase
      .from('Copilot_Interactions')
      .insert({
        account_id: userData.account_id,
        user_id: userData.id,
        user_email: userData.email,
        question,
        intent_matched: intent.name,
        response,
      })
      .select('id')
      .single()

    return NextResponse.json({
      response,
      intent: intent.name,
      interactionId: interaction?.id,
      methodology: config.label,
    })

  } catch (error) {
    console.error('Copilot chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
