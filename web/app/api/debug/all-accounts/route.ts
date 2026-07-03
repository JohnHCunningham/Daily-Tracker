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

    // Get ALL accounts
    const { data: accounts } = await supabase
      .from('Accounts')
      .select('id, email, subscription_status, trial_ends_at')
      .order('created_at')

    // Get ALL users (with their account info and ID)
    const { data: users } = await supabase
      .from('Users')
      .select('id, email, account_id, role, full_name')
      .order('email')

    // Get ALL HubSpot connections
    const { data: connections } = await supabase
      .from('API_Connections')
      .select('account_id, provider, created_at')
      .eq('provider', 'hubspot')

    // Get ALL HubSpot mappings
    const { data: mappings } = await supabase
      .from('Integration_User_Mappings')
      .select('account_id, provider_user_id, provider_email, occ_user_id')
      .eq('provider', 'hubspot')

    return NextResponse.json({
      current_user: currentUser,
      all_accounts: accounts,
      all_users: users,
      hubspot_connections: connections,
      hubspot_mappings: mappings,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
