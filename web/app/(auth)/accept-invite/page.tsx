'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface InviteInfo {
  email: string
  role: string
}

function AcceptInviteForm() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [verifying, setVerifying] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  useEffect(() => {
    verifyToken()
  }, [token])

  async function verifyToken() {
    if (!token) {
      setError('No invitation token provided.')
      setVerifying(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('Invitations')
      .select('email, role, status, expires_at')
      .eq('token', token)
      .single()

    if (fetchError || !data) {
      setError('Invalid invitation link.')
      setVerifying(false)
      return
    }

    if (data.status !== 'pending') {
      setError('This invitation has already been used.')
      setVerifying(false)
      return
    }

    if (new Date(data.expires_at) < new Date()) {
      setError('This invitation has expired. Please ask your admin to send a new one.')
      setVerifying(false)
      return
    }

    setInviteInfo({ email: data.email, role: data.role })
    setVerifying(false)
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!token || !inviteInfo) {
      setError('Invalid invitation.')
      setLoading(false)
      return
    }

    // 1. Create auth user with the invited email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: inviteInfo.email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Accept invitation via RPC
    if (authData.user) {
      const { data: result, error: rpcError } = await supabase.rpc('accept_invitation', {
        p_token: token,
        p_auth_id: authData.user.id,
      })

      if (rpcError) {
        setError('Failed to join team. Please contact your admin.')
        setLoading(false)
        return
      }

      const parsed = typeof result === 'string' ? JSON.parse(result) : result
      if (parsed?.error) {
        setError(parsed.error)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
  }

  if (verifying) {
    return <div className="text-light-muted text-center">Verifying invitation...</div>
  }

  if (error && !inviteInfo) {
    return (
      <div className="text-center">
        <div className="bg-pink/10 border border-pink/30 text-pink rounded-lg p-4 text-sm mb-4">
          {error}
        </div>
        <Link href="/login" className="text-teal hover:text-aqua font-semibold text-sm">
          Go to Login
        </Link>
      </div>
    )
  }

  return (
    <>
      {inviteInfo && (
        <div className="bg-teal/10 border border-teal/20 rounded-lg p-4 mb-6 text-center">
          <p className="text-light text-sm">
            You&apos;ve been invited as a <span className="font-bold text-teal">{inviteInfo.role.toUpperCase()}</span>
          </p>
          <p className="text-light-muted text-xs mt-1">{inviteInfo.email}</p>
        </div>
      )}

      <form onSubmit={handleAccept} className="space-y-5">
        {error && (
          <div className="bg-pink/10 border border-pink/30 text-pink rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-light mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-navy-light border border-teal/20 rounded-lg text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-light mb-2">
            Create Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-3 bg-navy-light border border-teal/20 rounded-lg text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            placeholder="Min 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal to-aqua text-navy font-bold py-3 px-6 rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Team'}
        </button>
      </form>
    </>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-light">
            One Click<span className="text-teal"> Coaching</span>
          </Link>
          <h1 className="text-3xl font-bold text-light mt-6 mb-2">Accept Invitation</h1>
          <p className="text-light-muted">Join your team on One Click Coaching</p>
        </div>

        <Suspense fallback={<div className="text-light-muted text-center">Loading...</div>}>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  )
}
