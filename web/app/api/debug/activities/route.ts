import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Get all users in account
    const { data: users } = await supabase
      .from('Users')
      .select('email, full_name, role')
      .eq('account_id', currentUser.account_id)
      .order('email')

    // Get recent activities
    const { data: activities } = await supabase
      .from('Synced_Activities')
      .select('rep_email, activity_type, activity_date, count, metadata')
      .eq('account_id', currentUser.account_id)
      .eq('source_provider', 'hubspot')
      .gte('activity_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('activity_date', { ascending: false })
      .limit(50)

    // Get owner mappings
    const { data: mappings } = await supabase
      .from('Integration_User_Mappings')
      .select('provider_user_id, provider_email, provider_name, occ_user_id, match_status, confidence')
      .eq('account_id', currentUser.account_id)
      .eq('provider', 'hubspot')
      .order('provider_email')

    // Group activities by rep
    const byRep: Record<string, { calls: number; emails: number; meetings: number; tasks: number; notes: number }> = {}
    activities?.forEach(a => {
      if (!byRep[a.rep_email]) {
        byRep[a.rep_email] = { calls: 0, emails: 0, meetings: 0, tasks: 0, notes: 0 }
      }
      byRep[a.rep_email][a.activity_type as keyof typeof byRep[string]] += a.count
    })

    return NextResponse.json({
      success: true,
      users,
      mappings,
      activityCounts: byRep,
      recentActivities: activities?.slice(0, 10),
      totalActivities: activities?.length || 0,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
