import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const testAccountId = 'c2cba487-7057-4140-ba84-e53c750781d7'

  // Get all leads
  const { data: leads, error } = await serviceClient
    .from('crm_leads')
    .select('id, first_name, last_name, company, status, account_id')
    .eq('account_id', testAccountId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Count by status
  const statusCounts: Record<string, number> = {}
  leads?.forEach(l => {
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1
  })

  // Check for leads with different account_ids
  const { data: otherLeads, error: otherError } = await serviceClient
    .from('crm_leads')
    .select('account_id, status')
    .neq('account_id', testAccountId)
    .limit(10)

  return NextResponse.json({
    testAccountId,
    totalLeads: leads?.length || 0,
    statusCounts,
    sampleLeads: leads?.slice(0, 5).map(l => ({
      name: `${l.first_name} ${l.last_name}`,
      company: l.company,
      status: l.status
    })),
    otherAccountLeads: otherLeads?.length || 0
  })
}
