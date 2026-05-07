import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedRoles = new Set(['admin', 'manager'])

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
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

    if (!currentUser || !allowedRoles.has(currentUser.role)) {
      return NextResponse.json({ error: 'Only admins and managers can cancel invitations' }, { status: 403 })
    }

    const { data: invitation, error: invitationError } = await supabase
      .from('Invitations')
      .select('id, status')
      .eq('id', params.invitationId)
      .eq('account_id', currentUser.account_id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending invitations can be cancelled' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('Invitations')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      return NextResponse.json({ error: `Failed to cancel invitation: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
