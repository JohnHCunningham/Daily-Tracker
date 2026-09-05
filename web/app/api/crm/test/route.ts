import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: authError?.message || 'Not authenticated'
      })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('account_id, role, email')
      .eq('auth_id', user.id)
      .single()

    if (userError) {
      return NextResponse.json({
        authenticated: true,
        user: user.email,
        userDataError: userError.message
      })
    }

    // Check for leads
    const { data: leads, error: leadsError } = await supabase
      .from('crm_leads')
      .select('id, first_name, last_name, status')
      .eq('account_id', userData.account_id)
      .limit(5)

    return NextResponse.json({
      authenticated: true,
      user: user.email,
      userData,
      leadsCount: leads?.length || 0,
      sampleLeads: leads || [],
      leadsError: leadsError?.message || null
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
