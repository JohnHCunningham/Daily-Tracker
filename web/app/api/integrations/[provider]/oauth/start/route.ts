import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentIntegrationUser,
  getOAuthProvider,
  getOAuthRedirectUri,
  getStateCookieName,
} from '@/lib/integrations/oauth'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = getOAuthProvider(params.provider)
  if (!provider) {
    return NextResponse.json({ error: 'Unknown OAuth provider' }, { status: 404 })
  }

  const current = await getCurrentIntegrationUser()
  if (current.response) return current.response

  const redirectUri = getOAuthRedirectUri(request, provider)
  const state = crypto.randomUUID()
  let authUrl: URL

  if (provider === 'hubspot') {
    const clientId = process.env.HUBSPOT_CLIENT_ID
    const scopes = process.env.HUBSPOT_SCOPES || 'oauth crm.objects.owners.read crm.objects.contacts.read sales-email-read'

    if (!clientId) {
      return NextResponse.json({ error: 'HubSpot OAuth is not configured' }, { status: 500 })
    }

    authUrl = new URL('https://app.hubspot.com/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)
  }

  if (provider === 'fathom') {
    const clientId = process.env.FATHOM_CLIENT_ID

    if (!clientId || !process.env.FATHOM_AUTHORIZATION_URL) {
      return NextResponse.json({ error: 'Fathom OAuth is not configured' }, { status: 500 })
    }

    authUrl = new URL(process.env.FATHOM_AUTHORIZATION_URL)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'public_api')
    authUrl.searchParams.set('state', state)
  }

  const response = NextResponse.redirect(authUrl!)
  response.cookies.set(getStateCookieName(provider), state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60,
    path: '/',
  })

  return response
}
