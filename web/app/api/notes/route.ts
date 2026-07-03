import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/rag'

export const dynamic = 'force-dynamic'

const leaderRoles = new Set(['admin', 'manager', 'coach'])

function buildConversationBadges(
  rows: Array<{ sender_email: string; recipient_email: string; is_read: boolean }>,
  currentEmail: string
) {
  return rows.reduce<Record<string, { unreadCount: number }>>((acc, message) => {
    const otherEmail =
      message.sender_email === currentEmail ? message.recipient_email : message.sender_email

    if (!otherEmail) return acc

    if (message.recipient_email === currentEmail && !message.is_read) {
      acc[otherEmail] = { unreadCount: (acc[otherEmail]?.unreadCount || 0) + 1 }
    } else if (!acc[otherEmail]) {
      acc[otherEmail] = { unreadCount: 0 }
    }

    return acc
  }, {})
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id, email, full_name, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const isLeader = leaderRoles.has(currentUser.role)
    const requestedRep = request.nextUrl.searchParams.get('rep')

    if (isLeader) {
      const { data: teamData } = await supabase
        .from('Users')
        .select('id, email, full_name, role')
        .eq('account_id', currentUser.account_id)
        .neq('email', currentUser.email)
        .order('role')
        .order('full_name')

      const members = teamData || []
      const selectedEmail = requestedRep && members.some((member) => member.email === requestedRep)
        ? requestedRep
        : members[0]?.email || ''

      const { data: messages } = selectedEmail
        ? await supabase
            .from('Direct_Messages')
            .select('*')
            .eq('account_id', currentUser.account_id)
            .or(`and(sender_email.eq.${currentUser.email},recipient_email.eq.${selectedEmail}),and(sender_email.eq.${selectedEmail},recipient_email.eq.${currentUser.email})`)
            .order('created_at', { ascending: true })
        : { data: [] as Array<{ sender_email: string; recipient_email: string; is_read: boolean }> }

      const { data: allMessages } = await supabase
        .from('Direct_Messages')
        .select('sender_email, recipient_email, is_read')
        .eq('account_id', currentUser.account_id)
        .order('created_at', { ascending: false })
        .limit(200)

      return NextResponse.json({
        success: true,
        currentUser,
        members,
        selectedEmail,
        messages: messages || [],
        conversationBadges: buildConversationBadges(allMessages || [], currentUser.email),
      }, {
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    const { data: directMessages } = await supabase
      .from('Direct_Messages')
      .select('*')
      .eq('account_id', currentUser.account_id)
      .or(`sender_email.eq.${currentUser.email},recipient_email.eq.${currentUser.email}`)
      .order('created_at', { ascending: true })

    const participantEmails = Array.from(
      new Set(
        (directMessages || []).map((message: { sender_email: string; recipient_email: string }) =>
          message.sender_email === currentUser.email ? message.recipient_email : message.sender_email
        )
      )
    )

    // Fetch account managers so reps can initiate conversations, not just reply
    const { data: managers } = await supabase
      .from('Users')
      .select('email, full_name, role')
      .eq('account_id', currentUser.account_id)
      .in('role', ['admin', 'manager'])
      .neq('email', currentUser.email)

    const managerMap = new Map<string, { full_name: string | null; role: string }>()
    for (const m of managers || []) {
      managerMap.set(m.email, { full_name: m.full_name, role: m.role })
      if (!participantEmails.includes(m.email)) {
        participantEmails.push(m.email)
      }
    }

    const members = participantEmails.map((email) => ({
      id: email,
      email,
      full_name: managerMap.get(email)?.full_name || null,
      role: managerMap.get(email)?.role || 'manager',
    }))

    return NextResponse.json({
      success: true,
      currentUser,
      members,
      selectedEmail: members[0]?.email || '',
      messages: directMessages || [],
      conversationBadges: buildConversationBadges(directMessages || [], currentUser.email),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, messageText } = await request.json()

    if (!recipientEmail || !messageText?.trim()) {
      return NextResponse.json(
        { error: 'recipientEmail and messageText are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id, email, full_name, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser || !leaderRoles.has(currentUser.role) && currentUser.role !== 'rep') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: recipient } = await supabase
      .from('Users')
      .select('email, full_name, role')
      .eq('account_id', currentUser.account_id)
      .eq('email', recipientEmail)
      .maybeSingle()

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found in this account' }, { status: 404 })
    }

    const senderIsLeader = leaderRoles.has(currentUser.role)
    const recipientIsLeader = leaderRoles.has(recipient.role)

    if (senderIsLeader === recipientIsLeader) {
      return NextResponse.json(
        { error: 'Notes can only be sent between a leader and a rep' },
        { status: 403 }
      )
    }

    const { data: insertedMessage, error: insertError } = await supabase
      .from('Direct_Messages')
      .insert({
        account_id: currentUser.account_id,
        sender_email: currentUser.email,
        recipient_email: recipient.email,
        message_text: messageText.trim(),
      })
      .select('*')
      .single()

    if (insertError || !insertedMessage) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to save note' },
        { status: 500 }
      )
    }

    const memoryText = [
      `From: ${currentUser.full_name || currentUser.email}`,
      `To: ${recipient.full_name || recipient.email}`,
      messageText.trim(),
    ].join('\n\n')

    const rolePair = currentUser.role === 'rep'
      ? { repEmail: currentUser.email, managerEmail: recipient.email }
      : { repEmail: recipient.email, managerEmail: currentUser.email }

    let embedding: number[] | null = null
    let embeddingStatus: 'pending' | 'ready' | 'error' = 'pending'
    let embeddingError: string | null = null

    try {
      const embeddingResult = await generateEmbedding(memoryText)
      embedding = embeddingResult.embedding
      embeddingStatus = embedding ? 'ready' : 'pending'
    } catch (error) {
      embeddingStatus = 'error'
      embeddingError = error instanceof Error ? error.message : 'Embedding failed'
    }

    const { error: memoryError } = await supabase.from('Coaching_Memory_Entries').insert({
      account_id: currentUser.account_id,
      source_type: 'note',
      source_table: 'Direct_Messages',
      source_id: insertedMessage.id,
      title: `${currentUser.full_name || currentUser.email} to ${recipient.full_name || recipient.email}`,
      content: messageText.trim(),
      rep_email: rolePair.repEmail,
      manager_email: rolePair.managerEmail,
      sender_email: currentUser.email,
      recipient_email: recipient.email,
      situation_tags: ['note', '1-on-1'],
      weakness_tags: [],
      metadata: {
        sender_role: currentUser.role,
        recipient_role: recipient.role,
      },
      embedding,
      embedding_model: embedding ? 'text-embedding-3-small' : null,
      embedding_status: embeddingStatus,
      embedding_error: embeddingError,
      embedded_at: embedding ? new Date().toISOString() : null,
    })

    if (memoryError) {
      console.warn('Failed to store note in coaching memory:', memoryError)
    }

    return NextResponse.json({
      success: true,
      message: insertedMessage,
      memoryIndexed: !memoryError,
      embeddingStatus,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
