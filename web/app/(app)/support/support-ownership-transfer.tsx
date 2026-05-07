'use client'

import { useMemo, useState } from 'react'
import { HiSearch, HiShieldCheck, HiSwitchHorizontal } from 'react-icons/hi'

type SupportAccount = {
  id: string
  name: string | null
  company_name: string | null
  contact_email: string | null
  subscription_status: string | null
  primary_manager_user_id: string | null
  owner_user_id: string | null
  rep_count: number | null
  max_team_members: number | null
  billing_cycle: string | null
  primary_manager_name: string | null
  members: Array<{
    id: string
    full_name: string | null
    email: string
    role: string
  }>
}

export default function SupportOwnershipTransfer() {
  const [supportSecret, setSupportSecret] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [accounts, setAccounts] = useState<SupportAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [reason, setReason] = useState('Emergency ownership handoff')
  const [demoteCurrentPrimaryManager, setDemoteCurrentPrimaryManager] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  )

  async function lookupAccounts() {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/support/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-support-secret': supportSecret,
        },
        body: JSON.stringify({ query }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error || 'Failed to search accounts')
        setAccounts([])
        return
      }

      setAccounts(data.accounts || [])
      setSelectedAccountId(data.accounts?.[0]?.id || '')
      const firstAccount = data.accounts?.[0] || null
      const nextTarget =
        firstAccount?.members?.find((member: SupportAccount['members'][number]) => member.id !== firstAccount?.primary_manager_user_id && (member.role === 'admin' || member.role === 'manager' || member.role === 'coach')) ||
        firstAccount?.members?.find((member: SupportAccount['members'][number]) => member.id !== firstAccount?.primary_manager_user_id) ||
        null
      setTargetUserId(nextTarget?.id || '')
      setMessage((data.accounts || []).length > 0 ? `Found ${(data.accounts || []).length} account(s).` : 'No accounts found.')
    } catch {
      setError('Failed to search accounts')
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  async function transferOwnership() {
    if (!selectedAccount) {
      setError('Select an account first')
      return
    }

    if (!targetUserId) {
      setError('Select a target user')
      return
    }

    setTransferring(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/support/transfer-ownership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-support-secret': supportSecret,
        },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          targetUserId,
          reason,
          demoteCurrentPrimaryManager,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error || 'Failed to transfer ownership')
        return
      }

      setMessage(`Ownership transferred to ${data.transferredToEmail || data.transferredTo}.`)
      await lookupAccounts()
    } catch {
      setError('Failed to transfer ownership')
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-espresso">Emergency Ownership</h1>
        <p className="mt-1 text-sm text-stone-light">
          Search an account, confirm the current primary manager, and hand billing and ownership to a replacement.
        </p>
      </div>

      <div className="rounded-2xl border border-bone-dark bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-medium text-espresso">Support secret</label>
            <input
              type="password"
              value={supportSecret}
              onChange={(e) => setSupportSecret(e.target.value)}
              className="w-full rounded-lg border border-terracotta/20 bg-bone px-3 py-2 text-sm text-espresso focus:border-terracotta focus:outline-none"
              placeholder="Paste support override secret"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-espresso">Account lookup</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-terracotta/20 bg-bone px-3 py-2 text-sm text-espresso focus:border-terracotta focus:outline-none"
              placeholder="Account id, company, or email"
            />
          </div>
          <button
            onClick={() => void lookupAccounts()}
            disabled={loading || !supportSecret || !query}
            className="inline-flex h-fit items-center justify-center gap-2 rounded-lg bg-terracotta px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-bright disabled:opacity-50"
          >
            <HiSearch />
            {loading ? 'Searching...' : 'Find Account'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-pink/30 bg-pink/5 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {message && !error && (
          <div className="mt-4 rounded-lg border border-teal/30 bg-teal/5 p-4 text-sm text-espresso">
            {message}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => {
                  setSelectedAccountId(account.id)
                  const nextTarget = account.members.find((member) => member.id !== account.primary_manager_user_id && (member.role === 'admin' || member.role === 'manager' || member.role === 'coach'))
                    || account.members.find((member) => member.id !== account.primary_manager_user_id)
                    || null
                  setTargetUserId(nextTarget?.id || '')
                }}
                className={`w-full rounded-2xl border p-5 text-left transition-colors ${
                  selectedAccountId === account.id
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-bone-dark bg-white hover:bg-bone/40'
                }`}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-espresso">
                        {account.company_name || account.name || 'Unnamed Account'}
                      </h2>
                      <span className="rounded-full border border-bone-dark bg-bone px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-light">
                        {account.subscription_status || 'unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-stone-light">Account ID: {account.id}</p>
                    <p className="text-sm text-stone-light">Contact: {account.contact_email || 'n/a'}</p>
                    <p className="text-sm text-stone-light">
                      Primary manager: {account.primary_manager_name || 'unassigned'}
                    </p>
                  </div>
                  <div className="text-sm text-stone-light">
                    {account.members.length} team member{account.members.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-bone-dark bg-white p-8 text-sm text-stone-light">
              Search for an account to load ownership and billing handoff options.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-bone-dark bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-espresso">Transfer Ownership</h2>
          {selectedAccount ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-bone-dark bg-bone/40 p-4">
                <p className="text-sm font-semibold text-espresso">Selected account</p>
                <p className="text-sm text-stone-light">
                  {selectedAccount.company_name || selectedAccount.name || selectedAccount.id}
                </p>
                <p className="text-xs text-stone-light">Current owner user id: {selectedAccount.owner_user_id || 'n/a'}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-espresso">New primary manager</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full rounded-lg border border-terracotta/20 bg-bone px-3 py-2 text-sm text-espresso focus:border-terracotta focus:outline-none"
                >
                  <option value="">Choose a team member</option>
                  {selectedAccount.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name || member.email} · {member.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-espresso">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-terracotta/20 bg-bone px-3 py-2 text-sm text-espresso focus:border-terracotta focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-bone-dark bg-bone/40 p-4 text-sm text-espresso">
                <input
                  type="checkbox"
                  checked={demoteCurrentPrimaryManager}
                  onChange={(e) => setDemoteCurrentPrimaryManager(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-bone-dark text-terracotta focus:ring-terracotta"
                />
                <span>
                  Demote the current primary manager to coach if they are still present in the account.
                </span>
              </label>

              <button
                onClick={() => void transferOwnership()}
                disabled={transferring || !targetUserId || !supportSecret}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-terracotta to-terracotta-bright px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
              >
                <HiSwitchHorizontal />
                {transferring ? 'Transferring...' : 'Transfer Ownership'}
              </button>

              <div className="rounded-xl border border-clay/20 bg-clay/5 p-4 text-xs text-stone-light">
                <div className="flex items-center gap-2 font-semibold text-espresso">
                  <HiShieldCheck />
                  Notes
                </div>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  <li>The Stripe customer stays on the account.</li>
                  <li>The new manager can update the card from Billing after the handoff.</li>
                  <li>If the old manager is gone, use this page with the support secret.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-bone-dark bg-bone/30 p-6 text-sm text-stone-light">
              Select an account from the left to continue.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
