import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const testAccountId = 'c2cba487-7057-4140-ba84-e53c750781d7'

    // Create NEW service client for each request to avoid caching
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        },
      }
    )

    // Get stages
    const { data: stages, error: stagesError } = await serviceClient
      .from('crm_pipeline_stages')
      .select('*')
      .eq('account_id', testAccountId)
      .order('stage_order')

    // Get leads with explicit refresh
    const { data: leads, error: leadsError } = await serviceClient
      .from('crm_leads')
      .select('*')
      .eq('account_id', testAccountId)
      .order('classification', { ascending: true })
      .order('profile_signal', { ascending: true, nullsFirst: false })
      .order('last_contact_at', { ascending: false, nullsFirst: true })

    // DEBUG: Log status distribution
    const statusCounts = {}
    ;(leads || []).forEach(l => statusCounts[l.status] = (statusCounts[l.status] || 0) + 1)
    console.log('API returning status counts:', statusCounts)
    console.log(`Total leads returned: ${leads?.length}`)

    if (leadsError) {
      console.error('Leads query error:', leadsError)
    }

    return NextResponse.json({
      stages: stages || [],
      leads: leads || [],
      errors: {
        stages: stagesError?.message,
        leads: leadsError?.message
      }
    })
  } catch (error) {
    console.error('CRM data API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stages: [],
        leads: []
      },
      { status: 500 }
    )
  }
}
