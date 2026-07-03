import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: Record<string, { success: boolean; error?: string; count?: number }> = {}

    // Fathom sync
    const { data: fathomData, error: fathomErr } = await supabase.functions.invoke('fathom-sync')
    if (fathomErr) {
      results.fathom = { success: false, error: fathomErr.message }
    } else {
      results.fathom = { success: true, count: fathomData?.count || 0 }
    }

    // HubSpot sync (non-blocking — failure here shouldn't block Fathom success)
    try {
      const { data: hubspotData, error: hubspotErr } = await supabase.functions.invoke('hubspot-sync')
      if (hubspotErr) {
        results.hubspot = { success: false, error: hubspotErr.message }
      } else {
        results.hubspot = { success: true, count: hubspotData?.count || 0 }
      }
    } catch {
      results.hubspot = { success: false, error: 'Edge function invocation failed' }
    }

    // Calculate total calls synced (Fathom is the call source)
    const totalCalls = (results.fathom?.success ? results.fathom.count || 0 : 0)

    return NextResponse.json({
      success: results.fathom?.success || false,
      results: {
        calls: totalCalls,
        details: results,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
