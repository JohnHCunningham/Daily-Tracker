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
    const { transcript, callType } = await req.json()

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build Sandler analysis prompt
    const sandlerPrompt = `
You are an expert Sandler Sales trainer analyzing a sales conversation.

IMPORTANT: Be FACTUAL and EVIDENCE-BASED. Cite specific quotes from the transcript to support every observation.

Conversation Type: ${callType}

REFERENCE SCRIPT (AI Advantage Solutions):
Opening: "Hi [Person], this is John from AI Advantage Solutions here in Hamilton. I know I'm catching you cold, so I'll be brief."
Value Prop: "I help mixed-income community providers like [Person] save up to 20 hours per week by automating repetitive tasks—things like maintenance requests, tenant communications, and compliance tracking."
CTA: "I'd love to show you how in a quick 15-minute online meeting. Do you have your calendar handy, or would [Date] at [Time] work better?"

TRANSCRIPT:
${transcript}

ANALYZE using Sandler Sales System methodology + Script Adherence:

1. SCRIPT ADHERENCE (Score 1-10)
   - Did they follow the opening structure?
   - Did they mention local connection (Hamilton)?
   - Did they state the value prop (20 hours saved, automation)?
   - Did they use the soft CTA (15-minute meeting)?
   - Quote evidence: [what they actually said]

2. UP-FRONT CONTRACT (Score 1-10)
   - Did they set clear expectations at the start?
   - Quote evidence: [exact quote]

3. BONDING & RAPPORT (Score 1-10)
   - Did they build trust before business?
   - Quote evidence: [exact quote]

4. PAIN FUNNEL (Score 1-10)
   - Did they uncover compelling pain?
   - Pain questions asked: [list with quotes]
   - Pain identified: Yes/No with evidence

5. BUDGET (Score 1-10)
   - Did they discuss budget/investment?
   - Quote evidence: [exact quote]

6. DECISION PROCESS (Score 1-10)
   - Did they identify decision-makers?
   - Quote evidence: [exact quote]

7. TALK/LISTEN RATIO (Score 1-10)
   - Estimate: Rep talked X%, Prospect Y%
   - Target: 30% rep / 70% prospect

8. NEGATIVE REVERSE SELLING (Yes/No)
   - Did they remove pressure?
   - Quote evidence if used

9. OBJECTION HANDLING (Score 1-10)
   - If objections came up, how well handled?
   - Did they follow script responses?
   - Quote evidence

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
  "what_went_well": ["item1", "item2"],
  "areas_to_improve": ["item1", "item2"],
  "recommendations": ["item1", "item2"]
}

ONLY include observations you can PROVE from the transcript.
`

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
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: sandlerPrompt
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
