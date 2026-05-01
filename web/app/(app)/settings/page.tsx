'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { PRICE_PER_REP } from '@/lib/stripe'

interface AccountInfo {
  id: string
  name: string
  admin_designation: string | null
  logo_url: string | null
  primary_color: string | null
  accent_color: string | null
  company_name: string | null
  email_from_name: string | null
}

export default function SettingsPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [form, setForm] = useState({
    name: '',
    company_name: '',
    logo_url: '',
    primary_color: '#2A221C', // Espresso
    accent_color: '#B5583E', // Terracotta
    email_from_name: 'One Click Coaching',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [newRepCount, setNewRepCount] = useState<number | null>(null)
  const [updatingPlan, setUpdatingPlan] = useState(false)
  const supabase = createClient()
  const { subscription, loading: subscriptionLoading, isActive, isTrialing, isPastDue, daysLeftInTrial, refetch } = useSubscription()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) { setLoading(false); return }

    const { data: accountData } = await supabase
      .from('Accounts')
      .select('id, name, admin_designation, logo_url, primary_color, accent_color, company_name, email_from_name')
      .eq('id', currentUser.account_id)
      .single()

    if (accountData) {
      setAccount(accountData)
      setForm({
        name: accountData.name || '',
        company_name: accountData.company_name || '',
        logo_url: accountData.logo_url || '',
        primary_color: accountData.primary_color || '#0C1030',
        accent_color: accountData.accent_color || '#10C3B0',
        email_from_name: accountData.email_from_name || 'One Click Coaching',
      })
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!account) return
    setSaving(true)

    const { error } = await supabase
      .from('Accounts')
      .update({
        name: form.name,
        company_name: form.company_name,
        logo_url: form.logo_url || null,
        primary_color: form.primary_color,
        accent_color: form.accent_color,
        email_from_name: form.email_from_name,
      })
      .eq('id', account.id)

    if (!error) {
      toast.success('Settings saved')
    } else {
      toast.error('Failed to save settings')
    }
    setSaving(false)
  }

  // Initialize newRepCount when subscription loads
  useEffect(() => {
    if (subscription && newRepCount === null) {
      setNewRepCount(subscription.repCount)
    }
  }, [subscription, newRepCount])

  async function handleUpdatePlan() {
    if (!newRepCount || newRepCount === subscription?.repCount) return

    setUpdatingPlan(true)
    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRepCount }),
      })
      const data = await response.json()

      if (data.url) {
        // Redirect to checkout for new subscription
        window.location.href = data.url
      } else if (data.success) {
        toast.success(`Plan updated to ${newRepCount} reps`)
        refetch()
      } else {
        toast.error(data.error || 'Failed to update plan')
      }
    } catch {
      toast.error('Failed to update plan')
    } finally {
      setUpdatingPlan(false)
    }
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
      <h1 className="text-2xl font-bold text-espresso mb-8">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Account Settings */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-stone-light mb-1">Account Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-bone border border-terracotta/20 rounded-lg text-espresso text-sm focus:outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-light mb-1">Company Name (displayed in app)</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-3 py-2 bg-bone border border-terracotta/20 rounded-lg text-espresso text-sm focus:outline-none focus:border-terracotta"
              />
            </div>
          </div>
        </div>

        {/* White-Label Branding */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-stone-light mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://yourcompany.com/logo.png"
                className="w-full px-3 py-2 bg-bone border border-terracotta/20 rounded-lg text-espresso text-sm focus:outline-none focus:border-terracotta placeholder:text-stone-light/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-stone-light mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="w-10 h-10 rounded border border-terracotta/20 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-bone border border-terracotta/20 rounded-lg text-espresso text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-light mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="w-10 h-10 rounded border border-terracotta/20 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-bone border border-terracotta/20 rounded-lg text-espresso text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>
            </div>
            {form.logo_url && (
              <div className="p-3 bg-bone rounded-lg border border-bone-dark">
                <p className="text-xs text-stone-light mb-2">Preview:</p>
                <img src={form.logo_url} alt="Logo preview" className="h-8 object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Email</h2>
          <div>
            <label className="block text-sm text-stone-light mb-1">Email "From" Name</label>
            <input
              type="text"
              value={form.email_from_name}
              onChange={(e) => setForm({ ...form, email_from_name: e.target.value })}
              className="w-full px-3 py-2 bg-bone border border-terracotta/20 rounded-lg text-espresso text-sm focus:outline-none focus:border-terracotta"
            />
            <p className="text-xs text-stone-light mt-1">This name appears in coaching emails sent to reps.</p>
          </div>
        </div>

        {/* Billing Section */}
        <div id="billing" className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Billing & Subscription</h2>

          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
            </div>
          ) : subscription ? (
            <div className="space-y-4">
              {/* Subscription Status */}
              <div className="flex items-center justify-between p-4 bg-bone rounded-lg border border-bone-dark">
                <div>
                  <p className="text-sm text-stone-light">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-green-500' :
                      isTrialing ? 'bg-yellow-500' :
                      isPastDue ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="font-semibold text-espresso capitalize">
                      {subscription.subscriptionStatus}
                    </span>
                    {isTrialing && daysLeftInTrial !== null && (
                      <span className="text-xs text-stone-light">
                        ({daysLeftInTrial} days left)
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-light">Plan</p>
                  <p className="font-semibold text-espresso">
                    {subscription.repCount} rep{subscription.repCount !== 1 ? 's' : ''} • ${subscription.billingCycle === 'annual' ? PRICE_PER_REP.annual : PRICE_PER_REP.monthly}/{subscription.billingCycle === 'annual' ? 'year' : 'month'} per rep
                  </p>
                </div>
              </div>

              {/* Rep Count Adjuster */}
              <div className="p-4 bg-bone rounded-lg border border-bone-dark">
                <p className="text-sm text-stone-light mb-3">Adjust Rep Slots</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNewRepCount(Math.max(1, (newRepCount || 1) - 1))}
                      disabled={!newRepCount || newRepCount <= 1}
                      className="w-10 h-10 bg-white border border-terracotta/20 rounded-lg text-espresso font-bold hover:border-teal/40 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newRepCount || subscription.repCount}
                      onChange={(e) => setNewRepCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-10 bg-white border border-terracotta/20 rounded-lg text-espresso text-center font-bold focus:outline-none focus:border-terracotta"
                    />
                    <button
                      onClick={() => setNewRepCount((newRepCount || 1) + 1)}
                      className="w-10 h-10 bg-white border border-terracotta/20 rounded-lg text-espresso font-bold hover:border-teal/40"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-espresso">
                      {newRepCount || subscription.repCount} reps × ${subscription.billingCycle === 'annual' ? PRICE_PER_REP.annual : PRICE_PER_REP.monthly}/{subscription.billingCycle === 'annual' ? 'yr' : 'mo'}
                    </p>
                    <p className="text-lg font-bold text-terracotta">
                      ${((newRepCount || subscription.repCount) * (subscription.billingCycle === 'annual' ? PRICE_PER_REP.annual : PRICE_PER_REP.monthly)).toLocaleString()}/{subscription.billingCycle === 'annual' ? 'year' : 'month'}
                    </p>
                  </div>
                </div>
                {newRepCount && newRepCount !== subscription.repCount && (
                  <button
                    onClick={handleUpdatePlan}
                    disabled={updatingPlan}
                    className="mt-4 w-full bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {updatingPlan ? 'Updating...' : newRepCount > subscription.repCount ? `Upgrade to ${newRepCount} Reps` : `Downgrade to ${newRepCount} Reps`}
                  </button>
                )}
              </div>

              {/* Billing Period */}
              {subscription.currentPeriodEnd && (
                <div className="p-4 bg-bone rounded-lg border border-bone-dark">
                  <p className="text-sm text-stone-light">
                    {subscription.cancelAtPeriodEnd ? 'Access until' : 'Next billing date'}
                  </p>
                  <p className="font-semibold text-espresso">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {subscription.cancelAtPeriodEnd && (
                    <p className="text-xs text-terracotta mt-1">Your subscription will not renew</p>
                  )}
                </div>
              )}

              {/* Past Due Warning */}
              {isPastDue && (
                <div className="p-4 bg-pink/10 border border-pink/30 rounded-lg">
                  <p className="text-terracotta font-semibold">Payment Failed</p>
                  <p className="text-sm text-pink/80 mt-1">
                    Please update your payment method to continue using all features.
                  </p>
                </div>
              )}

              {/* Manage Subscription Button */}
              {subscription.stripeCustomerId && (
                <button
                  onClick={async () => {
                    setBillingLoading(true)
                    try {
                      const response = await fetch('/api/stripe/create-portal-session', {
                        method: 'POST',
                      })
                      const data = await response.json()
                      if (data.url) {
                        window.location.href = data.url
                      } else {
                        toast.error(data.error || 'Failed to open billing portal')
                      }
                    } catch {
                      toast.error('Failed to open billing portal')
                    } finally {
                      setBillingLoading(false)
                    }
                  }}
                  disabled={billingLoading}
                  className="w-full bg-terracotta/10 border border-terracotta/30 text-terracotta font-semibold py-3 px-4 rounded-lg hover:bg-terracotta/20 transition-colors disabled:opacity-50"
                >
                  {billingLoading ? 'Opening...' : 'Manage Subscription'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-stone-light mb-4">No active subscription</p>
              <button
                onClick={async () => {
                  setBillingLoading(true)
                  try {
                    const response = await fetch('/api/stripe/create-checkout-session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ repCount: 1, billingCycle: 'monthly' }),
                    })
                    const data = await response.json()
                    if (data.url) {
                      window.location.href = data.url
                    } else {
                      toast.error(data.error || 'Failed to start checkout')
                    }
                  } catch {
                    toast.error('Failed to start checkout')
                  } finally {
                    setBillingLoading(false)
                  }
                }}
                disabled={billingLoading}
                className="bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-3 px-6 rounded-lg hover:shadow-glow-teal transition-all disabled:opacity-50"
              >
                {billingLoading ? 'Loading...' : 'Subscribe Now'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link href="/integrations" className="block text-terracotta text-sm hover:text-terracotta-bright">Manage Integrations (HubSpot, Fathom, Aircall)</Link>
            <Link href="/team" className="block text-terracotta text-sm hover:text-terracotta-bright">Manage Team Members</Link>
            <Link href="/planning" className="block text-terracotta text-sm hover:text-terracotta-bright">Planning & Benchmarks</Link>
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Methodology</h2>
          <div className="flex items-center gap-3 p-3 bg-terracotta/10 border border-terracotta/20 rounded-lg">
            <div className="w-10 h-10 bg-terracotta/20 rounded-full flex items-center justify-center text-terracotta font-bold">S</div>
            <div>
              <p className="font-semibold text-espresso text-sm">Sandler Selling System</p>
              <p className="text-xs text-stone-light">Active methodology for all coaching analysis</p>
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-3 px-8 rounded-lg hover:shadow-glow-teal transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-pink/20 p-6">
          <h2 className="text-lg font-bold text-terracotta mb-2">Danger Zone</h2>
          <p className="text-stone-light text-sm mb-4">These actions are irreversible.</p>
          <button className="text-sm text-terracotta border border-pink/30 bg-pink/5 px-4 py-2 rounded-lg hover:bg-pink/10 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
