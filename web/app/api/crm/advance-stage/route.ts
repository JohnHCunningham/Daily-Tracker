import { NextRequest, NextResponse } from 'next/server'
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

    const testAccountId = 'c2cba487-7057-4140-ba84-e53c750781d7'

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
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .eq('account_id', testAccountId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Log the activity
    console.log(`✅ Lead ${leadId} advanced to ${nextStage}`)
    if (messageSent) {
      console.log(`📨 Message: ${messageSent}`)
    }

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
