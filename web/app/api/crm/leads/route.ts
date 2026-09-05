import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Use raw SQL query to bypass PostgREST issues
    const { data: leads, error } = await supabase.rpc('get_leads_for_account', {
      p_account_id: userData.account_id
    })

    if (error) {
      // Fallback: try direct query
      const { data: fallbackLeads, error: fallbackError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('account_id', userData.account_id)
        .order('classification', { ascending: true })
        .order('profile_signal', { ascending: true, nullsFirst: false })
        .order('last_contact_at', { ascending: false, nullsFirst: true })

      return NextResponse.json({
        leads: fallbackLeads || [],
        error: fallbackError?.message
      })
    }

    return NextResponse.json({ leads: leads || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
