'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiArrowLeft, HiCheckCircle, HiExclamationCircle, HiRefresh, HiUserGroup } from 'react-icons/hi'

interface HubSpotConnection {
  connection_status: string
  last_successful_sync: string | null
  auto_sync_enabled: boolean
  connected_at: string
  last_error: string | null
}

interface HubSpotOwnerMapping {
  id: string
  provider_user_id: string
  provider_email: string | null
  provider_name: string | null
  occ_user_id: string | null
  match_status: 'matched' | 'unmatched' | 'ignored'
  confidence: number
  last_seen_at: string | null
}

interface TeamMember {
  id: string
  full_name: string | null
  email: string
  role: string
}

interface SyncBucket {
  fetched?: number
  synced?: number
}

interface HubSpotSyncResult {
  totalSynced?: number
  results?: Record<string, SyncBucket>
}

export default function HubSpotPage() {
  const [connection, setConnection] = useState<HubSpotConnection | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [mappings, setMappings] = useState<HubSpotOwnerMapping[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<HubSpotSyncResult | null>(null)
  const [savingMappingIds, setSavingMappingIds] = useState<string[]>([])
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
      .eq('provider', 'hubspot')
      .single()

    if (data) setConnection(data)

    const [{ data: mappingData }, { data: memberData }] = await Promise.all([
      supabase
        .from('Integration_User_Mappings')
        .select('id, provider_user_id, provider_email, provider_name, occ_user_id, match_status, confidence, last_seen_at')
        .eq('account_id', userData.account_id)
        .eq('provider', 'hubspot')
        .order('match_status', { ascending: false })
        .order('provider_email'),
      supabase
        .from('Users')
        .select('id, full_name, email, role')
        .eq('account_id', userData.account_id)
        .in('role', ['rep', 'manager', 'admin', 'coach'])
        .order('role')
        .order('full_name'),
    ])

    if (mappingData) setMappings(mappingData)
    if (memberData) setTeamMembers(memberData)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadConnection()
    const params = new URLSearchParams(window.location.search)
    if (params.get('oauth') === 'connected') {
      setMessage({ type: 'success', text: 'HubSpot connected successfully.' })
    } else if (params.get('oauth') === 'error') {
      setMessage({ type: 'error', text: 'HubSpot OAuth failed. Check the app credentials and redirect URL.' })
    }
  }, [loadConnection])

  async function handleSync() {
    if (!accountId) return
    setSyncing(true)
    setMessage(null)

    const { data, error } = await supabase.functions.invoke('hubspot-sync', {
      body: {},
    })

    if (error) {
      setMessage({ type: 'error', text: 'Sync failed. Check the OAuth connection and try again.' })
    } else {
      const syncResult = (data || null) as HubSpotSyncResult | null
      setLastSyncResult(syncResult)
      const totalSynced = syncResult?.totalSynced ?? 0
      setMessage({ type: 'success', text: `Sync completed successfully. ${totalSynced} record${totalSynced === 1 ? '' : 's'} synced.` })
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
      .eq('provider', 'hubspot')

    if (!error) {
      setConnection(null)
      setMessage({ type: 'success', text: 'HubSpot disconnected.' })
    }
  }

  async function handleMappingChange(mapping: HubSpotOwnerMapping, value: string) {
    setSavingMappingIds((prev) => [...prev, mapping.id])
    setMessage(null)

    const update: Pick<HubSpotOwnerMapping, 'occ_user_id' | 'match_status' | 'confidence'> = value === 'ignored'
      ? { occ_user_id: null, match_status: 'ignored', confidence: 0 }
      : value
        ? { occ_user_id: value, match_status: 'matched', confidence: 1 }
        : { occ_user_id: null, match_status: 'unmatched', confidence: 0 }

    const { error } = await supabase
      .from('Integration_User_Mappings')
      .update(update)
      .eq('id', mapping.id)
      .eq('account_id', accountId)

    if (error) {
      setMessage({ type: 'error', text: 'Could not save the HubSpot owner assignment.' })
    } else {
      setMappings((prev) => prev.map((item) => (
        item.id === mapping.id
          ? { ...item, ...update, occ_user_id: update.occ_user_id }
          : item
      )))
      setMessage({ type: 'success', text: 'HubSpot owner assignment saved.' })
    }

    setSavingMappingIds((prev) => prev.filter((id) => id !== mapping.id))
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
          <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 font-bold text-2xl border border-orange-500/30">
            H
          </div>
          <div>
            <h1 className="text-3xl font-bold text-espresso">HubSpot</h1>
            <p className="text-stone-light">Sync calls, emails, meetings, and tasks</p>
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
            <h2 className="text-xl font-bold text-espresso mb-4">Connect HubSpot</h2>
            <a
              href="/api/integrations/hubspot/oauth/start"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-6 rounded-lg hover:shadow-lg transition-all"
            >
              Connect with HubSpot
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
                <div className="mb-4 grid gap-2 rounded-lg border border-bone-dark bg-bone/30 p-3 text-xs text-stone-light sm:grid-cols-2">
                  {Object.entries(lastSyncResult.results).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="capitalize">{key}</span>
                      <span className="font-medium text-espresso">
                        {value.synced ?? 0}/{value.fetched ?? 0}
                      </span>
                    </div>
                  ))}
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

            {/* Owner Mapping */}
            <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
              <div className="flex items-start gap-3 mb-5">
                <HiUserGroup className="text-terracotta text-2xl mt-0.5" />
                <div>
                  <h2 className="text-xl font-bold text-espresso">Rep Allocation</h2>
                  <p className="text-sm text-stone-light">
                    Match HubSpot owners to OCC users so calls, notes, emails, meetings, and tasks land on the right rep dashboard.
                  </p>
                </div>
              </div>

              {mappings.length === 0 ? (
                <div className="rounded-lg border border-bone-dark bg-bone/40 p-4 text-sm text-stone-light">
                  Run a HubSpot sync to discover owners. OCC will auto-match owners by email when possible.
                </div>
              ) : (
                <div className="space-y-3">
                  {mappings.map((mapping) => {
                    const isSaving = savingMappingIds.includes(mapping.id)
                    const ownerLabel = mapping.provider_name || mapping.provider_email || `HubSpot owner ${mapping.provider_user_id}`

                    return (
                      <div
                        key={mapping.id}
                        className="grid gap-3 rounded-lg border border-bone-dark p-4 md:grid-cols-[1fr_240px]"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-espresso">{ownerLabel}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              mapping.match_status === 'matched'
                                ? 'bg-green-400/10 text-green-600'
                                : mapping.match_status === 'ignored'
                                  ? 'bg-bone text-stone-light'
                                  : 'bg-pink/10 text-terracotta'
                            }`}>
                              {mapping.match_status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-light mt-1">
                            {mapping.provider_email || 'No HubSpot email'} · Owner ID {mapping.provider_user_id}
                          </p>
                          {mapping.last_seen_at && (
                            <p className="text-xs text-stone-light mt-1">
                              Last seen {new Date(mapping.last_seen_at).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <label className="text-sm">
                          <span className="sr-only">Assign OCC user</span>
                          <select
                            value={mapping.match_status === 'ignored' ? 'ignored' : mapping.occ_user_id || ''}
                            onChange={(event) => void handleMappingChange(mapping, event.target.value)}
                            disabled={isSaving}
                            className="w-full rounded-lg border border-bone-dark bg-white px-3 py-2 text-sm text-espresso disabled:opacity-60"
                          >
                            <option value="">Unassigned</option>
                            {teamMembers.map((member) => (
                              <option key={member.id} value={member.id}>
                                {(member.full_name || member.email)} ({member.role})
                              </option>
                            ))}
                            <option value="ignored">Ignore owner</option>
                          </select>
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Disconnect */}
            <div className="bg-white rounded-2xl border border-pink/20 p-6">
              <h2 className="text-lg font-bold text-terracotta mb-2">Disconnect</h2>
              <p className="text-sm text-stone-light mb-4">
                This will stop syncing data from HubSpot. Existing data will be preserved.
              </p>
              <button
                onClick={handleDisconnect}
                className="text-sm text-terracotta border border-pink/30 bg-pink/5 px-4 py-2 rounded-lg hover:bg-pink/10 transition-colors"
              >
                Disconnect HubSpot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
