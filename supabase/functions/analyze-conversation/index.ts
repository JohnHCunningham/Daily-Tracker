// Supabase Edge Function: Analyze Conversation with Claude
// This keeps your API key secure on the server

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // Get request body
    const { transcript, callType, methodology = 'sandler', scripts } = await req.json()

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build methodology-specific coaching prompt
    const coachingPrompt = getMethodologyPrompt(methodology, transcript, callType, scripts)

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: coachingPrompt
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${response.status} ${error}`)
    }

    const data = await response.json()
    const analysisText = data.content[0].text

    // Parse JSON from Claude's response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response')
    }

    const analysis = JSON.parse(jsonMatch[0])

    // Return the analysis
    return new Response(
      JSON.stringify(analysis),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

// Helper function to generate methodology-specific prompts
function getMethodologyPrompt(methodology: string, transcript: string, callType: string, scripts?: any): string {
  // Build reference scripts section if provided
  let scriptsSection = '';
  if (scripts) {
    scriptsSection = `
REFERENCE SCRIPTS (User's Custom Scripts):
Opening: "${scripts.opening || 'Not provided'}"
Value Prop: "${scripts.valueProp || 'Not provided'}"
CTA: "${scripts.cta || 'Not provided'}"
Objection Handling: "${scripts.objections || 'Not provided'}"
Business: ${scripts.businessDescription || 'Not provided'}
`;
  } else {
    // Default/fallback scripts
    scriptsSection = `
REFERENCE SCRIPTS (Default):
Opening: "Hi [Name], this is [Your Name] from [Company] here in [Location]. I know I'm catching you cold, so I'll be brief."
Value Prop: "I help [Target Customer] achieve [Specific Benefit] by [Solution]."
CTA: "I'd love to show you how in a quick 15-minute online meeting. Do you have your calendar handy?"
`;
  }

  const basePrompt = `
You are an expert sales trainer and tactical coach. Your job is to analyze this conversation and provide SPECIFIC, ACTIONABLE scripts and alternatives.

IMPORTANT:
- Be FACTUAL and quote the actual transcript
- Provide EXACT WORDS and SPECIFIC SCRIPTS for what to say next time
- Give 2-3 ALTERNATIVE responses for key moments
- Show ROLE-PLAY examples: "You say... They say... You say..."
- Compare the actual conversation to the reference scripts below

${scriptsSection}

Conversation Type: ${callType}

TRANSCRIPT:
${transcript}
`

  if (methodology === 'sandler') {
    return basePrompt + `

ANALYZE USING SANDLER SELLING SYSTEM:

1. OPENING ANALYSIS
   - What they said: [quote]
   - Score: X/10
   - What worked: [specific elements]
   - Tactical improvement - Try these alternatives next time:
     * Option 1: "[exact script]"
     * Option 2: "[exact script with different angle]"
     * Option 3: "[negative reverse version]"
   - Sandler principle: [explain the rule being applied]

2. UP-FRONT CONTRACT
   - What they said: [quote or "not used"]
   - Score: X/10
   - Tactical script for next time:
     "Before we dive in, let me make sure this is worth your time. I'd like to ask you a few questions about [their pain]. At the end, you can tell me 'yes, let's move forward,' 'no, not a fit,' or 'let's talk later.' Fair enough?"
   - Alternative if they're skeptical:
     "I'm not sure if what we do is even relevant to you, but would it make sense to spend 10 minutes finding out? Worst case, we'll both know it's not a match."

3. BONDING & RAPPORT
   - What they did: [quote]
   - Score: X/10
   - Missed opportunities: [specific moments]
   - Tactical scripts to build rapport:
     * "How's your day going?" [PAUSE and listen]
     * "That sounds frustrating. Tell me more about that."
     * "I appreciate you being straight with me."
   - Mirroring technique: When they say "[their phrase]", echo it back: "So what I'm hearing is [their phrase]... is that right?"

4. PAIN FUNNEL - THE GOLD MINE
   - Questions they asked: [list with quotes]
   - Questions they MISSED: [critical gaps]
   - Score: X/10

   TACTICAL PAIN FUNNEL SEQUENCE (Use in this order):
   1. "Tell me about your current process for [their problem]..."
   2. "How long has this been going on?"
   3. "What have you tried to fix it?"
   4. "How much is this costing you?" [time, money, frustration]
   5. "What happens if you don't solve this?" [future pain]
   6. "Have you given up on fixing it, or are you still looking for solutions?"

   CRITICAL: After each answer, ask: "Tell me more about that" or "Can you give me an example?"

5. BUDGET DISCUSSION (NOT PRICE!)
   - What they said: [quote or "avoided"]
   - Score: X/10
   - Tactical scripts (Sandler rule: "Talk budget before talking price"):
     * "If I could show you a way to save 20 hours a week, what kind of investment would make sense for that?"
     * "Most housing providers in your situation invest between X and Y for a solution like this. Is that in the ballpark?"
     * "What budget have you set aside for solving this problem?"
   - If they deflect: "I understand you might not have exact numbers, but just to make sure we're not wasting each other's time - is this a $1,000 problem, a $10,000 problem, or somewhere in between?"

6. DECISION PROCESS
   - What they uncovered: [quote]
   - Score: X/10
   - Tactical scripts:
     * "Who else besides you would be involved in making this decision?"
     * "Walk me through how decisions like this typically get made at [Company]."
     * "What would stop this from moving forward, even if you love it?"
   - Red flag script: If they say "I need to talk to my boss":
     "I appreciate that. Help me understand - if this is perfect for you, what's the conversation you'll have with them? What questions will they ask that I should help you answer?"

7. TALK/LISTEN RATIO
   - Estimate: Rep talked X%, Prospect talked Y%
   - Target: 30% you / 70% them
   - Score: X/10
   - Tactical fix: After every statement, ask a question. After they answer, say: "Tell me more" or "What else?"

8. NEGATIVE REVERSE SELLING (Remove Pressure)
   - Used: Yes/No
   - Quote: [if used]
   - Score: X/10
   - Tactical scripts to remove pressure:
     * "I'm not sure if we're a fit, but would it make sense to explore that?"
     * "You might decide this isn't for you, and that's perfectly okay."
     * "I don't want you to buy anything today. I just want to see if this makes sense for you."
     * When they show interest: "What makes you say that?" (forces them to sell themselves)

9. OBJECTION HANDLING
   - Objections raised: [list with quotes]
   - How they handled: [quote]
   - Score: X/10

   TACTICAL OBJECTION RESPONSES:

   "I need to think about it"
   → "That's fair. What specifically do you need to think about? Is it the investment, the timing, or something else?"

   "Send me some information"
   → "Happy to. What specific information would be most helpful? And just so I don't waste your time, after you review it, what happens next?"

   "We don't have budget right now"
   → "I understand. Just curious - if budget weren't an issue, is this something you'd want to move forward with?" [Then deal with real objection]

   "I'm too busy"
   → "I get it. And that's exactly why I called - to potentially give you back 20 hours a week. If I could show you how in 15 minutes, would that be worth it?"

10. TACTICAL PLAYBOOK FOR NEXT CALL

Provide 3-5 SPECIFIC scripts to use next time:

Example format:
"When they say: '[common objection]'
You respond: '[Sandler script]'
Why it works: [Sandler principle]"

CRITICAL: Provide complete coaching in 4 categories:

1. STRENGTHS (what_went_well): What they executed well, with specific quotes
2. WEAKNESSES (areas_to_improve): What they did but could do better
3. OMISSIONS: What they COMPLETELY FORGOT or NEVER DID
   - Did NOT set up-front contract
   - Did NOT discuss budget at all
   - Did NOT ask pain funnel questions
   - Did NOT use negative reverse selling
   - MISSED asking about decision process
   - MISSED building rapport at opening
4. SUGGESTIONS (tactical_scripts + next_call_playbook): Exact scripts for next time

Return JSON in this exact format:
{
  "overall_score": 7.5,
  "upfront_contract_score": 6.0,
  "pain_funnel_score": 8.0,
  "budget_discussion_score": 5.0,
  "decision_process_score": 7.0,
  "bonding_rapport_score": 9.0,
  "talk_ratio_score": 6.5,
  "talk_percentage": 45,
  "question_count": 12,
  "pain_identified": true,
  "budget_discussed": false,
  "decision_makers_identified": true,
  "upfront_contract_set": false,
  "negative_reverse_used": true,
  "what_went_well": ["Specific thing with quote", "Another specific win"],
  "areas_to_improve": ["Specific tactical fix", "Another specific fix"],
  "omissions": ["Did NOT set up-front contract", "Did NOT discuss budget at all", "MISSED asking decision process questions"],
  "tactical_scripts": {
    "opening_alternatives": ["Script 1", "Script 2", "Script 3"],
    "upfront_contract": "Exact script to use",
    "pain_funnel_sequence": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"],
    "budget_discussion": "Script to use",
    "objection_responses": {
      "objection_1": "How to respond",
      "objection_2": "How to respond"
    }
  },
  "role_play_examples": [
    "Scenario 1: You say... They say... You say...",
    "Scenario 2: You say... They say... You say..."
  ],
  "next_call_playbook": ["Specific script 1 to use next time", "Specific script 2", "Specific script 3"]
}

Be SPECIFIC. Quote the transcript. Provide EXACT WORDS for scripts. Make it immediately actionable.
`
  } else if (methodology === 'spin') {
    return basePrompt + `

ANALYZE USING SPIN SELLING:

Focus on the quality of Situation, Problem, Implication, and Need-Payoff questions.

1. SITUATION QUESTIONS (Background/Context)
   - Questions asked: [list with quotes]
   - Effectiveness: X/10
   - Suggested improvements: [specific better questions]

2. PROBLEM QUESTIONS (Difficulties/Dissatisfactions)
   - Questions asked: [list with quotes]
   - Problems uncovered: [list]
   - Score: X/10
   - Missing questions: [what should have been asked]

3. IMPLICATION QUESTIONS (Consequences/Effects)
   - Used: Yes/No [with quotes]
   - Impact explored: [what consequences were discussed]
   - Score: X/10
   - Tactical scripts: "What happens if this problem continues for another 6 months?" "How does this affect your team's productivity?"

4. NEED-PAYOFF QUESTIONS (Value/Benefits)
   - Used: Yes/No [with quotes]
   - Value built: [how benefits were positioned]
   - Score: X/10
   - Tactical scripts: "How would solving this help you personally?" "What would be different if this problem went away?"

Return JSON with scores and tactical scripts for improvement.
`
  } else if (methodology === 'challenger') {
    return basePrompt + `

ANALYZE USING THE CHALLENGER SALE:

Evaluate how well they Teach, Tailor, and Take Control.

1. TEACH (Did they teach something new?)
   - Insight provided: [quote or "none"]
   - Reframe attempted: Yes/No
   - Score: X/10
   - Tactical improvement: "Here's what we're seeing with companies like yours... [unexpected insight]"

2. TAILOR (Personalized to their situation?)
   - Company-specific references: [quotes]
   - Resonance: X/10
   - Tactical improvement: Research their specific challenges and reference them

3. TAKE CONTROL (Assertive guidance?)
   - Push-back handled: [how]
   - Control maintained: X/10
   - Tactical scripts for constructive tension

Return JSON with scores and specific coaching on teaching, tailoring, and taking control.
`
  } else if (methodology === 'gap') {
    return basePrompt + `

ANALYZE USING GAP SELLING:

Focus on Current State, Future State, and Gap identification.

1. CURRENT STATE ANALYSIS
   - Problems identified: [list with quotes]
   - Root causes explored: Yes/No
   - Score: X/10

2. FUTURE STATE VISION
   - Vision created: [quote or "not done"]
   - Impact quantified: Yes/No
   - Score: X/10
   - Tactical script: "What would success look like 6 months from now?"

3. GAP IDENTIFICATION
   - Gap explicitly stated: Yes/No
   - Impact of inaction discussed: Yes/No
   - Score: X/10
   - Tactical script: "So the gap between where you are (current state) and where you need to be (future state) is... [summarize]. What's the cost of leaving this gap open?"

Return JSON with scores and gap-focused tactical scripts.
`
  } else {
    // Generic sales coaching for solution/value/consultative/custom
    return basePrompt + `

ANALYZE USING SALES BEST PRACTICES:

1. DISCOVERY QUALITY
   - Questions asked: [count and quality]
   - Pain/needs uncovered: [list]
   - Score: X/10

2. VALUE COMMUNICATION
   - How value was presented: [quote]
   - Tied to customer needs: Yes/No
   - Score: X/10

3. OBJECTION HANDLING
   - Objections raised: [list]
   - How handled: [quotes]
   - Score: X/10

4. NEXT STEPS
   - Clear next steps defined: Yes/No
   - Commitment secured: [what kind]
   - Score: X/10

5. TALK/LISTEN RATIO
   - Estimate: Rep X% / Prospect Y%
   - Score: X/10

Return JSON with scores and tactical scripts for improvement based on general sales best practices.
`
  }
}
