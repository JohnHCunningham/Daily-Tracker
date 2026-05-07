import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type SupportAccountLookupBody = {
  query?: string
}

function getSupportSecret(request: NextRequest) {
  return request.headers.get('x-support-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&')
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

    const body = (await request.json().catch(() => ({}))) as SupportAccountLookupBody
    const query = body.query?.trim()

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query)

    let accountQuery = adminClient
      .from('Accounts')
      .select('id, name, company_name, contact_email, subscription_status, primary_manager_user_id, owner_user_id, rep_count, max_team_members, billing_cycle')
      .order('created_at', { ascending: false })
      .limit(10)

    if (isUuid) {
      accountQuery = accountQuery.eq('id', query)
    } else {
      const escaped = escapeLike(query)
      accountQuery = accountQuery.or(
        `name.ilike.%${escaped}%,company_name.ilike.%${escaped}%,contact_email.ilike.%${escaped}%`
      )
    }

    const { data: accounts, error: accountError } = await accountQuery

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ success: true, accounts: [] })
    }

    const accountIds = accounts.map((account) => account.id)
    const { data: members, error: membersError } = await adminClient
      .from('Users')
      .select('id, auth_id, account_id, full_name, email, role, created_at')
      .in('account_id', accountIds)
      .order('created_at', { ascending: true })

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 })
    }

    const normalizedAccounts = accounts.map((account) => {
      const accountMembers = (members || []).filter((member) => member.account_id === account.id)
      const primaryManager = accountMembers.find((member) => member.id === account.primary_manager_user_id) || null

      return {
        id: account.id,
        name: account.name,
        company_name: account.company_name,
        contact_email: account.contact_email,
        subscription_status: account.subscription_status,
        primary_manager_user_id: account.primary_manager_user_id,
        owner_user_id: account.owner_user_id,
        rep_count: account.rep_count,
        max_team_members: account.max_team_members,
        billing_cycle: account.billing_cycle,
        primary_manager_name: primaryManager?.full_name || primaryManager?.email || null,
        members: accountMembers.map((member) => ({
          id: member.id,
          full_name: member.full_name,
          email: member.email,
          role: member.role,
        })),
      }
    })

    return NextResponse.json({ success: true, accounts: normalizedAccounts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
