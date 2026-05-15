import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAppOrigin,
  getCurrentIntegrationUser,
  getOAuthProvider,
  getOAuthRedirectUri,
  getStateCookieName,
  redirectToIntegration,
  type OAuthProvider,
} from '@/lib/integrations/oauth'

interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  scopes?: string[]
  hub_id?: number
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

async function exchangeOAuthCode(provider: OAuthProvider, code: string, redirectUri: string): Promise<OAuthTokenResponse> {
  const tokenUrl = provider === 'hubspot'
    ? 'https://api.hubapi.com/oauth/v3/token'
    : 'https://api.fathom.ai/external/v1/oauth2/token'

  const clientId = getRequiredEnv(provider === 'hubspot' ? 'HUBSPOT_CLIENT_ID' : 'FATHOM_CLIENT_ID')
  const clientSecret = getRequiredEnv(provider === 'hubspot' ? 'HUBSPOT_CLIENT_SECRET' : 'FATHOM_CLIENT_SECRET')

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  })

  if (!response.ok) {
    console.error(`${provider} OAuth token exchange failed:`, await response.text())
    throw new Error(`${provider} token exchange failed`)
  }

  return response.json()
}

function getTokenScopes(provider: OAuthProvider, tokens: OAuthTokenResponse) {
  if (Array.isArray(tokens.scopes)) return tokens.scopes
  if (tokens.scope) return tokens.scope.split(/[,\s]+/).filter(Boolean)
  if (provider === 'fathom') return ['public_api']
  return []
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = getOAuthProvider(params.provider)
  const origin = getAppOrigin(request)

  if (!provider) {
    return NextResponse.redirect(`${origin}/integrations?oauth=error&message=unknown_provider`)
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expectedState = request.cookies.get(getStateCookieName(provider))?.value

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}${redirectToIntegration(provider, 'error', 'invalid_state')}`)
  }

  const current = await getCurrentIntegrationUser()
  if (current.response) {
    return NextResponse.redirect(`${origin}${redirectToIntegration(provider, 'error', 'unauthorized')}`)
  }

  try {
    const tokens = await exchangeOAuthCode(provider, code, getOAuthRedirectUri(request, provider))
    const supabase = await createClient()

    const { error } = await supabase
      .from('API_Connections')
      .upsert({
        account_id: current.user.accountId,
        provider,
        provider_account_id: provider === 'hubspot' && tokens.hub_id ? String(tokens.hub_id) : null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        scopes: getTokenScopes(provider, tokens),
        connected_by: current.user.authId,
        connected_at: new Date().toISOString(),
        connection_status: 'active',
        last_error: null,
        last_error_at: null,
      }, { onConflict: 'account_id,provider' })

    if (error) throw error

    const response = NextResponse.redirect(`${origin}${redirectToIntegration(provider, 'connected')}`)
    response.cookies.delete(getStateCookieName(provider))
    return response
  } catch (error) {
    console.error(`${provider} OAuth callback error:`, error)
    return NextResponse.redirect(`${origin}${redirectToIntegration(provider, 'error', 'token_exchange_failed')}`)
  }
}
