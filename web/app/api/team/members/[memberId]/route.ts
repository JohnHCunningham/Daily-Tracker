import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const allowedRoles = new Set(['admin', 'manager'])

function computeAverages(scores: Array<{ call_date: string; methodology_scores: Record<string, number> | null }>) {
  const totals: Record<string, { sum: number; count: number }> = {}

  scores.forEach((score) => {
    if (!score.methodology_scores) return
    Object.entries(score.methodology_scores).forEach(([key, value]) => {
      if (!totals[key]) totals[key] = { sum: 0, count: 0 }
      totals[key].sum += value as number
      totals[key].count += 1
    })
  })

  return Object.entries(totals).reduce<Record<string, number>>((acc, [key, value]) => {
    acc[key] = Math.round((value.sum / value.count) * 10) / 10
    return acc
  }, {})
}

function computePipelineProgress(
  goals: Array<{ rep_email: string | null; goal_type: string; target_value: number; current_value: number }>,
  email: string
) {
  const repGoals = goals.filter((goal) => goal.rep_email === email || goal.rep_email === null)

  const pct = (type: string): number => {
    const matched = repGoals.filter((goal) => goal.goal_type === type)
    const target = matched.reduce((sum, goal) => sum + goal.target_value, 0)
    const current = matched.reduce((sum, goal) => sum + goal.current_value, 0)
    if (target === 0) return 0
    return Math.min(Math.round((current / target) * 100), 100)
  }

  return {
    calls: pct('contacts'),
    discovery: pct('discovery_calls'),
    proposals: pct('proposals'),
    sales: pct('sales'),
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('id, account_id, email, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const isLeader = ['admin', 'manager', 'coach'].includes(currentUser.role)
    if (!isLeader && currentUser.id !== params.memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: member } = await supabase
      .from('Users')
      .select('id, full_name, email, role, created_at')
      .eq('id', params.memberId)
      .eq('account_id', currentUser.account_id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const { data: callScores } = await supabase
      .from('Synced_Conversations')
      .select('call_date, methodology_scores')
      .eq('account_id', currentUser.account_id)
      .eq('rep_email', member.email)
      .not('methodology_scores', 'is', null)
      .order('call_date', { ascending: true })
      .limit(20)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: goals } = await supabase
      .from('Goals')
      .select('rep_email, goal_type, target_value, current_value, period_start, period_end')
      .eq('account_id', currentUser.account_id)
      .gte('period_end', monthStart)
      .lte('period_start', monthEnd)

    const { data: coachingHistory } = await supabase
      .from('Coaching_Messages')
      .select('id, subject, status, created_at')
      .eq('account_id', currentUser.account_id)
      .eq('rep_email', member.email)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: celebrations } = await supabase
      .from('Celebrations')
      .select('id, title, badge_key, created_at')
      .eq('account_id', currentUser.account_id)
      .eq('rep_email', member.email)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      currentUser,
      member,
      callScores: callScores || [],
      avgScores: computeAverages(callScores || []),
      pipelineProgress: computePipelineProgress(goals || [], member.email),
      coachingHistory: coachingHistory || [],
      celebrations: celebrations || [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { memberId: string } }
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
      return NextResponse.json({ error: 'Only admins and managers can remove reps' }, { status: 403 })
    }

    const { data: targetMember, error: targetError } = await supabase
      .from('Users')
      .select('id, account_id, email, role, auth_id')
      .eq('id', params.memberId)
      .eq('account_id', currentUser.account_id)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    if (targetMember.role !== 'rep') {
      return NextResponse.json({ error: 'This action only removes reps' }, { status: 400 })
    }

    if (!targetMember.auth_id) {
      return NextResponse.json({ error: 'This rep does not have an auth account to remove' }, { status: 400 })
    }

    let adminSupabase
    try {
      adminSupabase = createAdminClient()
    } catch {
      return NextResponse.json({ error: 'Supabase admin credentials are required to remove a rep' }, { status: 500 })
    }

    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(targetMember.auth_id)

    if (authDeleteError) {
      return NextResponse.json({ error: `Failed to remove rep account: ${authDeleteError.message}` }, { status: 500 })
    }

    const { error: revokeError } = await supabase
      .from('Invitations')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('account_id', currentUser.account_id)
      .eq('email', targetMember.email)
      .eq('status', 'pending')

    if (revokeError) {
      return NextResponse.json({
        error: `Rep removed, but failed to revoke pending invitations: ${revokeError.message}`,
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const body = await request.json()
    const nextRole = body?.role

    if (!nextRole || typeof nextRole !== 'string') {
      return NextResponse.json({ error: 'Missing role' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'Only admins and managers can change roles' }, { status: 403 })
    }

    const { data: targetMember } = await supabase
      .from('Users')
      .select('id, account_id, role')
      .eq('id', params.memberId)
      .eq('account_id', currentUser.account_id)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (!['rep', 'coach', 'manager', 'admin'].includes(nextRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('Users')
      .update({ role: nextRole })
      .eq('id', targetMember.id)
      .eq('account_id', currentUser.account_id)
      .select('id, role')
      .single()

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ success: true, member: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
