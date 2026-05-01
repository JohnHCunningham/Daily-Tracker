'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiUserAdd, HiUserCircle, HiPlus } from 'react-icons/hi'
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
  expires_at: string
}

interface SubscriptionInfo {
  repCount: number
  maxTeamMembers: number
  subscriptionStatus: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('rep')
  const [inviting, setInviting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadTeam()
  }, [])

  async function loadTeam() {
    setLoading(true)

    // Get current user's account
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) {
      setLoading(false)
      return
    }

    // Load subscription info
    const { data: accountData } = await supabase
      .from('Accounts')
      .select('rep_count, max_team_members, subscription_status')
      .eq('id', currentUser.account_id)
      .single()

    if (accountData) {
      setSubscription({
        repCount: accountData.rep_count || 1,
        maxTeamMembers: accountData.max_team_members || 10,
        subscriptionStatus: accountData.subscription_status || 'trialing',
      })
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
      .select('id, email, role, status, expires_at')
      .eq('account_id', currentUser.account_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (inviteData) setInvitations(inviteData)

    setLoading(false)
  }

  // Calculate rep slot usage
  const reps = members.filter(m => m.role === 'rep')
  const pendingRepInvites = invitations.filter(i => i.role === 'rep')
  const usedSlots = reps.length + pendingRepInvites.length
  const totalSlots = subscription?.repCount || 1
  const availableSlots = Math.max(0, totalSlots - usedSlots)
  const emptySlots = Math.max(0, totalSlots - reps.length - pendingRepInvites.length)

  // Non-rep team members (admins, managers, coaches)
  const nonReps = members.filter(m => m.role !== 'rep')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()

    // Check slot availability for rep invites
    if (inviteRole === 'rep' && availableSlots <= 0) {
      toast.error('No rep slots available. Please upgrade your plan.')
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

  function openInviteModal() {
    if (availableSlots <= 0) {
      toast.error('No rep slots available. Please upgrade your plan.')
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
        </div>
        <button
          onClick={openInviteModal}
          className="flex items-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-5 rounded-lg hover:shadow-lg transition-all"
        >
          <HiUserAdd className="text-lg" />
          Invite Rep
        </button>
      </div>

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
            <Link
              key={rep.id}
              href={`/team/${rep.id}`}
              className="flex flex-col items-center p-4 bg-gradient-to-br from-white to-bone-light/30 rounded-xl border-t-2 border-t-terracotta/30 border-l border-r border-b border-bone-dark/50 hover:border-terracotta/50 hover:shadow-md transition-all"
            >
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
                <span className="text-xs font-bold text-clay bg-clay/10 px-2 py-1 rounded-full border border-clay/30">
                  {inv.role.toUpperCase()}
                </span>
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
