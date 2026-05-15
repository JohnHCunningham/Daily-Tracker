import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { token, authId } = await request.json()

    if (!token || !authId) {
      return NextResponse.json({ error: 'Missing token or authId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user && user.id === authId) {
      const { data: invitation, error: invitationError } = await supabase
        .from('Invitations')
        .select('email, status, expires_at')
        .eq('token', token)
        .single()

      if (invitationError || !invitation) {
        return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
      }

      if (invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
      }

      if (user.email !== invitation.email) {
        return NextResponse.json({ error: 'Invitation email does not match the signed-in account' }, { status: 403 })
      }

      const { data, error } = await supabase.rpc('accept_invitation', {
        p_token: token,
        p_auth_id: authId,
      })

      if (error) {
        return NextResponse.json({ error: `Failed to accept invitation: ${error.message}` }, { status: 500 })
      }

      if (data?.error) {
        return NextResponse.json({ error: data.error }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Invitation acceptance requires a signed-in session or admin credentials' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    const { data: invitation, error: invitationError } = await adminSupabase
      .from('Invitations')
      .select('email, status, expires_at')
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
    }

    const { data: authData, error: authError } = await adminSupabase.auth.admin.getUserById(authId)
    const authUser = authData.user

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Could not verify the invited account' }, { status: 400 })
    }

    if (authUser.email !== invitation.email) {
      return NextResponse.json({ error: 'Invitation email does not match the account being created' }, { status: 403 })
    }

    const { data, error } = await adminSupabase.rpc('accept_invitation', {
      p_token: token,
      p_auth_id: authId,
    })

    if (error) {
      return NextResponse.json({ error: `Failed to accept invitation: ${error.message}` }, { status: 500 })
    }

    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
