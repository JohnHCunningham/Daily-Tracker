# Methodology Integration - Implementation Guide

## ✅ COMPLETED

### 1. Settings UI - Methodology Selection
**File:** `/app/(app)/settings/page.tsx`
- Added methodology selector with 5 options
- Saves to `Accounts.methodology` field in database
- Visual selector with descriptions for each methodology

### 2. Methodology-Specific Coaching Prompts
**Location:** `/lib/methodologies/`

All prompts are complete with distinct personalities:
- `spin-selling-prompt.md` - Patient Socratic mentor
- `gap-selling-prompt.md` - Clinical diagnostician
- `meddpicc-prompt.md` - Deal strategist
- Sandler & Challenger (reference existing implementations)

### 3. Intent Files (JSON) - All Complete ✅
**Location:** `/lib/methodologies/`

- ✅ `sandler-intents.json` (exists as `sales-copilot-intents.json`)
- ✅ `challenger-intents.json` (9 intents)
- ✅ `spin-intents.json` (9 intents)
- ✅ `gap-intents.json` (10 intents)
- ✅ `meddpicc-intents.json` (10 intents)

Each intent includes:
- `name` - Intent identifier
- `stage` - Methodology stage
- `sample_user_utterances` - 3-5 example questions
- `bot_behavior` - How to respond
- `response_templates` - 2+ response examples

---

## 🚀 NEXT STEP: Update Copilot API

### File to Update: `/app/api/copilot/chat/route.ts`

Currently hardcoded to Sandler. Update to dynamic methodology loading:

```typescript
// CURRENT (Hardcoded):
import intents from '@/lib/sales-copilot-intents.json'

const prompt = `You are a Sandler-certified sales coach...`

// UPDATED (Dynamic):
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { question } = await request.json()

    // Get user info
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('id, email, account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ NEW: Get account methodology
    const { data: account } = await supabase
      .from('Accounts')
      .select('methodology')
      .eq('id', userData.account_id)
      .single()

    const methodology = account?.methodology || 'sandler'

    // ✅ NEW: Load methodology-specific intents
    const intents = await loadMethodologyIntents(methodology)
    const systemPrompt = getMethodologyPrompt(methodology)

    // Match intent using methodology-specific intents
    const intent = await matchIntent(question, intents)

    if (!intent) {
      const fallback = getFallbackMessage(methodology)

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

    // Generate response using methodology-specific prompt
    const response = await generateResponse(intent, question, systemPrompt)

    // Log interaction
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

// ✅ NEW: Helper functions
function loadMethodologyIntents(methodology: string) {
  const methodologyMap: Record<string, string> = {
    'sandler': 'sales-copilot-intents.json',
    'challenger': 'methodologies/challenger-intents.json',
    'spin': 'methodologies/spin-intents.json',
    'gap': 'methodologies/gap-intents.json',
    'meddic': 'methodologies/meddpicc-intents.json',
    'meddpicc': 'methodologies/meddpicc-intents.json'
  }

  const intentFile = methodologyMap[methodology] || 'sales-copilot-intents.json'
  return require(`@/lib/${intentFile}`)
}

function getMethodologyPrompt(methodology: string): string {
  const prompts: Record<string, string> = {
    'sandler': `You are a Sandler-certified sales coach helping a rep in real-time...`,

    'challenger': `You are a Challenger Sales coach for B2B sales reps...
Your job is to push the rep's thinking, help them build commercial insights,
tailor to stakeholders, and take control of the sales process...`,

    'spin': `You are a SPIN Selling coach for B2B sales reps...
Your job is to help them ask better questions in the right sequence (S→P→I→N)
so buyers articulate their own need for change...`,

    'gap': `You are a Gap Selling coach for B2B sales reps...
Your job is to help them diagnose problems like a doctor - systematically,
thoroughly, without jumping to solutions. Quantify the gap between Current State
and Future State before ever presenting solutions...`,

    'meddic': `You are a MEDDPICC coach for enterprise B2B sales reps...
Your job is to help them qualify ruthlessly using the 8-element framework.
If they can't check all 8 boxes, they don't have a deal - they have hope...`
  }

  return prompts[methodology] || prompts['sandler']
}

function getFallbackMessage(methodology: string): string {
  const fallbacks: Record<string, string> = {
    'sandler': `I'm not sure how to help with that specific question.

Try asking:
• "Give me pain funnel questions"
• "They asked for pricing early"
• "How do I handle 'think it over'?"
• "Help" to see all available topics`,

    'challenger': `I'm not sure how to help with that specific question.

Try asking:
• "Help me build a commercial insight"
• "How do I tailor for the CFO?"
• "They're comparing us to competitors"
• "Help" to see all available topics`,

    'spin': `I'm not sure how to help with that specific question.

Try asking:
• "Give me implication questions"
• "What stage is this buyer in?"
• "How do I build urgency?"
• "Help" to see all available topics`,

    'gap': `I'm not sure how to help with that specific question.

Try asking:
• "Help me build an impact table"
• "How do I find the root cause?"
• "What's the gap value?"
• "Help" to see all available topics`,

    'meddic': `I'm not sure how to help with that specific question.

Try asking:
• "Run a MEDDPICC audit"
• "Is my champion strong enough?"
• "How do I get to the economic buyer?"
• "Help" to see all available topics`
  }

  return fallbacks[methodology] || fallbacks['sandler']
}

async function matchIntent(question: string, intents: any[]) {
  const intentList = intents.map((i, idx) =>
    `${idx + 1}. **${i.name}** (${i.stage})\n   Examples: ${i.sample_user_utterances.slice(0, 2).join('; ')}`
  ).join('\n')

  const prompt = `You are an intent classifier for a sales coaching bot.

Given this question from a sales rep:
"${question}"

Match it to ONE of these intents:
${intentList}

Return ONLY the intent name (e.g., "build_commercial_insight"), nothing else.
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

async function generateResponse(intent: any, question: string, systemPrompt: string) {
  const fullPrompt = `${systemPrompt}

Intent: ${intent.name}
Stage: ${intent.stage}
Bot Behavior: ${intent.bot_behavior}

User's question: "${question}"

Response templates:
${intent.response_templates.join('\n\n---\n\n')}

Generate a helpful, actionable response following the methodology.
Keep it CONCISE (2-3 paragraphs max) - they need quick guidance.
Use clear formatting with bullet points where appropriate.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: fullPrompt }]
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    return content.text
  } catch (error) {
    console.error('Response generation error:', error)
    throw error
  }
}
```

---

## 📊 Methodology Differentiation Summary

| Methodology | Voice | Primary Tool | When to Use |
|-------------|-------|--------------|-------------|
| **Sandler** | Tough-love psychologist | Pain Funnel, Negative Reversals | Transactional-mid complexity, one-on-one |
| **Challenger** | Contrarian professor | Commercial Insights, Stakeholder Tailoring | Complex B2B, competitive markets |
| **SPIN** | Patient Socratic mentor | S→P→I→N Question Sequence | Large sales, long cycles, committees |
| **Gap Selling** | Clinical diagnostician | Impact Tables, Root Cause Analysis | Custom/consultative sales |
| **MEDDPICC** | Deal strategist | 8-Element Checklist, Champion Testing | Enterprise, 6-10+ stakeholders |

---

## 🎯 Key Features of Each Methodology

### Sandler
- Celebrates disqualification
- Uses psychological reversals
- Equal business stature
- Emotional + business pain

### Challenger
- Teaches before discovering
- Reframes customer worldview
- Tailors to stakeholder roles
- Uses constructive tension

### SPIN
- Research-based (35,000 calls)
- Sequential question logic
- Implication = urgency builder
- Buyer articulates value

### Gap Selling
- Problem-centric, not solution-centric
- Refuses to present without diagnosis
- Quantifies everything
- Root cause obsessed

### MEDDPICC
- 8-element qualification framework
- Champion ≠ Coach distinction
- Economic Buyer access mandatory
- Forecast accuracy through rigor

---

## ✅ COMPLETE - Ready for Integration

All components are complete and ready to be integrated into the copilot after your audit:

1. ✅ Settings UI with methodology selector
2. ✅ 5 comprehensive coaching prompts
3. ✅ 5 intent JSON files (47 total intents)
4. ✅ Differentiation research and documentation
5. ✅ Implementation guide (this file)

**Next Action:** Update `/app/api/copilot/chat/route.ts` with the code above to enable dynamic methodology loading.
