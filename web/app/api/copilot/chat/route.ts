import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import sandlerIntents from '@/lib/sales-copilot-intents.json'
import challengerIntents from '@/lib/methodologies/challenger-intents.json'
import gapIntents from '@/lib/methodologies/gap-intents.json'
import meddicIntents from '@/lib/methodologies/meddic-intents.json'
import meddpiccIntents from '@/lib/methodologies/meddpicc-intents.json'
import spinIntents from '@/lib/methodologies/spin-intents.json'

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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const methodologyConfigs: Record<string, MethodologyConfig> = {
  sandler: {
    label: 'Sandler',
    classifierName: 'Sandler sales coaching bot',
    intents: sandlerIntents as CopilotIntent[],
    systemPrompt: `You are a Sandler-certified sales coach helping a rep prepare for or navigate a live sales conversation.

Coach from Sandler principles: equal business stature, upfront contracts, pain discovery, budget and decision clarity, negative reversals, and no free consulting. Be direct, practical, and willing to help the rep disqualify bad-fit opportunities.`,
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
    systemPrompt: `You are a Challenger Sales coach for B2B sales reps.

Coach from Challenger principles: teach with commercial insight, reframe the customer's assumptions, tailor the message to each stakeholder, and take constructive control of the buying process. Push the rep to create value through a sharper point of view, not by asking generic discovery questions.`,
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
    label: 'MEDDIC',
    classifierName: 'MEDDIC sales coaching bot',
    intents: meddicIntents as CopilotIntent[],
    systemPrompt: `You are a MEDDIC/MEDDPICC coach for enterprise B2B sales reps.

Coach from deal qualification principles: Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, and Champion. Where useful, include Paper Process and Competition. Be rigorous. If an element is weak, call it a forecast risk and give the next concrete action.`,
    helpMessage: `**I'm your MEDDIC deal coach.**

I can help you qualify the deal and find risk. Try asking:

• "Run a MEDDIC audit"
• "How do I get to the economic buyer?"
• "Is my champion strong enough?"
• "What metrics do I need?"
• "Help me clean up this forecast"`,
    fallbackMessage: `I'm not sure how to help with that specific MEDDIC question.

Try asking:
• "Run a MEDDIC audit"
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
  const normalized = methodology?.trim().toLowerCase() || 'sandler'
  return methodologyConfigs[normalized] || methodologyConfigs.sandler
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
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return null

    const intentName = content.text.trim()
    if (intentName === 'unknown') return null

    return config.intents.find((intent) => intent.name === intentName) || null
  } catch (error) {
    console.error('Intent matching error:', error)
    return null
  }
}

async function generateResponse(intent: CopilotIntent, question: string, config: MethodologyConfig) {
  const fullPrompt = `${config.systemPrompt}

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
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: fullPrompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    return content.text
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

    const response = await generateResponse(intent, question, config)

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
