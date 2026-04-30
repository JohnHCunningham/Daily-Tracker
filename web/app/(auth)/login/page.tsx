'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <svg viewBox="0 0 200 200" className="w-10 h-10" aria-hidden="true">
              <circle cx="100" cy="100" r="82" fill="none" stroke="#F4EFE8" strokeWidth="6"/>
              <circle cx="100" cy="100" r="58" fill="none" stroke="#F4EFE8" strokeWidth="6"/>
              <circle cx="100" cy="100" r="34" fill="none" stroke="#F4EFE8" strokeWidth="6"/>
              <circle cx="100" cy="100" r="12" fill="#B5583E"/>
            </svg>
            <span className="font-bold text-2xl text-bone" style={{ fontFamily: "'Instrument Serif', serif" }}>
              One Click <em className="text-terracotta">Coaching</em>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-bone mt-6 mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Welcome back
          </h1>
          <p className="text-stone-light">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-terracotta-dark/10 border border-terracotta/30 text-terracotta rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-bone mb-2">
              Email
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
              className="w-full px-4 py-3 bg-espresso-light border border-terracotta/20 rounded-lg text-bone placeholder-stone/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              placeholder="Your password"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-sm text-terracotta hover:text-terracotta-bright">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-clay hover:shadow-glow-clay text-espresso font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-stone-light mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-terracotta hover:text-terracotta-bright font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
