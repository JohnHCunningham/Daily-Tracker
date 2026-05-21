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

    // Step 1: Get the rep user ID
    const { data: repUser } = await supabase
      .from('Users')
      .select('id, email')
      .eq('account_id', currentUser.account_id)
      .eq('email', 'john+abc-rep@oneclickcoaching.com')
      .single()

    if (!repUser) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Step 2: Update both HubSpot owner mappings
    const { error: mapping1Error } = await supabase
      .from('Integration_User_Mappings')
      .update({ occ_user_id: repUser.id })
      .eq('account_id', currentUser.account_id)
      .eq('provider', 'hubspot')
      .eq('provider_user_id', '87481425')

    const { error: mapping2Error } = await supabase
      .from('Integration_User_Mappings')
      .update({ occ_user_id: repUser.id })
      .eq('account_id', currentUser.account_id)
      .eq('provider', 'hubspot')
      .eq('provider_user_id', '92427440')

    // Step 3: Delete old activities with wrong emails
    const { error: deleteError } = await supabase
      .from('Synced_Activities')
      .delete()
      .eq('account_id', currentUser.account_id)
      .eq('source_provider', 'hubspot')
      .in('rep_email', ['john@aiadvantagesolutions.ca', 'john@oneclickcoaching.com', 'unknown@example.com'])

    return NextResponse.json({ 
      success: true, 
      repUser: repUser.email,
      mapping1: mapping1Error ? 'failed' : 'updated',
      mapping2: mapping2Error ? 'failed' : 'updated',
      activitiesDeleted: deleteError ? 'failed' : 'deleted',
      message: 'Mappings updated and old activities cleared. Run HubSpot Sync Now.'
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
