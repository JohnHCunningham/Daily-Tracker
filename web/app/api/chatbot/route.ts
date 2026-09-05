import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are an AI sales coaching assistant for One Click Coaching - a behavioral accountability platform for sales teams.

## Your Role:
- Help visitors understand how One Click Coaching works
- Answer questions about features, pricing, and supported methodologies
- Qualify leads by understanding their team size, methodology, and pain points
- Naturally capture contact information and suggest booking a demo

## About One Click Coaching:

**Core Value:**
We're the execution layer beneath your sales framework - making methodology adherence visible, measurable, and coachable.

**Methodology Support (IMPORTANT):**
We're methodology-agnostic and support:
- Sandler
- Challenger
- MEDDIC
- SPIN Selling
- Gap Selling
- Custom/proprietary methodologies

**What We Do:**
- Track BEHAVIOR (methodology execution), not just results
- Give managers visibility into what reps actually do on calls
- Enable real-time coaching before deals are lost
- Make sales frameworks measurable and enforceable

**What We're NOT:**
- Not a CRM (we complement your existing CRM)
- Not sales training (we reinforce training you already have)
- Not motivation software (we focus on discipline and execution)

**Pricing:**
- Pro: $99/month per rep
- Team: $79/month per rep (5-20 reps)
- Enterprise: Custom pricing (20+ reps)
- All plans: 30-day money-back guarantee

**Ideal Customers:**
- B2B companies with 5-50 sales reps
- Teams already trained in a sales methodology
- Managers who need coaching visibility
- Companies struggling with methodology adherence

**Security:**
- AES-256 encryption, SOC 2 compliant
- 100% customer data ownership
- Export/delete anytime
- Never train AI on customer data

## Conversation Guidelines:
1. Be conversational and insightful, not sales-y
2. Ask qualifying questions naturally (team size, methodology, pain points)
3. Use the knowledge base to give detailed, accurate answers
4. When the visitor shares name, email, or company, acknowledge and remember it
5. For qualified leads (5+ reps, committed to methodology), suggest: https://tidycal.com/aiautomations/sales-coach
6. Answer questions concisely - don't overwhelm

## Lead Qualification:
When you detect contact information, format your response to include:
[LEAD_CAPTURED]
name: John Smith
email: john@company.com
company: Acme Corp
teamSize: 15
methodology: Sandler
painPoint: methodology adherence
[/LEAD_CAPTURED]

Keep responses under 4 sentences when possible. Be helpful and insightful.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json() as { messages: Message[] }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { message: "Please send a message to start the conversation." },
        { status: 400 }
      )
    }

    // Get the latest user message for RAG search
    const latestUserMessage = messages[messages.length - 1].content

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Generate embedding for the user's question using OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: latestUserMessage,
    })

    const queryEmbedding = embeddingResponse.data[0].embedding

    // Search knowledge base for relevant context using vector similarity
    const { data: relevantKnowledge, error: kbError } = await supabase
      .rpc('search_sandler_content', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: 0.6,
        match_count: 3,
        filter_methodology: null, // Include all methodologies
      })

    let contextFromKB = ''
    if (!kbError && relevantKnowledge && relevantKnowledge.length > 0) {
      contextFromKB = '\n\nRelevant Knowledge Base Context:\n' +
        relevantKnowledge
          .map((item: any) => `- ${item.chunk_title}: ${item.chunk_text.substring(0, 500)}...`)
          .join('\n\n')
    }

    // Build the conversation for Claude
    const anthropicMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Call Claude API with RAG context
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: SYSTEM_PROMPT + contextFromKB,
      messages: anthropicMessages as any,
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : "I'm sorry, I didn't quite understand that. Could you rephrase your question?"

    // Check if lead was captured
    const leadCaptureMatch = assistantMessage.match(/\[LEAD_CAPTURED\]([\s\S]*?)\[\/LEAD_CAPTURED\]/)
    let leadData: {
      name?: string
      email?: string
      company?: string
      teamSize?: string
      methodology?: string
      painPoint?: string
    } | null = null
    let cleanMessage = assistantMessage

    if (leadCaptureMatch) {
      // Extract lead data
      const leadText = leadCaptureMatch[1]
      leadData = {}

      const nameMatch = leadText.match(/name:\s*(.+)/i)
      const emailMatch = leadText.match(/email:\s*(.+)/i)
      const companyMatch = leadText.match(/company:\s*(.+)/i)
      const teamSizeMatch = leadText.match(/teamSize:\s*(.+)/i)
      const methodologyMatch = leadText.match(/methodology:\s*(.+)/i)
      const painPointMatch = leadText.match(/painPoint:\s*(.+)/i)

      if (nameMatch) leadData.name = nameMatch[1].trim()
      if (emailMatch) leadData.email = emailMatch[1].trim()
      if (companyMatch) leadData.company = companyMatch[1].trim()
      if (teamSizeMatch) leadData.teamSize = teamSizeMatch[1].trim()
      if (methodologyMatch) leadData.methodology = methodologyMatch[1].trim()
      if (painPointMatch) leadData.painPoint = painPointMatch[1].trim()

      // Remove the lead capture tags from the message
      cleanMessage = assistantMessage.replace(/\[LEAD_CAPTURED\][\s\S]*?\[\/LEAD_CAPTURED\]/g, '').trim()

      // Send email notification
      if (leadData.email) {
        await sendLeadNotification(leadData)
      }

      // Store lead in database
      await supabase.from('chatbot_leads').insert({
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        team_size: leadData.teamSize,
        methodology: leadData.methodology,
        pain_point: leadData.painPoint,
        conversation: messages,
      })
    }

    return NextResponse.json({
      message: cleanMessage,
      leadCaptured: !!leadData,
      leadData: leadData
    })

  } catch (error) {
    console.error('Chatbot API error:', error)
    return NextResponse.json(
      {
        message: "I'm having trouble connecting right now. Please email us at john@oneclickcoaching.com or book a demo: https://tidycal.com/aiautomations/sales-coach",
        leadCaptured: false
      },
      { status: 500 }
    )
  }
}

async function sendLeadNotification(leadData: any) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'One Click Coaching <noreply@oneclickcoaching.com>',
      to: ['john@aiadvantagesolutions.ca', 'john@oneclickcoaching.com'],
      subject: `🎯 New Lead from Chatbot: ${leadData.name || 'Unknown'}`,
      html: `
        <h2>New Lead Captured from Website Chatbot</h2>
        <p><strong>Name:</strong> ${leadData.name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${leadData.email || 'Not provided'}</p>
        <p><strong>Company:</strong> ${leadData.company || 'Not provided'}</p>
        <p><strong>Team Size:</strong> ${leadData.teamSize || 'Not provided'}</p>
        <p><strong>Methodology:</strong> ${leadData.methodology || 'Not provided'}</p>
        <p><strong>Pain Point:</strong> ${leadData.painPoint || 'Not provided'}</p>
        <hr />
        <p><em>Lead captured at: ${new Date().toLocaleString()}</em></p>
      `
    })
  } catch (error) {
    console.error('Failed to send lead notification:', error)
    // Don't throw - we don't want to fail the chat if email fails
  }
}
