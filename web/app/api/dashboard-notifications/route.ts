import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type NotificationSummary = {
  role: string
  coachingUnread: number
  coachingRead: number
  coachingReplied: number
  notesUnread: number
  celebrationsRecent: number
  latestCelebrationTitle: string | null
  latestCelebrationBadgeKey: string | null
  latestCoachName: string | null
  latestNoteSenderName: string | null
}

async function resolveName(
  supabase: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  email: string | null | undefined
): Promise<string | null> {
  if (!email) return null

  try {
    const { data } = await supabase
      .from('Users')
      .select('full_name, email')
      .eq('account_id', accountId)
      .eq('email', email)
      .maybeSingle()

    return data?.full_name || data?.email || email
  } catch {
    return email
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id, email, role, full_name')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    let adminSupabase: ReturnType<typeof createAdminClient> | null = null
    try {
      adminSupabase = createAdminClient()
    } catch {
      adminSupabase = null
    }

    const db = adminSupabase || supabase
    const isLeader = ['admin', 'manager', 'coach'].includes(currentUser.role)

    const summary: NotificationSummary = {
      role: currentUser.role,
      coachingUnread: 0,
      coachingRead: 0,
      coachingReplied: 0,
      notesUnread: 0,
      celebrationsRecent: 0,
      latestCelebrationTitle: null,
      latestCelebrationBadgeKey: null,
      latestCoachName: null,
      latestNoteSenderName: null,
    }

    const { data: celebrations } = await db
      .from('Celebrations')
      .select('title, badge_key, rep_email, created_at')
      .eq('account_id', currentUser.account_id)
      .order('created_at', { ascending: false })
      .limit(20)

    const recentCelebrations = (celebrations || []).filter((c) => {
      const createdAt = new Date(c.created_at).getTime()
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      return createdAt >= sevenDaysAgo
    })

    summary.celebrationsRecent = recentCelebrations.length
    if (recentCelebrations[0]) {
      summary.latestCelebrationTitle = recentCelebrations[0].title
      summary.latestCelebrationBadgeKey = recentCelebrations[0].badge_key
    }

    if (isLeader) {
      const { data: coaching } = await db
        .from('Coaching_Messages')
        .select('status, read_at, rep_response, rep_email, manager_email, from_user_id, created_at')
        .eq('account_id', currentUser.account_id)
        .order('created_at', { ascending: false })
        .limit(100)

      const { data: notes } = await db
        .from('Direct_Messages')
        .select('sender_email, recipient_email, is_read, created_at')
        .eq('account_id', currentUser.account_id)
        .order('created_at', { ascending: false })
        .limit(200)

      summary.coachingUnread = coaching?.filter((m) => m.status === 'sent' && !m.read_at).length || 0
      summary.coachingRead = coaching?.filter((m) => m.status === 'read').length || 0
      summary.coachingReplied = coaching?.filter((m) => !!m.rep_response).length || 0
      summary.notesUnread = notes?.filter((m) => m.recipient_email === currentUser.email && !m.is_read).length || 0

      const latestUnreadCoaching = coaching?.find((m) => m.status === 'sent' && !m.read_at) || null
      if (latestUnreadCoaching) {
        summary.latestCoachName =
          (adminSupabase && (await resolveName(adminSupabase, currentUser.account_id, latestUnreadCoaching.manager_email))) ||
          latestUnreadCoaching.manager_email ||
          'your manager'
      }

      const latestUnreadNote = notes?.find((m) => m.recipient_email === currentUser.email && !m.is_read) || null
      if (latestUnreadNote) {
        summary.latestNoteSenderName =
          (adminSupabase && (await resolveName(adminSupabase, currentUser.account_id, latestUnreadNote.sender_email))) ||
          latestUnreadNote.sender_email ||
          'your team'
      }
    } else {
      const { data: coaching } = await db
        .from('Coaching_Messages')
        .select('status, read_at, rep_response, manager_email, from_user_id, created_at')
        .eq('account_id', currentUser.account_id)
        .eq('rep_email', currentUser.email)
        .order('created_at', { ascending: false })
        .limit(50)

      const { data: notes } = await db
        .from('Direct_Messages')
        .select('sender_email, recipient_email, is_read, created_at')
        .eq('account_id', currentUser.account_id)
        .eq('recipient_email', currentUser.email)
        .order('created_at', { ascending: false })
        .limit(100)

      summary.coachingUnread = coaching?.filter((m) => m.status === 'sent' && !m.read_at).length || 0
      summary.coachingRead = coaching?.filter((m) => m.status === 'read').length || 0
      summary.coachingReplied = coaching?.filter((m) => !!m.rep_response).length || 0
      summary.notesUnread = notes?.filter((m) => !m.is_read).length || 0

      const latestUnreadCoaching = coaching?.find((m) => m.status === 'sent' && !m.read_at) || null
      if (latestUnreadCoaching) {
        summary.latestCoachName =
          (adminSupabase && (await resolveName(adminSupabase, currentUser.account_id, latestUnreadCoaching.manager_email))) ||
          latestUnreadCoaching.manager_email ||
          'your manager'
      }

      const latestUnreadNote = notes?.find((m) => !m.is_read) || null
      if (latestUnreadNote) {
        summary.latestNoteSenderName =
          (adminSupabase && (await resolveName(adminSupabase, currentUser.account_id, latestUnreadNote.sender_email))) ||
          latestUnreadNote.sender_email ||
          'your team'
      }
    }

    return NextResponse.json(summary)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
