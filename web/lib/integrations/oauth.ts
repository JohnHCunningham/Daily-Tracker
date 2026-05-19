import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type OAuthProvider = 'hubspot' | 'fathom'

export interface CurrentIntegrationUser {
  authId: string
  accountId: string
  role: string
}

export function getOAuthProvider(value: string): OAuthProvider | null {
  if (value === 'hubspot' || value === 'fathom') return value
  return null
}

export function getAppOrigin(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

export function getOAuthRedirectUri(request: NextRequest, provider: OAuthProvider) {
  if (provider === 'fathom' && process.env.FATHOM_REDIRECT_URI) {
    return process.env.FATHOM_REDIRECT_URI
  }

  return `${getAppOrigin(request)}/api/integrations/${provider}/oauth/callback`
}

export function getStateCookieName(provider: OAuthProvider) {
  return `occ_${provider}_oauth_state`
}

export async function getCurrentIntegrationUser(): Promise<
  { user: CurrentIntegrationUser; response?: never } | { user?: never; response: NextResponse }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: userData } = await supabase
    .from('Users')
    .select('account_id, role')
    .eq('auth_id', user.id)
    .single()

  if (!userData?.account_id) {
    return { response: NextResponse.json({ error: 'Account not found' }, { status: 404 }) }
  }

  if (!['admin', 'manager'].includes(userData.role)) {
    return { response: NextResponse.json({ error: 'Integration access denied' }, { status: 403 }) }
  }

  return {
    user: {
      authId: user.id,
      accountId: userData.account_id,
      role: userData.role,
    },
  }
}

export function redirectToIntegration(provider: OAuthProvider, status: 'connected' | 'error', message?: string) {
  const params = new URLSearchParams({ oauth: status })
  if (message) params.set('message', message)
  return `/integrations/${provider}?${params.toString()}`
}
