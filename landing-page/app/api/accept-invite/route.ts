import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token, authId } = await req.json()
    if (!token || !authId) {
      return NextResponse.json({ error: 'Missing token or authId' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the requesting user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== authId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find valid invitation
    const { data: invitation, error: invError } = await supabase
      .from('Invitations')
      .select('id, email, role, account_id, status, expires_at')
      .eq('token', token)
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation link' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'This invitation has already been used' }, { status: 400 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 })
    }

    // Check if user already has a Users record
    const { data: existingUser } = await supabase
      .from('Users')
      .select('id')
      .eq('auth_id', authId)
      .single()

    if (existingUser) {
      // Update existing record to link to the invited account/role
      const { error: updateError } = await supabase
        .from('Users')
        .update({
          account_id: invitation.account_id,
          role: invitation.role,
          email: invitation.email,
        })
        .eq('id', existingUser.id)

      if (updateError) {
        return NextResponse.json({ error: `Failed to update user: ${updateError.message}` }, { status: 500 })
      }
    } else {
      // Create new user record
      const { error: insertError } = await supabase
        .from('Users')
        .insert({
          auth_id: authId,
          account_id: invitation.account_id,
          role: invitation.role,
          email: invitation.email,
        })

      if (insertError) {
        return NextResponse.json({ error: `Failed to create user: ${insertError.message}` }, { status: 500 })
      }
    }

    // Mark invitation as accepted
    const { error: acceptError } = await supabase
      .from('Invitations')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (acceptError) {
      return NextResponse.json({ error: `Failed to update invitation: ${acceptError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
