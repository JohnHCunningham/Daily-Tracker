'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function prepareRecoverySession() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const queryParams = new URLSearchParams(window.location.search)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const hashError = hashParams.get('error_description') || hashParams.get('error')
      const code = queryParams.get('code')

      if (hashError) {
        setError(hashError)
        setCheckingLink(false)
        return
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          setError(sessionError.message)
        } else {
          window.history.replaceState(null, '', '/reset-password')
        }

        setCheckingLink(false)
        return
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          setError(exchangeError.message)
        } else {
          window.history.replaceState(null, '', '/reset-password')
        }

        setCheckingLink(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('This reset link is invalid or expired. Please request a new password reset link.')
      }
      setCheckingLink(false)
    }

    void prepareRecoverySession()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <svg viewBox="0 0 200 200" className="w-10 h-10" aria-hidden="true">
              <circle cx="100" cy="100" r="82" fill="none" stroke="#F4EFE8" strokeWidth="6" />
              <circle cx="100" cy="100" r="58" fill="none" stroke="#F4EFE8" strokeWidth="6" />
              <circle cx="100" cy="100" r="34" fill="none" stroke="#F4EFE8" strokeWidth="6" />
              <circle cx="100" cy="100" r="12" fill="#B5583E" />
            </svg>
            <span className="font-bold text-2xl text-bone" style={{ fontFamily: "'Instrument Serif', serif" }}>
              One Click <em className="text-terracotta">Coaching</em>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-bone mt-6 mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Create a new password
          </h1>
          <p className="text-stone-light">Choose a new password for your account.</p>
        </div>

        {checkingLink ? (
          <div className="text-center text-stone-light">Checking reset link...</div>
        ) : (
        <form onSubmit={handleReset} className="space-y-6">
          {error && (
            <div className="bg-terracotta-dark/10 border border-terracotta/30 text-terracotta rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-bone mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-20 bg-espresso-light border border-terracotta/20 rounded-lg text-bone placeholder-stone/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-3 text-sm font-semibold text-terracotta hover:text-terracotta-bright"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-bone mb-2">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-espresso-light border border-terracotta/20 rounded-lg text-bone placeholder-stone/50 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!error}
            className="w-full bg-gradient-clay hover:shadow-glow-clay text-espresso font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        )}
      </div>
    </div>
  )
}
