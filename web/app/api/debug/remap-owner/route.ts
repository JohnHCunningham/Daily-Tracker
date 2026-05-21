import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    const { hubspot_owner_id, target_rep_email } = await request.json()

    // Get target rep
    const { data: targetRep } = await supabase
      .from('Users')
      .select('id, email')
      .eq('account_id', currentUser.account_id)
      .eq('email', target_rep_email)
      .single()

    if (!targetRep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Update mapping
    const { error: updateError } = await supabase
      .from('Integration_User_Mappings')
      .update({ occ_user_id: targetRep.id })
      .eq('account_id', currentUser.account_id)
      .eq('provider', 'hubspot')
      .eq('provider_user_id', hubspot_owner_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Mapped HubSpot owner ${hubspot_owner_id} to ${target_rep_email}` 
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
