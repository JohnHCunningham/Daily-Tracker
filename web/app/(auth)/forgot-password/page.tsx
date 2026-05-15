'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appOrigin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-bone">
            One Click<span className="text-terracotta"> Coaching</span>
          </Link>
          <h1 className="text-3xl font-bold text-bone mt-6 mb-2">Reset password</h1>
          <p className="text-stone-light">We&apos;ll send you a reset link</p>
        </div>

        {sent ? (
          <div className="bg-teal/10 border border-terracotta/30 text-terracotta rounded-lg p-4 text-center">
            <p>Check your email for a password reset link.</p>
            <Link href="/login" className="text-terracotta hover:text-terracotta-bright font-semibold mt-4 inline-block">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r bg-gradient-clay text-espresso font-bold py-3 px-6 rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-stone-light mt-6">
          <Link href="/login" className="text-terracotta hover:text-terracotta-bright font-semibold">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
