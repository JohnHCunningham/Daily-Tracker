import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Get recent sync logs
    const { data: syncLogs } = await supabase
      .from('Integration_Sync_Log')
      .select('*')
      .eq('account_id', currentUser.account_id)
      .eq('provider', 'hubspot')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      current_user: currentUser,
      sync_logs: syncLogs,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
