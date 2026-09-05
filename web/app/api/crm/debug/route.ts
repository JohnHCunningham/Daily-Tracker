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

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all leads for the authenticated account
    const { data: leads, error } = await serviceClient
      .from('crm_leads')
      .select('id, first_name, last_name, company, status, account_id')
      .eq('account_id', accountId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count by status
    const statusCounts: Record<string, number> = {}
    leads?.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1
    })

    return NextResponse.json({
      accountId,
      totalLeads: leads?.length || 0,
      statusCounts,
      sampleLeads: leads?.slice(0, 5).map(l => ({
        name: `${l.first_name} ${l.last_name}`,
        company: l.company,
        status: l.status
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
