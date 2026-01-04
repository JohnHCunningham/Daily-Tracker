// Supabase Edge Function: Fireflies Webhook
// Receives calls from Fireflies.ai and auto-analyzes them

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
        'Access-Control-Allow-Headers': '*',
      }
    })
  }

  try {
    console.log('📞 Received Fireflies webhook')

    // Parse Fireflies payload
    const payload = await req.json()
    console.log('Payload:', JSON.stringify(payload, null, 2))

    // Extract data from Fireflies webhook
    // Fireflies sends: { transcript, title, duration, participants, date, etc. }
    const {
      transcript,
      title,
      duration,
      participants,
      date,
      meeting_attendees,
      sentences,
      summary
    } = payload

    if (!transcript && !sentences) {
      console.error('No transcript found in payload')
      return new Response(
        JSON.stringify({ error: 'No transcript provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Construct full transcript from sentences if needed
    let fullTranscript = transcript
    if (!fullTranscript && sentences && sentences.length > 0) {
      fullTranscript = sentences.map((s: any) =>
        `${s.speaker_name || 'Speaker'}: ${s.text}`
      ).join('\n')
    }

    // Extract call title (use title or first participant)
    const callTitle = title ||
      (participants && participants.length > 0 ? `Call with ${participants[0].name}` : 'Sales Call')

    // Determine call type from title/content
    const callType = determineCallType(callTitle, fullTranscript)

    console.log(`📋 Call: "${callTitle}" | Type: ${callType}`)

    // For now, we'll use a default user ID
    // In production, you'd identify the user from Fireflies email or custom field
    // You can add user identification logic here based on participants

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get methodology and scripts from user settings
    // For now using defaults - in production you'd look this up by user
    const methodology = 'sandler' // Default methodology
    const scripts = null // User's scripts would be loaded here

    console.log('🤖 Analyzing with methodology:', methodology)

    // Call the analyze-conversation function
    const analysisResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        transcript: fullTranscript,
        callType: callType,
        methodology: methodology,
        scripts: scripts
      })
    })

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text()
      throw new Error(`Analysis failed: ${error}`)
    }

    const analysis = await analysisResponse.json()
    console.log('✅ Analysis complete:', analysis.overall_score)

    // Save to database
    // Note: In production, you'd need to identify which user this call belongs to
    // For now, this will work for single-user setups
    const { data, error } = await supabase
      .from('Conversation_Analyses')
      .insert({
        // user_id would come from identifying the Fireflies user
        date: date || new Date().toISOString().split('T')[0],
        conversation_title: callTitle,
        conversation_type: callType,
        transcript: fullTranscript,
        overall_sandler_score: analysis.overall_score,
        upfront_contract_score: analysis.upfront_contract_score,
        pain_funnel_score: analysis.pain_funnel_score,
        budget_discussion_score: analysis.budget_discussion_score,
        decision_process_score: analysis.decision_process_score,
        bonding_rapport_score: analysis.bonding_rapport_score,
        talk_listen_ratio_score: analysis.talk_ratio_score,
        what_went_well: analysis.what_went_well,
        areas_to_improve: analysis.areas_to_improve,
        omissions: analysis.omissions,
        specific_recommendations: analysis.recommendations,
        talk_percentage: analysis.talk_percentage,
        question_count: analysis.question_count,
        pain_identified: analysis.pain_identified,
        budget_discussed: analysis.budget_discussed,
        decision_makers_identified: analysis.decision_makers_identified,
        upfront_contract_set: analysis.upfront_contract_set,
        negative_reverse_used: analysis.negative_reverse_used,
        full_analysis_json: analysis,
        source: 'fireflies' // Track that this came from Fireflies
      })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log('💾 Saved to database')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Call analyzed and saved',
        call_title: callTitle,
        score: analysis.overall_score
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)
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

// Helper: Determine call type from title and content
function determineCallType(title: string, transcript: string): string {
  const titleLower = title.toLowerCase()
  const transcriptLower = transcript.toLowerCase()

  if (titleLower.includes('discovery') || titleLower.includes('qualification')) {
    return 'discovery'
  }
  if (titleLower.includes('demo') || titleLower.includes('presentation')) {
    return 'demo'
  }
  if (titleLower.includes('close') || titleLower.includes('proposal')) {
    return 'closing'
  }
  if (titleLower.includes('follow') || titleLower.includes('check-in')) {
    return 'followup'
  }

  // Try to determine from transcript
  if (transcriptLower.includes('budget') && transcriptLower.includes('timeline')) {
    return 'discovery'
  }
  if (transcriptLower.includes('demo') || transcriptLower.includes('show you')) {
    return 'demo'
  }
  if (transcriptLower.includes('proposal') || transcriptLower.includes('contract')) {
    return 'closing'
  }

  // Default to discovery
  return 'discovery'
}
