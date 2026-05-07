'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiUserAdd, HiUserCircle, HiPlus, HiTrash } from 'react-icons/hi'
import toast from 'react-hot-toast'

interface TeamMember {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  token: string
  expires_at: string
}

interface SubscriptionInfo {
  repCount: number
  maxTeamMembers: number
  subscriptionStatus: string
  primaryManagerUserId?: string | null
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [currentRole, setCurrentRole] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [primaryManagerUserId, setPrimaryManagerUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('rep')
  const [inviting, setInviting] = useState(false)
  const [cancellingIds, setCancellingIds] = useState<string[]>([])
  const [removingMemberIds, setRemovingMemberIds] = useState<string[]>([])
  const [transferringLeadership, setTransferringLeadership] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [leaveAccount, setLeaveAccount] = useState(false)

  const supabase = createClient()

  const loadTeam = useCallback(async () => {
    setLoading(true)

    // Get current user's account
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentUser } = await supabase
      .from('Users')
      .select('id, account_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) {
      setLoading(false)
      return
    }
    setCurrentUserId(currentUser.id)
    setCurrentRole(currentUser.role || '')

    // Load subscription info
    const { data: accountData } = await supabase
      .from('Accounts')
      .select('rep_count, max_team_members, subscription_status, primary_manager_user_id')
      .eq('id', currentUser.account_id)
      .single()

    if (accountData) {
      setSubscription({
        repCount: accountData.rep_count || 1,
        maxTeamMembers: accountData.max_team_members || 10,
        subscriptionStatus: accountData.subscription_status || 'trialing',
        primaryManagerUserId: accountData.primary_manager_user_id || null,
      })
      setPrimaryManagerUserId(accountData.primary_manager_user_id || null)
    }

    // Load team members
    const { data: teamData } = await supabase
      .from('Users')
      .select('id, full_name, email, role, created_at')
      .eq('account_id', currentUser.account_id)
      .order('created_at')

    if (teamData) setMembers(teamData)

    // Load pending invitations
    const { data: inviteData } = await supabase
      .from('Invitations')
      .select('id, email, role, status, token, expires_at')
      .eq('account_id', currentUser.account_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (inviteData) setInvitations(inviteData)

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadTeam()
  }, [loadTeam])

  // Calculate rep slot usage
  const reps = members.filter(m => m.role === 'rep')
  const pendingRepInvites = invitations.filter(i => i.role === 'rep')
  const usedSlots = reps.length + pendingRepInvites.length
  const totalSlots = subscription?.repCount || 1
  const availableSlots = Math.max(0, totalSlots - usedSlots)
  const emptySlots = Math.max(0, totalSlots - reps.length - pendingRepInvites.length)

  // Non-rep team members (admins, managers, coaches)
  const nonReps = members.filter(m => m.role !== 'rep')
  const transferableMembers = members.filter((m) => m.id !== currentUserId)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()

    // Check slot availability for rep invites
    if (inviteRole === 'rep' && availableSlots <= 0) {
      toast.error('No rep slots available. Opening Billing to add one.')
      window.location.href = '/settings#billing'
      return
    }

    setInviting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) return

    const { data: invitation, error } = await supabase
      .from('Invitations')
      .insert({
        account_id: currentUser.account_id,
        email: inviteEmail,
        role: inviteRole,
        invited_by: user.id,
      })
      .select('id')
      .single()

    if (!error && invitation) {
      // Send the invite email
      try {
        const emailRes = await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitationId: invitation.id }),
        })
        if (!emailRes.ok) {
          console.error('Send invite failed:', emailRes.status)
        }
      } catch (e) {
        console.error('Send invite error:', e)
      }

      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('rep')
      setShowInviteModal(false)
      loadTeam()
    } else {
      toast.error('Failed to send invitation')
    }

    setInviting(false)
  }

  async function handleCancelInvitation(invitationId: string) {
    setCancellingIds((prev) => [...prev, invitationId])

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(data.error || 'Failed to cancel invitation')
        return
      }

      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
      toast.success('Invitation cancelled')
    } catch {
      toast.error('Failed to cancel invitation')
    } finally {
      setCancellingIds((prev) => prev.filter((id) => id !== invitationId))
    }
  }

  async function handleRemoveRep(memberId: string) {
    setRemovingMemberIds((prev) => [...prev, memberId])

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(data.error || 'Failed to remove rep')
        return
      }

      toast.success('Rep removed')
      await loadTeam()
    } catch {
      toast.error('Failed to remove rep')
    } finally {
      setRemovingMemberIds((prev) => prev.filter((id) => id !== memberId))
    }
  }

  async function handleTransferLeadership(e: React.FormEvent) {
    e.preventDefault()

    if (!transferTargetId) {
      toast.error('Choose the new manager')
      return
    }

    setTransferringLeadership(true)

    try {
      const response = await fetch('/api/team/transfer-leadership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newManagerId: transferTargetId, leaveAccount }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(data.error || 'Failed to transfer leadership')
        return
      }

      if (transferTargetId) {
        setPrimaryManagerUserId(transferTargetId)
        setMembers((prev) =>
          prev.map((member) => {
            if (member.id === transferTargetId) {
              return { ...member, role: member.role === 'admin' ? 'admin' : 'manager' }
            }
            if (!leaveAccount && member.id === currentUserId) {
              return { ...member, role: 'coach' }
            }
            return member
          })
        )
      }

      toast.success('Leadership transferred')
      await loadTeam()

      if (leaveAccount) {
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
    } catch {
      toast.error('Failed to transfer leadership')
    } finally {
      setTransferringLeadership(false)
    }
  }

  function openInviteModal() {
    if (availableSlots <= 0) {
      toast.error('No rep slots available. Opening Billing to add one.')
      window.location.href = '/settings#billing'
      return
    }
    setShowInviteModal(true)
  }

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-clay/20 text-clay border-clay/30',
    manager: 'bg-terracotta/20 text-terracotta border-terracotta/30',
    coach: 'bg-terracotta-bright/20 text-terracotta-bright border-aqua/30',
    rep: 'bg-white text-stone-light border-bone-dark',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-terracotta/10">
        <div>
          <h1 className="text-3xl font-bold text-espresso">Team</h1>
          <p className="text-stone-light mt-1">
            {reps.length} of {totalSlots} rep slot{totalSlots !== 1 ? 's' : ''} used
          </p>
          {primaryManagerUserId && (
            <p className="text-xs text-stone-light mt-1">
              Primary manager is {members.find((member) => member.id === primaryManagerUserId)?.full_name || members.find((member) => member.id === primaryManagerUserId)?.email || 'unassigned'}.
            </p>
          )}
        </div>
        <button
          onClick={openInviteModal}
          className="flex items-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-5 rounded-lg hover:shadow-lg transition-all"
        >
          <HiUserAdd className="text-lg" />
          {availableSlots > 0 ? 'Invite Rep' : 'Add Rep Slots'}
        </button>
      </div>

      {availableSlots === 0 && (
        <div className="mb-8 rounded-2xl border border-gold/30 bg-gold/10 p-5">
          <p className="font-semibold text-espresso">You are out of rep slots.</p>
          <p className="text-sm text-stone-light mt-1">
            Open Billing to increase the rep count, then come back here to invite the next rep.
          </p>
          <div className="mt-4">
            <Link
              href="/settings#billing"
              className="inline-flex items-center justify-center rounded-lg bg-terracotta px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-bright transition-colors"
            >
              Open Billing
            </Link>
          </div>
        </div>
      )}

      {/* Leadership Transfer */}
      {['admin', 'manager'].includes(currentRole) && transferableMembers.length > 0 && (
        <div className="mb-8 rounded-2xl border border-terracotta/20 bg-gradient-to-r from-white to-bone/30 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">Leadership handoff</p>
              <h2 className="text-xl font-bold text-espresso mt-1">Transfer manager access</h2>
              <p className="text-sm text-stone-light mt-1">
                Choose who takes over the account when a manager moves on. The Stripe customer stays on the account, and the new manager can update the card from Billing after the handoff.
              </p>
            </div>
            <Link
              href="/settings#billing"
              className="inline-flex items-center justify-center rounded-lg border border-bone-dark bg-white px-4 py-2.5 text-sm font-semibold text-espresso hover:bg-bone-light transition-colors"
            >
              Open Billing
            </Link>
          </div>
          <form onSubmit={handleTransferLeadership} className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="block text-sm font-medium text-espresso mb-2">New manager</label>
              <select
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-terracotta/20 rounded-lg text-espresso focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-teal/20"
              >
                <option value="">Select a team member</option>
                {transferableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name || member.email} ({member.role})
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-light mt-2">
                The selected person will become manager. If you leave the account, your access will be removed after the transfer.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-espresso">
                <input
                  type="checkbox"
                  checked={leaveAccount}
                  onChange={(e) => setLeaveAccount(e.target.checked)}
                  className="h-4 w-4 rounded border-bone-dark text-terracotta focus:ring-terracotta"
                />
                I’m leaving this account after the handoff
              </label>
              <button
                type="submit"
                disabled={transferringLeadership || !transferTargetId}
                className="inline-flex items-center justify-center rounded-lg bg-terracotta px-4 py-3 text-sm font-semibold text-white hover:bg-terracotta-bright transition-colors disabled:opacity-50"
              >
                {transferringLeadership ? 'Transferring...' : 'Transfer Leadership'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rep Slots Visualization */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-espresso">Rep Slots</h2>
          {availableSlots === 0 && (
            <Link
              href="/settings#billing"
              className="text-sm text-terracotta hover:text-terracotta-bright font-medium"
            >
              + Add more slots
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Filled Slots - Active Reps */}
          {reps.map((rep) => (
            <div
              key={rep.id}
              className="relative flex flex-col items-stretch p-4 bg-gradient-to-br from-white to-bone-light/30 rounded-xl border-t-2 border-t-terracotta/30 border-l border-r border-b border-bone-dark/50 hover:border-terracotta/50 hover:shadow-md transition-all"
            >
              <Link href={`/team/${rep.id}`} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-terracotta/20 to-terracotta/10 rounded-full flex items-center justify-center mb-3">
                  <HiUserCircle className="text-terracotta text-4xl" />
                </div>
                <p className="font-semibold text-espresso text-sm text-center truncate w-full">
                  {rep.full_name || rep.email.split('@')[0]}
                </p>
                <p className="text-xs text-stone-light truncate w-full text-center">
                  {rep.email}
                </p>
              </Link>
              {['admin', 'manager'].includes(currentRole) && (
                <button
                  type="button"
                  onClick={() => handleRemoveRep(rep.id)}
                  disabled={removingMemberIds.includes(rep.id)}
                  className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold text-terracotta border border-terracotta/20 bg-terracotta/5 px-2 py-1 rounded-md hover:bg-terracotta/10 disabled:opacity-50"
                >
                  <HiTrash />
                  {removingMemberIds.includes(rep.id) ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
          ))}

          {/* Pending Rep Invites */}
          {pendingRepInvites.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-col items-center p-4 bg-white/50 rounded-xl border border-yellow-500/20"
            >
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-3 relative">
                <HiUserCircle className="text-yellow-500/50 text-4xl" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">!</span>
                </span>
              </div>
              <p className="font-semibold text-yellow-500 text-sm text-center">Pending</p>
              <p className="text-xs text-stone-light truncate w-full text-center">
                {inv.email}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/accept-invite?token=${inv.token}`}
                  className="text-xs font-semibold text-terracotta border border-terracotta/20 bg-terracotta/5 px-2 py-1 rounded-md hover:bg-terracotta/10"
                >
                  Finish Setup
                </Link>
                <button
                  type="button"
                  onClick={() => handleCancelInvitation(inv.id)}
                  disabled={cancellingIds.includes(inv.id)}
                  className="text-xs font-semibold text-terracotta border border-terracotta/20 bg-terracotta/5 px-2 py-1 rounded-md hover:bg-terracotta/10 disabled:opacity-50"
                >
                  {cancellingIds.includes(inv.id) ? 'Cancelling...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}

          {/* Empty Slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <button
              key={`empty-${i}`}
              onClick={openInviteModal}
              className="flex flex-col items-center justify-center p-4 bg-white/30 rounded-xl border-2 border-dashed border-terracotta/20 hover:border-teal/40 hover:bg-white/50 transition-all min-h-[140px] group"
            >
              <div className="w-16 h-16 bg-teal/5 rounded-full flex items-center justify-center mb-3 group-hover:bg-terracotta/10 transition-colors">
                <HiPlus className="text-teal/40 text-3xl group-hover:text-teal/60" />
              </div>
              <p className="text-sm text-teal/50 group-hover:text-teal/70 font-medium">Add Rep</p>
            </button>
          ))}
        </div>

        {/* Upgrade prompt if no slots available */}
        {availableSlots === 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-terracotta/5 to-clay/5 border-l-4 border-l-terracotta border-t border-r border-b border-terracotta/20 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-espresso font-medium">Need more rep slots?</p>
                <p className="text-sm text-stone-light">
                  Upgrade your plan to add more team members
                </p>
              </div>
              <Link
                href="/settings#billing"
                className="bg-terracotta text-white font-bold py-2 px-4 rounded-lg hover:bg-terracotta-bright transition-colors text-sm"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Other Team Members (Non-Reps) */}
      {nonReps.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-espresso mb-4">Admins & Managers</h2>
          <div className="grid gap-3">
            {nonReps.map((member) => (
              <Link
                key={member.id}
                href={`/team/${member.id}`}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-bone-light/20 rounded-xl border-l-4 border-l-clay border-t border-r border-b border-bone-dark/50 hover:border-clay/50 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-clay/20 to-clay/10 rounded-full flex items-center justify-center">
                  <HiUserCircle className="text-clay text-3xl" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-espresso">{member.full_name || member.email}</p>
                  <p className="text-sm text-stone-light">{member.email}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${roleBadgeColor[member.role] || roleBadgeColor.rep}`}>
                  {member.role.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending Non-Rep Invitations */}
      {invitations.filter(i => i.role !== 'rep').length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-espresso mb-4">Pending Invitations</h2>
          <div className="grid gap-3">
            {invitations.filter(i => i.role !== 'rep').map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-teal/5"
              >
                <div>
                  <p className="text-espresso text-sm">{inv.email}</p>
                  <p className="text-xs text-stone-light">
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-clay bg-clay/10 px-2 py-1 rounded-full border border-clay/30">
                    {inv.role.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCancelInvitation(inv.id)}
                    disabled={cancellingIds.includes(inv.id)}
                    className="text-xs font-semibold text-terracotta border border-terracotta/20 bg-terracotta/5 px-2 py-1 rounded-md hover:bg-terracotta/10 disabled:opacity-50"
                  >
                    {cancellingIds.includes(inv.id) ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.filter(i => i.role === 'rep').length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-espresso mb-4">Pending Rep Invitations</h2>
          <div className="grid gap-3">
            {invitations.filter(i => i.role === 'rep').map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-yellow-500/20"
              >
                <div>
                  <p className="text-espresso text-sm">{inv.email}</p>
                  <p className="text-xs text-stone-light">
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/30">
                    PENDING
                  </span>
                  <Link
                    href={`/accept-invite?token=${inv.token}`}
                    className="text-xs font-semibold text-terracotta border border-terracotta/20 bg-terracotta/5 px-2 py-1 rounded-md hover:bg-terracotta/10"
                  >
                    Finish Setup
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleCancelInvitation(inv.id)}
                    disabled={cancellingIds.includes(inv.id)}
                    className="text-xs font-semibold text-terracotta border border-terracotta/20 bg-terracotta/5 px-2 py-1 rounded-md hover:bg-terracotta/10 disabled:opacity-50"
                  >
                    {cancellingIds.includes(inv.id) ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-bone border border-terracotta/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-espresso mb-2">Invite Team Member</h2>
            <p className="text-stone-light text-sm mb-6">
              {availableSlots} rep slot{availableSlots !== 1 ? 's' : ''} available
            </p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-terracotta/20 rounded-lg text-espresso placeholder-light-muted/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-teal/20"
                  placeholder="rep@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-terracotta/20 rounded-lg text-espresso focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-teal/20"
                >
                  <option value="rep">Sales Rep</option>
                  <option value="coach">Coach</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                {inviteRole === 'rep' && availableSlots <= 1 && (
                  <p className="text-xs text-yellow-500 mt-2">
                    This will use your last available rep slot
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 px-4 bg-white text-stone-light border border-terracotta/20 rounded-lg hover:border-teal/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || (inviteRole === 'rep' && availableSlots <= 0)}
                  className="flex-1 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
