'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiArrowLeft, HiCheckCircle, HiExclamationCircle, HiRefresh } from 'react-icons/hi'

interface FathomConnection {
  connection_status: string
  last_successful_sync: string | null
  auto_sync_enabled: boolean
  connected_at: string
  last_error: string | null
}

interface FathomSyncResult {
  results?: {
    meetings_fetched?: number
    meetings_synced?: number
    transcripts_synced?: number
  }
}

export default function FathomPage() {
  const [connection, setConnection] = useState<FathomConnection | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<FathomSyncResult | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  const loadConnection = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      setLoading(false)
      return
    }

    setAccountId(userData.account_id)

    const { data } = await supabase
      .from('API_Connections')
      .select('connection_status, last_successful_sync, auto_sync_enabled, connected_at, last_error')
      .eq('account_id', userData.account_id)
      .eq('provider', 'fathom')
      .single()

    if (data) setConnection(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadConnection()
    const params = new URLSearchParams(window.location.search)
    const oauthStatus = params.get('oauth')
    const oauthMessage = params.get('message')

    if (oauthStatus === 'connected') {
      setMessage({ type: 'success', text: 'Fathom connected successfully.' })
    } else if (oauthStatus === 'error') {
      const errorMessages: Record<string, string> = {
        invalid_state: 'Fathom OAuth failed because the session check did not match. Start the connection from the production OCC page and keep the same browser tab.',
        unauthorized: 'Fathom OAuth failed because OCC could not confirm your signed-in admin or manager session.',
        token_exchange_failed: 'Fathom OAuth failed while exchanging the authorization code. Check the Fathom client secret and exact redirect URL.',
        token_exchange_failed_400: 'Fathom rejected the authorization code exchange. Check that the Fathom client ID, client secret, and redirect URL all belong to the same Fathom app.',
        token_exchange_failed_401: 'Fathom rejected the app credentials. The client secret in OCC likely does not match this Fathom app.',
        token_exchange_failed_403: 'Fathom denied the token exchange. Check the app scope and whether this Fathom app is allowed to use OAuth.',
      }
      setMessage({
        type: 'error',
        text: errorMessages[oauthMessage || ''] || 'Fathom OAuth failed. Check the app credentials and redirect URL.',
      })
    }
  }, [loadConnection])

  async function handleSync() {
    if (!accountId) return
    setSyncing(true)
    setMessage(null)

    const { data, error } = await supabase.functions.invoke('fathom-sync', {
      body: {},
    })

    if (error) {
      setMessage({ type: 'error', text: 'Sync failed. Check the OAuth connection and try again.' })
    } else {
      const syncResult = (data || null) as FathomSyncResult | null
      const meetings = syncResult?.results?.meetings_synced ?? 0
      const transcripts = syncResult?.results?.transcripts_synced ?? 0
      setLastSyncResult(syncResult)
      setMessage({ type: 'success', text: `Sync completed. ${meetings} meeting${meetings === 1 ? '' : 's'} synced, ${transcripts} transcript${transcripts === 1 ? '' : 's'} captured.` })
      void loadConnection()
    }
    setSyncing(false)
  }

  async function handleDisconnect() {
    if (!accountId) return

    const { error } = await supabase
      .from('API_Connections')
      .update({ connection_status: 'disconnected' })
      .eq('account_id', accountId)
      .eq('provider', 'fathom')

    if (!error) {
      setConnection(null)
      setMessage({ type: 'success', text: 'Fathom disconnected.' })
    }
  }

  if (loading) {
    return <div className="text-stone-light">Loading...</div>
  }

  const isConnected = connection?.connection_status === 'active'

  return (
    <div>
      <Link
        href="/integrations"
        className="flex items-center gap-2 text-terracotta hover:text-terracotta-bright mb-6 text-sm"
      >
        <HiArrowLeft /> Back to Integrations
      </Link>

      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 font-bold text-2xl border border-purple-500/30">
            F
          </div>
          <div>
            <h1 className="text-3xl font-bold text-espresso">Fathom</h1>
            <p className="text-stone-light">Import call transcripts as the source for OCC coaching</p>
          </div>
        </div>

        {message && (
          <div className={`rounded-lg p-3 text-sm mb-6 ${message.type === 'success' ? 'bg-green-400/10 border border-green-400/30 text-green-400' : 'bg-pink/10 border border-pink/30 text-pink'}`}>
            {message.text}
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-espresso mb-4">Connection Status</h2>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <HiCheckCircle className="text-green-400 text-2xl" />
                <div>
                  <p className="font-semibold text-espresso">Connected</p>
                  <p className="text-xs text-stone-light">
                    Since {new Date(connection.connected_at).toLocaleDateString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <HiExclamationCircle className="text-stone-light text-2xl" />
                <p className="text-stone-light">Not connected</p>
              </>
            )}
          </div>

          {connection?.last_error && (
            <div className="mt-3 bg-pink/10 border border-pink/20 rounded-lg p-3 text-xs text-terracotta">
              Last error: {connection.last_error}
            </div>
          )}
        </div>

        {/* Connect / Configure */}
        {!isConnected ? (
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-espresso mb-4">Connect Fathom</h2>
            <p className="text-sm text-stone-light mb-4">
              Fathom supplies the recording transcript. OCC uses that transcript as the primary source for methodology coaching.
            </p>
            <a
              href="/api/integrations/fathom/oauth/start"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-6 rounded-lg hover:shadow-lg transition-all"
            >
              Connect with Fathom
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sync Controls */}
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
              <h2 className="text-xl font-bold text-espresso mb-4">Sync</h2>
              {connection.last_successful_sync && (
                <p className="text-sm text-stone-light mb-4">
                  Last synced: {new Date(connection.last_successful_sync).toLocaleString()}
                </p>
              )}
              {lastSyncResult?.results && (
                <div className="mb-4 grid gap-2 rounded-lg border border-bone-dark bg-bone/30 p-3 text-xs text-stone-light sm:grid-cols-3">
                  <div className="flex items-center justify-between gap-3">
                    <span>Meetings found</span>
                    <span className="font-medium text-espresso">{lastSyncResult.results.meetings_fetched ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Meetings synced</span>
                    <span className="font-medium text-espresso">{lastSyncResult.results.meetings_synced ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Transcripts</span>
                    <span className="font-medium text-espresso">{lastSyncResult.results.transcripts_synced ?? 0}</span>
                  </div>
                </div>
              )}
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 bg-terracotta text-white font-bold py-2.5 px-6 rounded-lg hover:bg-terracotta-bright transition-colors disabled:opacity-50"
              >
                <HiRefresh className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {/* Disconnect */}
            <div className="bg-white rounded-2xl border border-pink/20 p-6">
              <h2 className="text-lg font-bold text-terracotta mb-2">Disconnect</h2>
              <p className="text-sm text-stone-light mb-4">
                This will stop syncing data from Fathom. Existing data will be preserved.
              </p>
              <button
                onClick={handleDisconnect}
                className="text-sm text-terracotta border border-pink/30 bg-pink/5 px-4 py-2 rounded-lg hover:bg-pink/10 transition-colors"
              >
                Disconnect Fathom
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
