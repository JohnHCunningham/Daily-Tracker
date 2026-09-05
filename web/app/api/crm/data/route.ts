import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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

    const accountId = userData.account_id

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
      .eq('account_id', accountId)
      .order('stage_order')

    // Get leads, paginated to exceed the 1000-row PostgREST cap
    const pageSize = 1000
    let leads: any[] = []
    let leadsError: any = null
    let from = 0
    while (true) {
      const { data, error } = await serviceClient
        .from('crm_leads')
        .select('*')
        .eq('account_id', accountId)
        .order('classification', { ascending: true })
        .order('profile_signal', { ascending: true, nullsFirst: false })
        .order('last_contact_at', { ascending: false, nullsFirst: true })
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1)

      if (error) {
        leadsError = error
        break
      }
      if (!data || data.length === 0) break
      leads = leads.concat(data)
      if (data.length < pageSize) break
      from += pageSize
    }

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
