import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type SupportTransferBody = {
  accountId?: string
  targetUserId?: string
  targetEmail?: string
  reason?: string
  demoteCurrentPrimaryManager?: boolean
}

function getSupportSecret(request: NextRequest) {
  return request.headers.get('x-support-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
}

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.SUPPORT_OVERRIDE_SECRET
    if (!configuredSecret) {
      return NextResponse.json({ error: 'Support override is not configured' }, { status: 500 })
    }

    const providedSecret = getSupportSecret(request)
    if (!providedSecret || providedSecret !== configuredSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as SupportTransferBody
    const accountId = body.accountId?.trim()
    const targetUserId = body.targetUserId?.trim()
    const targetEmail = body.targetEmail?.trim().toLowerCase()
    const reason = body.reason?.trim() || 'Emergency ownership handoff'
    const demoteCurrentPrimaryManager = body.demoteCurrentPrimaryManager !== false

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ error: 'targetUserId or targetEmail is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: account, error: accountError } = await adminClient
      .from('Accounts')
      .select('id, primary_manager_user_id, owner_user_id')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    let targetQuery = adminClient
      .from('Users')
      .select('id, auth_id, account_id, role, email, full_name')
      .eq('account_id', accountId)

    if (targetUserId) {
      targetQuery = targetQuery.eq('id', targetUserId)
    } else if (targetEmail) {
      targetQuery = targetQuery.eq('email', targetEmail)
    }

    const { data: targetUser, error: targetError } = await targetQuery.single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found in this account' }, { status: 404 })
    }

    if (!targetUser.auth_id) {
      return NextResponse.json({ error: 'Target user does not have an auth account' }, { status: 400 })
    }

    if (account.primary_manager_user_id && targetUser.id === account.primary_manager_user_id) {
      return NextResponse.json({ error: 'Select a different user to receive ownership' }, { status: 400 })
    }

    const currentPrimaryManagerId = account.primary_manager_user_id || null
    const currentPrimaryManager = currentPrimaryManagerId
      ? await adminClient
          .from('Users')
          .select('id, auth_id, role, email, full_name')
          .eq('id', currentPrimaryManagerId)
          .single()
      : { data: null, error: null }

    if (demoteCurrentPrimaryManager && currentPrimaryManager.data && currentPrimaryManager.data.id !== targetUser.id) {
      const { error: demoteError } = await adminClient
        .from('Users')
        .update({ role: 'coach' })
        .eq('id', currentPrimaryManager.data.id)
        .eq('account_id', accountId)

      if (demoteError) {
        return NextResponse.json({ error: `Failed to demote current primary manager: ${demoteError.message}` }, { status: 500 })
      }
    }

    const nextTargetRole = targetUser.role === 'admin' ? 'admin' : 'manager'

    const { error: promoteError } = await adminClient
      .from('Users')
      .update({ role: nextTargetRole })
      .eq('id', targetUser.id)
      .eq('account_id', accountId)

    if (promoteError) {
      return NextResponse.json({ error: `Failed to promote target user: ${promoteError.message}` }, { status: 500 })
    }

    const { error: accountUpdateError } = await adminClient
      .from('Accounts')
      .update({
        primary_manager_user_id: targetUser.id,
        owner_user_id: targetUser.auth_id,
      })
      .eq('id', accountId)

    if (accountUpdateError) {
      return NextResponse.json({ error: `Failed to update account ownership: ${accountUpdateError.message}` }, { status: 500 })
    }

    const { error: auditError } = await adminClient
      .from('Account_Handoff_Events')
      .insert({
        account_id: accountId,
        from_user_id: currentPrimaryManager.data?.id || null,
        to_user_id: targetUser.id,
        performed_by: 'support',
        reason,
      })

    if (auditError) {
      return NextResponse.json({
        error: `Ownership transferred, but audit logging failed: ${auditError.message}`,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      accountId,
      transferredTo: targetUser.id,
      transferredToEmail: targetUser.email,
      transferredToRole: nextTargetRole,
      reason,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
