'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        // Don't block signup - account can be created on first login
      }
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-light">
            One Click<span className="text-teal"> Coaching</span>
          </Link>
          <h1 className="text-3xl font-bold text-light mt-6 mb-2">Create your account</h1>
          <p className="text-light-muted">Start coaching your team with AI</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
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
              placeholder="John Smith"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-light mb-2">
              Company Name
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="w-full px-4 py-3 bg-navy-light border border-teal/20 rounded-lg text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-light mb-2">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-navy-light border border-teal/20 rounded-lg text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-light mb-2">
              Password
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-light-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-teal hover:text-aqua font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
