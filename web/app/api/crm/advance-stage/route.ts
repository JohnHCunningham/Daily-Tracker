import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, nextStage, messageSent } = body

    if (!leadId || !nextStage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create service client with no caching
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Update the lead's status and last contact time
    const { data: lead, error: updateError } = await serviceClient
      .from('crm_leads')
      .update({
        status: nextStage,
        last_contact_at: new Date().toISOString(),
        stage_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .eq('account_id', userData.account_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Record the outgoing message as an activity (audit trail on the lead's
    // timeline). Non-fatal — the stage advance already succeeded.
    if (messageSent) {
      const { error: activityError } = await serviceClient
        .from('crm_lead_activities')
        .insert({
          lead_id: leadId,
          account_id: userData.account_id,
          activity_type: 'linkedin_message',
          activity_date: new Date().toISOString(),
          body: messageSent,
          direction: 'outbound',
          source_provider: 'linkedin',
        })

      if (activityError) {
        console.error('Error logging message activity:', activityError)
      }
    }

    console.log(`✅ Lead ${leadId} advanced to ${nextStage}`)

    return NextResponse.json({
      success: true,
      lead,
    })
  } catch (error) {
    console.error('Advance stage error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
