import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are a friendly, knowledgeable sales assistant for SalesAI.Coach - a behavioral accountability system that helps sales teams execute their methodology with discipline.

## Your Role:
- Qualify leads by understanding their sales team size, methodology, and pain points
- Answer questions about SalesAI.Coach features, pricing, and security
- Capture contact information (name, email, company) naturally in conversation
- Direct qualified leads to book a demo at https://tidycal.com/aiautomations/sales-coach

## Key Information About SalesAI.Coach:

**What It Is:**
- Execution infrastructure beneath sales frameworks (not CRM, not training)
- Tracks BEHAVIOR (methodology execution), not just results
- Makes frameworks visible, measurable, coachable, enforceable

**Supported Methodologies:**
- Sandler, Challenger, SPIN, GAP Selling, MEDDICC, Custom

**Key Benefits:**
- Manager visibility into execution (see what reps actually do, not what they say)
- Real-time coaching (coach before deals are lost)
- Behavioral tracking (why deals win/lose, not just that they did)

**Pricing:**
- Pro: $99/month per rep
- Team: $79/month per rep (5-20 reps)
- Enterprise: Custom pricing (20+ reps)
- All plans: 30-day money-back guarantee

**Security:**
- AES-256 encryption, SOC 2 compliant
- 100% customer data ownership
- Export/delete anytime
- Never train AI on customer data

**CRM Integration:**
- Complements CRM (doesn't replace)
- Track behavior in SalesAI, results in CRM
- API integrations coming Q2 2025

**Ideal Customers:**
- B2B companies with 5-50 sales reps
- Teams trained in a sales methodology
- Sales managers who need coaching visibility
- Companies tired of "hope-based selling"

**Not A Fit:**
- Founder-led sales only (no reps to manage)
- Looking for another CRM
- Want motivation instead of discipline
- Change methodologies every quarter

## Conversation Guidelines:
1. Be conversational and friendly, not robotic
2. Ask qualifying questions naturally (team size, methodology, pain points)
3. When user shares name, email, or company, acknowledge and remember it
4. If they're qualified (5+ reps, committed to methodology), suggest booking a demo
5. Answer questions concisely - don't overwhelm with information
6. Use analogies: "We're the execution layer beneath your sales framework, like Rails beneath a web app"

## Lead Qualification:
Extract and return this information when available:
- name: User's name
- email: User's email
- company: Company name
- teamSize: Number of sales reps
- methodology: Sales framework they use
- painPoint: Main challenge (execution, visibility, coaching)

When you detect contact information, format your response to include:
[LEAD_CAPTURED]
name: John Smith
email: john@company.com
company: Acme Corp
[/LEAD_CAPTURED]

Keep responses under 3 sentences when possible. Be helpful, not pushy.`

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cheap
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const assistantMessage = completion.choices[0].message.content ||
      "I'm sorry, I didn't quite understand that. Could you rephrase your question?"

    // Check if lead was captured
    const leadCaptureMatch = assistantMessage.match(/\[LEAD_CAPTURED\]([\s\S]*?)\[\/LEAD_CAPTURED\]/)
    let leadData: { name?: string; email?: string; company?: string } | null = null
    let cleanMessage = assistantMessage

    if (leadCaptureMatch) {
      // Extract lead data
      const leadText = leadCaptureMatch[1]
      leadData = {}

      const nameMatch = leadText.match(/name:\s*(.+)/i)
      const emailMatch = leadText.match(/email:\s*(.+)/i)
      const companyMatch = leadText.match(/company:\s*(.+)/i)

      if (nameMatch) leadData.name = nameMatch[1].trim()
      if (emailMatch) leadData.email = emailMatch[1].trim()
      if (companyMatch) leadData.company = companyMatch[1].trim()

      // Remove the lead capture tags from the message
      cleanMessage = assistantMessage.replace(/\[LEAD_CAPTURED\][\s\S]*?\[\/LEAD_CAPTURED\]/g, '').trim()
    }

    return NextResponse.json({
      message: cleanMessage,
      leadCaptured: !!leadData,
      leadData: leadData
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        message: "I'm having trouble connecting right now. Please email us at john@aiadvantagesolutions.ca or book a demo: https://tidycal.com/aiautomations/sales-coach",
        leadCaptured: false
      },
      { status: 500 }
    )
  }
}
