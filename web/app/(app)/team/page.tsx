'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HiUserAdd, HiUserCircle } from 'react-icons/hi'

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

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) return

    const { error } = await supabase
      .from('Invitations')
      .insert({
        account_id: currentUser.account_id,
        email: inviteEmail,
        role: inviteRole,
        invited_by: user.id,
      })

    if (!error) {
      setInviteEmail('')
      setInviteRole('rep')
      setShowInviteModal(false)
      loadTeam()
    }

    setInviting(false)
  }

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-gold/20 text-gold border-gold/30',
    manager: 'bg-teal/20 text-teal border-teal/30',
    coach: 'bg-aqua/20 text-aqua border-aqua/30',
    rep: 'bg-navy-light text-light-muted border-navy-light',
  }

  if (loading) {
    return (
      <div className="text-light-muted">Loading team...</div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-light">Team</h1>
          <p className="text-light-muted mt-1">{members.length} members</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal to-aqua text-navy font-bold py-2.5 px-5 rounded-lg hover:shadow-lg transition-all"
        >
          <HiUserAdd className="text-lg" />
          Invite Member
        </button>
      </div>

      {/* Team Members */}
      <div className="grid gap-4">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/team/${member.id}`}
            className="flex items-center gap-4 p-4 bg-navy-light rounded-xl border border-teal/10 hover:border-teal/30 transition-colors"
          >
            <div className="w-12 h-12 bg-teal/20 rounded-full flex items-center justify-center">
              <HiUserCircle className="text-teal text-3xl" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-light">{member.full_name || member.email}</p>
              <p className="text-sm text-light-muted">{member.email}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${roleBadgeColor[member.role] || roleBadgeColor.rep}`}>
              {member.role.toUpperCase()}
            </span>
          </Link>
        ))}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-light mb-4">Pending Invitations</h2>
          <div className="grid gap-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 bg-navy-light/50 rounded-lg border border-teal/5"
              >
                <div>
                  <p className="text-light text-sm">{inv.email}</p>
                  <p className="text-xs text-light-muted">
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-1 rounded-full border border-gold/20">
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
          <div className="bg-navy border border-teal/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-light mb-6">Invite Team Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-light mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-navy-light border border-teal/20 rounded-lg text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                  placeholder="rep@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-light mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-navy-light border border-teal/20 rounded-lg text-light focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                >
                  <option value="rep">Sales Rep</option>
                  <option value="coach">Coach</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 px-4 bg-navy-light text-light-muted border border-teal/20 rounded-lg hover:border-teal/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-gradient-to-r from-teal to-aqua text-navy font-bold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
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
