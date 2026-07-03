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
      .select('account_id, email, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Find the expired account with john@aiadvantagesolutions.ca
    const { data: expiredAccountUser } = await supabase
      .from('Users')
      .select('account_id, email')
      .eq('email', 'john@aiadvantagesolutions.ca')
      .single()

    if (!expiredAccountUser) {
      return NextResponse.json({ 
        error: 'john@aiadvantagesolutions.ca user not found' 
      }, { status: 404 })
    }

    // Delete HubSpot connection from expired account
    const { error: deleteError } = await supabase
      .from('API_Connections')
      .delete()
      .eq('account_id', expiredAccountUser.account_id)
      .eq('provider', 'hubspot')

    if (deleteError) {
      return NextResponse.json({ 
        error: `Delete failed: ${deleteError.message}` 
      }, { status: 500 })
    }

    // Delete HubSpot mappings from expired account
    const { error: mappingError } = await supabase
      .from('Integration_User_Mappings')
      .delete()
      .eq('account_id', expiredAccountUser.account_id)
      .eq('provider', 'hubspot')

    if (mappingError) {
      return NextResponse.json({ 
        error: `Mapping delete failed: ${mappingError.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Disconnected HubSpot from expired account ${expiredAccountUser.account_id}. Now connect HubSpot from your test account.`
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
