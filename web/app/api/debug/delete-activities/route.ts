import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id, role, email')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // First, count how many we're about to delete
    const { data: beforeCount } = await supabase
      .from('Synced_Activities')
      .select('id', { count: 'exact', head: false })
      .eq('account_id', currentUser.account_id)
      .eq('source_provider', 'hubspot')

    // Delete all HubSpot activities for this account
    const { data: deleted, error: deleteError } = await supabase
      .from('Synced_Activities')
      .delete()
      .eq('account_id', currentUser.account_id)
      .eq('source_provider', 'hubspot')
      .select()

    // Count after
    const { data: afterCount } = await supabase
      .from('Synced_Activities')
      .select('id', { count: 'exact', head: false })
      .eq('account_id', currentUser.account_id)
      .eq('source_provider', 'hubspot')

    return NextResponse.json({ 
      success: !deleteError, 
      beforeCount: beforeCount?.length || 0,
      afterCount: afterCount?.length || 0,
      deletedRows: deleted?.length || 0,
      error: deleteError ? String(deleteError) : null,
      message: deleteError ? 'Delete failed' : `Deleted ${deleted?.length || 0} activities. Run HubSpot Sync Now.`
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
