'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiExternalLink, HiRefresh, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'

interface Connection {
  provider: string
  connection_status: string
  last_successful_sync: string | null
  auto_sync_enabled: boolean
  connected_at: string
}

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadConnections()
  }, [])

  async function loadConnections() {
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

    const { data } = await supabase
      .from('API_Connections')
      .select('provider, connection_status, last_successful_sync, auto_sync_enabled, connected_at')
      .eq('account_id', userData.account_id)

    if (data) setConnections(data)
    setLoading(false)
  }

  function getConnectionStatus(provider: string) {
    return connections.find((c) => c.provider === provider)
  }

  const integrations = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Sync calls, emails, meetings, and tasks from your HubSpot CRM.',
      href: '/integrations/hubspot',
      icon: 'H',
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
    {
      id: 'fathom',
      name: 'Fathom',
      description: 'Import video call transcripts and AI summaries from Fathom.',
      href: '/integrations/fathom',
      icon: 'F',
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    {
      id: 'aircall',
      name: 'Aircall',
      description: 'Sync phone call recordings and metadata from Aircall.',
      href: '/integrations/aircall',
      icon: 'A',
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
  ]

  if (loading) {
    return <div className="text-light-muted">Loading integrations...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-light mb-2">Integrations</h1>
      <p className="text-light-muted mb-8">Connect your tools to sync sales data for coaching analysis.</p>

      <div className="grid gap-4 max-w-2xl">
        {integrations.map((integration) => {
          const status = getConnectionStatus(integration.id)
          const isConnected = status?.connection_status === 'active'

          return (
            <Link
              key={integration.id}
              href={integration.href}
              className="flex items-center gap-4 p-6 bg-navy-light rounded-2xl border border-teal/10 hover:border-teal/30 transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${integration.color}`}>
                {integration.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-light">{integration.name}</h2>
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      <HiCheckCircle /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-light-muted bg-navy px-2 py-0.5 rounded-full">
                      Not connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-light-muted mt-1">{integration.description}</p>
                {status?.last_successful_sync && (
                  <p className="text-xs text-light-muted mt-2 flex items-center gap-1">
                    <HiRefresh className="text-teal" />
                    Last synced {new Date(status.last_successful_sync).toLocaleString()}
                  </p>
                )}
              </div>
              <HiExternalLink className="text-light-muted text-xl" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
