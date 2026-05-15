'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import confetti from 'canvas-confetti'
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
  const [success, setSuccess] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [verifying, setVerifying] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  const verifyToken = useCallback(async () => {
    try {
      if (!token) {
        setError('No invitation token provided.')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('Invitations')
        .select('email, role, status, expires_at')
        .eq('token', token)
        .single()

      if (fetchError || !data) {
        setError('Invalid invitation link.')
        return
      }

      if (data.status !== 'pending') {
        setError('This invitation has already been used.')
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired. Please ask your admin to send a new one.')
        return
      }

      setInviteInfo({ email: data.email, role: data.role })
      const { data: sessionData } = await supabase.auth.getUser()
      if (sessionData.user?.email && sessionData.user.email !== data.email) {
        await supabase.auth.signOut()
      }
    } catch {
      setError('Could not verify this invitation. Please refresh the link or ask for a new invite.')
    } finally {
      setVerifying(false)
    }
  }, [supabase, token])

  useEffect(() => {
    void verifyToken()
  }, [verifyToken])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!token || !inviteInfo) {
      setError('Invalid invitation.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()

    // 1. Create auth user with the invited email
    let authId: string | null = null

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: inviteInfo.email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (authError) {
      // If user already exists, try signing in instead
      if (authError.message.toLowerCase().includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: inviteInfo.email,
          password,
        })
        if (signInError) {
          setError('Account exists. Please enter the correct password to join the team.')
          setLoading(false)
          return
        }
        authId = signInData.user?.id || null
      } else {
        setError(authError.message)
        setLoading(false)
        return
      }
    } else {
      authId = authData.user?.id || null
    }

    if (!authId) {
      setError('We could not create your account. Please try again or sign in with the invited email.')
      setLoading(false)
      return
    }

    const acceptRes = await fetch('/api/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, authId }),
    })

    if (!acceptRes.ok) {
      const errBody = await acceptRes.json().catch(() => ({}))
      setError(errBody.error || 'Failed to join team')
      setLoading(false)
      return
    }

    const { error: finalSignInError } = await supabase.auth.signInWithPassword({
      email: inviteInfo.email,
      password,
    })

    if (finalSignInError) {
      setError(finalSignInError.message || 'Invitation accepted, but sign-in failed.')
      setLoading(false)
      return
    }

    setSuccess(true)
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    })
    setTimeout(() => router.replace('/dashboard'), 2500)
  }

  if (verifying) {
    return <div className="text-stone-light text-center">Verifying invitation...</div>
  }

  if (error && !inviteInfo) {
    return (
      <div className="text-center">
        <div className="bg-terracotta-dark/10 border border-terracotta/30 text-terracotta rounded-lg p-4 text-sm mb-4">
          {error}
        </div>
        <Link href="/login" className="text-terracotta hover:text-terracotta-bright font-semibold text-sm">
          Go to Login
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-bone mb-2">Welcome to the team!</h2>
        <p className="text-stone-light">Redirecting to your dashboard...</p>
      </div>
    )
  }

  return (
    <>
      {inviteInfo && (
        <div className="bg-teal/10 border border-terracotta/20 rounded-lg p-4 mb-6 text-center">
          <p className="text-bone text-sm">
            You&apos;ve been invited as a <span className="font-bold text-terracotta">{inviteInfo.role.toUpperCase()}</span>
          </p>
          <p className="text-stone-light text-xs mt-1">{inviteInfo.email}</p>
        </div>
      )}

      <form onSubmit={handleAccept} className="space-y-5">
        {error && (
          <div className="bg-terracotta-dark/10 border border-terracotta/30 text-terracotta rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-bone mb-2">
            Invited Email
          </label>
          <input
            id="email"
            type="email"
            value={inviteInfo?.email || ''}
            readOnly
            autoComplete="username"
            className="w-full px-4 py-3 bg-espresso-light border border-terracotta/20 rounded-lg text-bone/80 placeholder-stone/50 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-bone mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full px-4 py-3 bg-espresso-light border border-terracotta/20 rounded-lg text-bone placeholder-stone/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-bone mb-2">
            Create Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-espresso-light border border-terracotta/20 rounded-lg text-bone placeholder-stone/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
            placeholder="Min 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r bg-gradient-clay text-espresso font-bold py-3 px-6 rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Team'}
        </button>
      </form>
    </>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-bone">
            One Click<span className="text-terracotta"> Coaching</span>
          </Link>
          <h1 className="text-3xl font-bold text-bone mt-6 mb-2">Accept Invitation</h1>
          <p className="text-stone-light">Join your team on One Click Coaching</p>
        </div>

        <Suspense fallback={<div className="text-stone-light text-center">Loading...</div>}>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  )
}
