import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { invitationId } = await req.json()
    if (!invitationId) {
      return NextResponse.json({ error: 'Missing invitationId' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the requesting user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invitation details
    const { data: invitation, error: invError } = await supabase
      .from('Invitations')
      .select('id, email, role, token, account_id, status')
      .eq('id', invitationId)
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer pending' }, { status: 400 })
    }

    // Get account name for the email
    const { data: account } = await supabase
      .from('Accounts')
      .select('company_name')
      .eq('id', invitation.account_id)
      .single()

    // Get inviter name
    const { data: inviter } = await supabase
      .from('Users')
      .select('full_name')
      .eq('auth_id', user.id)
      .single()

    const companyName = account?.company_name || 'your team'
    const inviterName = inviter?.full_name || 'Your manager'
    const inviteUrl = `https://oneclickcoaching.com/accept-invite?token=${invitation.token}`

    // Send via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const RESEND_DOMAIN = process.env.RESEND_DOMAIN
    const fromEmail = RESEND_DOMAIN
      ? `One Click Coaching <invites@${RESEND_DOMAIN}>`
      : 'One Click Coaching <onboarding@resend.dev>'

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [invitation.email],
        subject: `${inviterName} invited you to join ${companyName} on One Click Coaching`,
        html: generateInviteHTML(inviterName, companyName, invitation.role, inviteUrl),
        text: generateInviteText(inviterName, companyName, invitation.role, inviteUrl),
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Resend error:', errorText)
      return NextResponse.json({ error: 'Failed to send email', details: errorText }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Send invite error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error?.message, stack: error?.stack?.split('\n').slice(0, 3) }, { status: 500 })
  }
}

function generateInviteHTML(inviterName: string, companyName: string, role: string, inviteUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0C1030, #1a2550); padding: 30px; text-align: center; }
    .header h1 { color: #10C3B0; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
    .info-box { background: #f8fafc; border-left: 4px solid #10C3B0; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .role-badge { display: inline-block; background: #F4B03A; color: #0C1030; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #10C3B0, #3DE0D2); color: #0C1030; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #666; font-size: 13px; }
    .footer a { color: #10C3B0; text-decoration: none; }
    .muted { color: #888; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>One Click Coaching</h1>
    </div>
    <div class="content">
      <p class="greeting">You've been invited!</p>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on One Click Coaching as a <span class="role-badge">${role.toUpperCase()}</span>.</p>

      <div class="info-box">
        <p style="margin:0;">One Click Coaching uses AI to reinforce your sales methodology training with same-day feedback on every call.</p>
      </div>

      <div style="text-align: center;">
        <a href="${inviteUrl}" class="cta-button">Accept Invitation</a>
      </div>

      <p class="muted">This invitation expires in 7 days. If you didn't expect this email, you can ignore it.</p>
    </div>
    <div class="footer">
      <p>Powered by <a href="https://oneclickcoaching.com">One Click Coaching</a></p>
    </div>
  </div>
</body>
</html>`
}

function generateInviteText(inviterName: string, companyName: string, role: string, inviteUrl: string): string {
  return `You've been invited!

${inviterName} has invited you to join ${companyName} on One Click Coaching as a ${role.toUpperCase()}.

One Click Coaching uses AI to reinforce your sales methodology training with same-day feedback on every call.

Accept your invitation here:
${inviteUrl}

This invitation expires in 7 days.

---
One Click Coaching
https://oneclickcoaching.com`
}
