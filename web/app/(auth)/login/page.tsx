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
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-light">
            One Click<span className="text-teal"> Coaching</span>
          </Link>
          <h1 className="text-3xl font-bold text-light mt-6 mb-2">Welcome back</h1>
          <p className="text-light-muted">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-pink/10 border border-pink/30 text-pink rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-light mb-2">
              Email
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
              className="w-full px-4 py-3 bg-navy-light border border-teal/20 rounded-lg text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              placeholder="Your password"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-sm text-teal hover:text-aqua">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal to-aqua text-navy font-bold py-3 px-6 rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-light-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-teal hover:text-aqua font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
