import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { callId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id, email, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    let query = supabase
      .from('Synced_Conversations')
      .select('*')
      .eq('id', params.callId)
      .eq('account_id', currentUser.account_id)

    if (currentUser.role === 'rep') {
      query = query.eq('rep_email', currentUser.email)
    }

    const { data: call } = await query.single()

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const { data: hubspotActivities } = await supabase
      .from('Synced_Activities')
      .select('id, activity_type, activity_date, source_url, metadata')
      .eq('account_id', currentUser.account_id)
      .eq('rep_email', call.rep_email)
      .eq('source_provider', 'hubspot')
      .gte('activity_date', `${new Date(call.call_date).toISOString().split('T')[0]}T00:00:00`)
      .lt('activity_date', `${new Date(call.call_date).toISOString().split('T')[0]}T23:59:59`)

    return NextResponse.json({
      success: true,
      currentUser,
      call,
      hubspotActivities: hubspotActivities || [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
