'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get optional plan parameters from URL
  const repCount = parseInt(searchParams.get('reps') || '1', 10)
  const billingCycle = searchParams.get('billing') || 'monthly'

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          company_name: company,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Create account and user record via RPC
    if (authData.user) {
      const { error: rpcError } = await supabase.rpc('create_account_on_signup', {
        p_auth_id: authData.user.id,
        p_email: email,
        p_full_name: name,
        p_company_name: company,
      })

      if (rpcError) {
        console.error('Account creation error:', rpcError)
        setError('Account setup failed. Please try again or contact support.')
        setLoading(false)
        return
      }
    }

    // Redirect to Stripe Checkout for subscription
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repCount: repCount,
          billingCycle: billingCycle as 'monthly' | 'annual',
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
        return
      }
    } catch (checkoutError) {
      console.error('Checkout redirect error:', checkoutError)
      // If checkout fails, still redirect to dashboard (they can subscribe later)
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-bone">
            One Click<span className="text-terracotta"> Coaching</span>
          </Link>
          <h1 className="text-3xl font-bold text-bone mt-6 mb-2">Create your account</h1>
          <p className="text-stone-light">Start coaching your team with AI</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          {error && (
            <div className="bg-terracotta-dark/10 border border-terracotta/30 text-terracotta rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

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
              className="w-full px-4 py-3 bg-espresso-light border border-terracotta/20 rounded-lg text-bone placeholder-stone/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-bone mb-2">
              Company Name
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="w-full px-4 py-3 bg-espresso-light border border-terracotta/20 rounded-lg text-bone placeholder-stone/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-bone mb-2">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-espresso-light border border-terracotta/20 rounded-lg text-bone placeholder-stone/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-bone mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-espresso-light border border-terracotta/20 rounded-lg text-bone placeholder-stone/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              placeholder="Min 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r bg-gradient-clay text-espresso font-bold py-3 px-6 rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-stone-light mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-terracotta hover:text-terracotta-bright font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-espresso flex items-center justify-center">
        <div className="text-bone">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
