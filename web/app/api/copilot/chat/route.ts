import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import intents from '@/lib/sales-copilot-intents.json'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Match user question to a Sandler intent using Claude
 */
async function matchIntent(question: string) {
  const intentList = intents.map((i, idx) =>
    `${idx + 1}. **${i.name}** (${i.stage})\n   Examples: ${i.sample_user_utterances.slice(0, 2).join('; ')}`
  ).join('\n')

  const prompt = `You are an intent classifier for a Sandler sales coaching bot.

Given this question from a sales rep:
"${question}"

Match it to ONE of these intents:
${intentList}

Return ONLY the intent name (e.g., "explore_pain"), nothing else.
If none match well, return "unknown".`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = message.content[0]
    if (content.type !== 'text') return null

    const intentName = content.text.trim()
    if (intentName === 'unknown') return null

    return intents.find(i => i.name === intentName) || null
  } catch (error) {
    console.error('Intent matching error:', error)
    return null
  }
}

/**
 * Generate Sandler coaching response using Claude
 */
async function generateResponse(intent: typeof intents[0], question: string) {
  const systemPrompt = `You are a Sandler-certified sales coach helping a rep in real-time during a call.

Intent: ${intent.name}
Stage: ${intent.stage}
Bot Behavior: ${intent.bot_behavior}

User's question: "${question}"

Response templates:
${intent.response_templates.join('\n\n---\n\n')}

Generate a helpful, actionable response following Sandler methodology.
Keep it CONCISE (2-3 paragraphs max) - they're on a live call.
Use clear formatting with bullet points where appropriate.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: systemPrompt }]
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

    // Get user info
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

    // Handle help command
    if (question.toLowerCase().includes('help') || question.trim().length < 3) {
      const helpMessage = `**I'm your Sandler sales coach!**

I can help you execute Sandler methodology during calls. Here's what to ask:

📋 **Getting Started**
• "Give me an upfront contract"
• "How should I start a Sandler call?"

💬 **Pain & Discovery**
• "Give me pain funnel questions"
• "How do I go deeper on pain?"

💰 **Budget & Objections**
• "They asked for pricing early"
• "They said 'too expensive'"
• "They said 'we'll think about it'"

🎯 **Decision & Close**
• "How do I find the real decision maker?"
• "They said 'send a proposal'"
• "How do I set a clear next step?"

Ask me anything about Sandler methodology!`

      // Log the interaction
      await supabase
        .from('Copilot_Interactions')
        .insert({
          account_id: userData.account_id,
          user_id: userData.id,
          user_email: userData.email,
          question: question,
          intent_matched: 'help',
          response: helpMessage
        })

      return NextResponse.json({
        response: helpMessage,
        intent: 'help'
      })
    }

    // Match intent
    const intent = await matchIntent(question)

    if (!intent) {
      const fallback = `I'm not sure how to help with that specific question.

Try asking:
• "Give me pain funnel questions"
• "They asked for pricing early"
• "How do I handle 'think it over'?"
• "Help" to see all available topics`

      // Log the interaction
      await supabase
        .from('Copilot_Interactions')
        .insert({
          account_id: userData.account_id,
          user_id: userData.id,
          user_email: userData.email,
          question: question,
          intent_matched: null,
          response: fallback
        })

      return NextResponse.json({
        response: fallback,
        intent: null
      })
    }

    // Generate response
    const response = await generateResponse(intent, question)

    // Log the interaction
    const { data: interaction } = await supabase
      .from('Copilot_Interactions')
      .insert({
        account_id: userData.account_id,
        user_id: userData.id,
        user_email: userData.email,
        question: question,
        intent_matched: intent.name,
        response: response
      })
      .select('id')
      .single()

    return NextResponse.json({
      response,
      intent: intent.name,
      interactionId: interaction?.id
    })

  } catch (error) {
    console.error('Copilot chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
