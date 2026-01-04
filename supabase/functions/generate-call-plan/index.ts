// Supabase Edge Function: Generate Call Plan with Claude
// Creates methodology-based call agendas

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

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
    const { description, methodology = 'meddic', icp, scripts } = await req.json()

    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build the AI prompt
    const prompt = buildCallPlanPrompt(description, methodology, icp, scripts)

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
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${response.status} ${error}`)
    }

    const data = await response.json()
    const planText = data.content[0].text

    // Parse JSON from Claude's response
    const jsonMatch = planText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response')
    }

    const plan = JSON.parse(jsonMatch[0])

    return new Response(
      JSON.stringify(plan),
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

function buildCallPlanPrompt(description: string, methodology: string, icp: any, scripts: any): string {
  const methodologyInfo = getMethodologyInfo(methodology)

  let icpContext = ''
  if (icp) {
    icpContext = `
ICP CONTEXT (Target Customer Profile):
Industry: ${icp.industry || 'Not specified'}
Company Size: ${icp.companySize || 'Not specified'}
Pain Points: ${icp.painPoints || 'Not specified'}
Budget Range: ${icp.budget || 'Not specified'}
`
  }

  let scriptsContext = ''
  if (scripts) {
    scriptsContext = `
REFERENCE SCRIPTS (User's Custom Scripts):
Opening: "${scripts.opening || 'Not provided'}"
Value Prop: "${scripts.valueProp || 'Not provided'}"
CTA: "${scripts.cta || 'Not provided'}"
Business: ${scripts.businessDescription || 'Not provided'}
`
  }

  return `
You are an expert sales coach. Create a detailed, actionable call plan based on ${methodologyInfo.name}.

CRITICAL - VARY YOUR LANGUAGE:
- Don't use templated language - make this plan feel UNIQUE
- Vary your phrasing and tone
- Sound like a real coach preparing a rep for THIS specific call
- Use different examples and analogies each time

${icpContext}

${scriptsContext}

CALL SITUATION:
${description}

CREATE A CALL PLAN USING ${methodologyInfo.name.toUpperCase()}:

${methodologyInfo.planningGuidance}

Return JSON in this exact format:
{
  "call_title": "Discovery Call with [Company Name]",
  "call_objective": "One sentence describing what you want to achieve",
  "agenda": [
    "Opening (30 sec) - Build rapport, set up-front contract",
    "Discovery (8 min) - Uncover pain with Pain Funnel",
    "Budget Discussion (2 min) - Get investment range",
    "Decision Process (2 min) - Identify stakeholders",
    "Close (1 min) - Next steps commitment"
  ],
  "opening_script": "Exact words to use when opening the call",
  "questions_to_ask": [
    "${methodologyInfo.name}-specific question 1",
    "${methodologyInfo.name}-specific question 2",
    "${methodologyInfo.name}-specific question 3",
    "${methodologyInfo.name}-specific question 4",
    "${methodologyInfo.name}-specific question 5"
  ],
  "unknowns_to_uncover": [
    "Decision makers: Who else is involved?",
    "Budget: What's the investment range?",
    "Timeline: When do they need this solved?"
  ],
  "objection_prep": [
    {
      "objection": "Most likely objection based on situation",
      "response": "Specific ${methodologyInfo.name}-based response"
    },
    {
      "objection": "Second likely objection",
      "response": "How to handle it"
    }
  ],
  "closing_strategy": "Exactly how to close the call and get commitment to next steps"
}

Be SPECIFIC to this call. Reference their actual situation. Make it feel TAILORED, not generic.
`
}

function getMethodologyInfo(methodology: string) {
  const methodologies: any = {
    sandler: {
      name: 'Sandler Selling System',
      planningGuidance: `
SANDLER PLANNING PRINCIPLES:
1. Set up-front contract at the start
2. Use Pain Funnel to go deep on problems
3. Discuss budget BEFORE presenting solutions
4. Identify decision process and stakeholders
5. Use negative reverse selling to remove pressure
6. Talk 30% / Listen 70%

Create a plan that focuses on:
- Pain discovery (not solution selling)
- Budget qualification
- Decision process mapping
- Removing sales pressure
`
    },
    meddic: {
      name: 'MEDDIC/MEDDPICC',
      planningGuidance: `
MEDDIC PLANNING PRINCIPLES:
Qualify the opportunity using:
- Metrics: What measurable impact do they need?
- Economic Buyer: Who controls the budget?
- Decision Criteria: What are they evaluating?
- Decision Process: How will they decide?
- Identify Pain: What's the compelling event?
- Champion: Who's selling internally for you?

Create questions to uncover all MEDDIC elements.
`
    },
    challenger: {
      name: 'Challenger Sale',
      planningGuidance: `
CHALLENGER PLANNING PRINCIPLES:
1. TEACH: Bring an insight they haven't considered
2. TAILOR: Make it specific to their situation
3. TAKE CONTROL: Guide the conversation assertively

Plan to:
- Lead with a provocative insight
- Reframe how they think about their problem
- Challenge their current approach (constructively)
- Take control of next steps
`
    },
    spin: {
      name: 'SPIN Selling',
      planningGuidance: `
SPIN PLANNING PRINCIPLES:
Sequence your questions:
1. SITUATION: Understand background
2. PROBLEM: Uncover difficulties
3. IMPLICATION: Explore consequences
4. NEED-PAYOFF: Build value of solution

Create a question sequence that builds from situation to need-payoff.
`
    },
    gap: {
      name: 'Gap Selling',
      planningGuidance: `
GAP SELLING PLANNING PRINCIPLES:
1. Current State: Where are they now?
2. Future State: Where do they need to be?
3. Gap: What's preventing them from getting there?
4. Impact: What's the cost of the gap staying open?

Plan questions to map current state → future state → gap → impact.
`
    }
  }

  return methodologies[methodology] || methodologies['meddic']
}
