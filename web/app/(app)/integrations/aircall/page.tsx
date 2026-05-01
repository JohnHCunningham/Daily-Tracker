'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiArrowLeft, HiCheckCircle, HiExclamationCircle, HiRefresh } from 'react-icons/hi'

interface AircallConnection {
  connection_status: string
  last_successful_sync: string | null
  auto_sync_enabled: boolean
  connected_at: string
  last_error: string | null
}

export default function AircallPage() {
  const [connection, setConnection] = useState<AircallConnection | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [apiId, setApiId] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadConnection()
  }, [])

  async function loadConnection() {
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
      .eq('provider', 'aircall')
      .single()

    if (data) setConnection(data)
    setLoading(false)
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId) return
    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Aircall uses Basic Auth (api_id:api_token encoded as base64)
    const credentials = btoa(`${apiId}:${apiToken}`)

    const { error } = await supabase
      .from('API_Connections')
      .upsert({
        account_id: accountId,
        provider: 'aircall',
        api_key: credentials,
        connected_by: user.id,
        connected_at: new Date().toISOString(),
        connection_status: 'active',
      }, { onConflict: 'account_id,provider' })

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save connection.' })
    } else {
      setMessage({ type: 'success', text: 'Aircall connected successfully.' })
      setApiId('')
      setApiToken('')
      loadConnection()
    }
    setSaving(false)
  }

  async function handleSync() {
    if (!accountId) return
    setSyncing(true)
    setMessage(null)

    const { error } = await supabase.functions.invoke('aircall-sync', {
      body: { account_id: accountId },
    })

    if (error) {
      setMessage({ type: 'error', text: 'Sync failed. Check your credentials and try again.' })
    } else {
      setMessage({ type: 'success', text: 'Sync completed successfully.' })
      loadConnection()
    }
    setSyncing(false)
  }

  async function handleDisconnect() {
    if (!accountId) return

    const { error } = await supabase
      .from('API_Connections')
      .update({ connection_status: 'disconnected' })
      .eq('account_id', accountId)
      .eq('provider', 'aircall')

    if (!error) {
      setConnection(null)
      setMessage({ type: 'success', text: 'Aircall disconnected.' })
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
          <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 font-bold text-2xl border border-green-500/30">
            A
          </div>
          <div>
            <h1 className="text-3xl font-bold text-espresso">Aircall</h1>
            <p className="text-stone-light">Sync phone call recordings and metadata</p>
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
            <h2 className="text-xl font-bold text-espresso mb-4">Connect Aircall</h2>
            <p className="text-sm text-stone-light mb-4">
              Enter your Aircall API credentials. You can find these in your Aircall dashboard
              under Integrations &gt; API Keys.
            </p>
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-2">API ID</label>
                <input
                  type="text"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-bone border border-terracotta/20 rounded-lg text-espresso placeholder-light-muted/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-teal/20"
                  placeholder="Your Aircall API ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-2">API Token</label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-bone border border-terracotta/20 rounded-lg text-espresso placeholder-light-muted/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-teal/20"
                  placeholder="Your Aircall API token"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? 'Connecting...' : 'Connect Aircall'}
              </button>
            </form>
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
                This will stop syncing data from Aircall. Existing data will be preserved.
              </p>
              <button
                onClick={handleDisconnect}
                className="text-sm text-terracotta border border-pink/30 bg-pink/5 px-4 py-2 rounded-lg hover:bg-pink/10 transition-colors"
              >
                Disconnect Aircall
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
