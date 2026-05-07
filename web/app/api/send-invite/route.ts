import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedInviters = new Set(['admin', 'manager'])

export async function POST(request: NextRequest) {
  try {
    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json({ error: 'Missing invitationId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id, full_name, email, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser || !allowedInviters.has(currentUser.role)) {
      return NextResponse.json({ error: 'Only admins and managers can send invitations' }, { status: 403 })
    }

    const { data: invitation, error: invitationError } = await supabase
      .from('Invitations')
      .select('id, account_id, email, role, token, status, expires_at')
      .eq('id', invitationId)
      .eq('account_id', currentUser.account_id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is not pending' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://app.oneclickcoaching.com'
    const inviteUrl = `${origin}/accept-invite?token=${encodeURIComponent(invitation.token)}`
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.log('Invite email would be sent:', {
        to: invitation.email,
        role: invitation.role,
        inviteUrl,
      })

      return NextResponse.json({
        success: true,
        emailSent: false,
        logOnly: true,
        inviteUrl,
      })
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'One Click Coaching <noreply@oneclickcoaching.com>'
    const inviterName = currentUser.full_name || currentUser.email || 'Your team admin'

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: invitation.email,
        subject: `${inviterName} invited you to One Click Coaching`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #241a14;">
            <h1 style="font-size: 24px;">You're invited to One Click Coaching</h1>
            <p>${inviterName} invited you to join their team as a <strong>${invitation.role}</strong>.</p>
            <p><a href="${inviteUrl}" style="display:inline-block;background:#b5583e;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;">Accept invitation</a></p>
            <p style="font-size: 13px; color: #75685f;">This invitation expires on ${new Date(invitation.expires_at).toLocaleDateString()}.</p>
          </div>
        `,
        text: `${inviterName} invited you to One Click Coaching as a ${invitation.role}.\n\nAccept your invitation: ${inviteUrl}`,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('Resend invite failed:', response.status, body)
      return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 502 })
    }

    return NextResponse.json({ success: true, emailSent: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
