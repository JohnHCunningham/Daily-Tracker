// ============================================
// FIREFLIES SYNC EDGE FUNCTION
// Supabase Edge Function to sync transcripts from Fireflies.ai
// Deploy this to: supabase/functions/fireflies-sync
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FIREFLIES_API_URL = 'https://api.fireflies.ai/graphql'

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const { action = 'sync' } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's account and Fireflies settings
    const { data: accountData, error: accountError } = await supabaseClient
      .rpc('get_user_account')
      .single()

    if (accountError || !accountData) {
      throw new Error('No account found')
    }

    const { data: settings, error: settingsError } = await supabaseClient
      .from('Fireflies_Settings')
      .select('*')
      .eq('account_id', accountData.account_id)
      .single()

    if (settingsError || !settings) {
      throw new Error('Fireflies not configured. Please add your API key.')
    }

    // Test connection
    if (action === 'test') {
      const testResult = await testFirefliesConnection(settings.api_key)
      return new Response(JSON.stringify({ success: true, message: 'Connection successful' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // Sync transcripts
    if (action === 'sync') {
      const syncResult = await syncTranscripts(supabaseClient, settings, user.email, accountData.account_id)

      // Update last sync time
      await supabaseClient
        .from('Fireflies_Settings')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('account_id', accountData.account_id)

      return new Response(JSON.stringify(syncResult), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})

// Test Fireflies connection
async function testFirefliesConnection(apiKey) {
  const query = `
    query {
      user {
        email
        name
      }
    }
  `

  const response = await fetch(FIREFLIES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ query })
  })

  if (!response.ok) {
    throw new Error('Failed to connect to Fireflies API')
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error('Invalid API key or unauthorized')
  }

  return data
}

// Sync transcripts from Fireflies
async function syncTranscripts(supabaseClient, settings, userEmail, accountId) {
  // Get recent transcripts from Fireflies (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const query = `
    query {
      transcripts(
        limit: 50
        date_filter: {
          start_date: "${thirtyDaysAgo.toISOString()}"
        }
      ) {
        id
        title
        date
        duration
        participants
        transcript_text
      }
    }
  `

  const response = await fetch(FIREFLIES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.api_key}`
    },
    body: JSON.stringify({ query })
  })

  if (!response.ok) {
    throw new Error('Failed to fetch transcripts from Fireflies')
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error('Error fetching transcripts: ' + data.errors[0].message)
  }

  const transcripts = data.data.transcripts || []

  // Get already synced transcript IDs
  const { data: syncedTranscripts } = await supabaseClient
    .from('Fireflies_Synced_Transcripts')
    .select('fireflies_transcript_id')
    .eq('account_id', accountId)

  const syncedIds = new Set(syncedTranscripts?.map(t => t.fireflies_transcript_id) || [])

  // Filter out already synced transcripts
  const newTranscripts = transcripts.filter(t => !syncedIds.has(t.id))

  let syncedCount = 0
  let analyzedCount = 0

  // Process each new transcript
  for (const transcript of newTranscripts) {
    try {
      // Skip if too short
      if (settings.min_duration_minutes && transcript.duration < settings.min_duration_minutes * 60) {
        continue
      }

      // Create conversation analysis
      const { data: analysis, error: analysisError } = await supabaseClient
        .from('Conversation_Analyses')
        .insert({
          user_email: userEmail,
          date: new Date(transcript.date).toISOString().split('T')[0],
          conversation_title: transcript.title,
          conversation_type: 'discovery', // Default, could be smarter
          duration_minutes: Math.round(transcript.duration / 60),
          transcript: transcript.transcript_text,

          // Placeholder scores - would be filled by AI analysis
          overall_sandler_score: 0,
          what_went_well: [],
          areas_to_improve: [],
          specific_recommendations: []
        })
        .select()
        .single()

      if (analysisError) {
        console.error('Error creating analysis:', analysisError)
        continue
      }

      // Record sync
      await supabaseClient.rpc('record_fireflies_sync', {
        user_email: userEmail,
        fireflies_transcript_id_input: transcript.id,
        fireflies_meeting_id_input: transcript.id, // Same as transcript ID in Fireflies
        meeting_title_input: transcript.title,
        meeting_date_input: new Date(transcript.date).toISOString(),
        duration_minutes_input: Math.round(transcript.duration / 60),
        participants_input: transcript.participants || [],
        conversation_analysis_id_input: analysis.id
      })

      syncedCount++

      // TODO: Trigger AI analysis here
      // This would call your existing AI analysis function
      // For now, marking as synced only

    } catch (error) {
      console.error('Error processing transcript:', transcript.id, error)
    }
  }

  return {
    success: true,
    synced_count: syncedCount,
    analyzed_count: analyzedCount,
    total_available: transcripts.length,
    new_transcripts: newTranscripts.length
  }
}
