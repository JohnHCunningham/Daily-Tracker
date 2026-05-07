import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type TransferBody = {
  newManagerId?: string
  leaveAccount?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as TransferBody
    const newManagerId = body.newManagerId?.trim()
    const leaveAccount = Boolean(body.leaveAccount)

    if (!newManagerId) {
      return NextResponse.json({ error: 'New manager is required' }, { status: 400 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('id, account_id, role, auth_id, email')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user profile not found' }, { status: 404 })
    }

    if (!['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Only admins and managers can transfer leadership' }, { status: 403 })
    }

    const { data: targetMember } = await supabase
      .from('Users')
      .select('id, account_id, role, email, auth_id')
      .eq('id', newManagerId)
      .eq('account_id', currentUser.account_id)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Target member not found' }, { status: 404 })
    }

    if (targetMember.id === currentUser.id) {
      return NextResponse.json({ error: 'Choose another team member' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const nextTargetRole = targetMember.role === 'admin' ? 'admin' : 'manager'

    const { error: targetUpdateError } = await supabase
      .from('Users')
      .update({ role: nextTargetRole })
      .eq('id', targetMember.id)
      .eq('account_id', currentUser.account_id)

    if (targetUpdateError) {
      return NextResponse.json({ error: `Failed to update new manager: ${targetUpdateError.message}` }, { status: 500 })
    }

    const { error: accountUpdateError } = await supabase
      .from('Accounts')
      .update({
        primary_manager_user_id: targetMember.id,
        owner_user_id: targetMember.auth_id,
      })
      .eq('id', currentUser.account_id)

    if (accountUpdateError) {
      return NextResponse.json({ error: `Failed to update account leadership: ${accountUpdateError.message}` }, { status: 500 })
    }

    if (leaveAccount) {
      if (!currentUser.auth_id) {
        return NextResponse.json({ error: 'Missing auth account for current user' }, { status: 400 })
      }

      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(currentUser.auth_id)
      if (authDeleteError) {
        return NextResponse.json({ error: `Failed to remove current user: ${authDeleteError.message}` }, { status: 500 })
      }

      await supabase
        .from('Users')
        .delete()
        .eq('id', currentUser.id)
        .eq('account_id', currentUser.account_id)

      return NextResponse.json({
        success: true,
        transferredTo: targetMember.id,
        transferredRole: nextTargetRole,
        leftAccount: true,
      })
    }

    const { error: currentRoleUpdateError } = await supabase
      .from('Users')
      .update({ role: 'coach' })
      .eq('id', currentUser.id)
      .eq('account_id', currentUser.account_id)

    if (currentRoleUpdateError) {
      return NextResponse.json({
        error: `Leadership transferred, but failed to demote current user: ${currentRoleUpdateError.message}`,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transferredTo: targetMember.id,
      transferredRole: nextTargetRole,
      leftAccount: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
