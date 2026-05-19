'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { PRICE_PER_REP } from '@/lib/stripe'
import { HiDownload, HiExternalLink } from 'react-icons/hi'

interface AccountInfo {
  id: string
  name: string
  admin_designation: string | null
  logo_url: string | null
  primary_color: string | null
  accent_color: string | null
  company_name: string | null
  unique_customer_profile: string | null
  competitor_context: string | null
  email_from_name: string | null
  methodology: string | null
}

interface CurrentUser {
  account_id: string
  role: string
}

interface BillingHistoryItem {
  id: string
  number: string | null
  status: string
  currency: string
  amountPaid: number
  amountDue: number
  createdAt: string
  periodStart: string | null
  periodEnd: string | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  billingReason: string | null
  description: string | null
  paidAt: string | null
  failureReason: string | null
}

export default function SettingsPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [form, setForm] = useState({
    name: '',
    company_name: '',
    logo_url: '',
    primary_color: '#2A221C', // Espresso
    accent_color: '#B5583E', // Terracotta
    unique_customer_profile: '',
    competitor_context: '',
    email_from_name: 'One Click Coaching',
    methodology: 'sandler',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [newRepCount, setNewRepCount] = useState<number | null>(null)
  const [updatingPlan, setUpdatingPlan] = useState(false)
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false)
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([])
  const [billingHistoryLoading, setBillingHistoryLoading] = useState(false)
  const [stripeConfig, setStripeConfig] = useState<{
    configured: boolean
    hasSecretKey: boolean
    hasWebhookSecret: boolean
    hasMonthlyPrice: boolean
    hasAnnualPrice: boolean
  } | null>(null)
  const supabase = createClient()
  const {
    subscription,
    loading: subscriptionLoading,
    isActive,
    isTrialing,
    isPastDue,
    daysLeftInTrial,
    daysLeftInGrace,
    isBillingGraceActive,
    refetch,
  } = useSubscription()

  const loadSettings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) { setLoading(false); return }
    setCurrentUser(currentUser)

    const { data: accountData } = await supabase
      .from('Accounts')
      .select('id, name, admin_designation, logo_url, primary_color, accent_color, company_name, unique_customer_profile, competitor_context, email_from_name, methodology')
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
        unique_customer_profile: accountData.unique_customer_profile || '',
        competitor_context: accountData.competitor_context || '',
        email_from_name: accountData.email_from_name || 'One Click Coaching',
        methodology: accountData.methodology || 'sandler',
      })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const response = await fetch('/api/stripe/config-status')
        const data = await response.json()
        if (mounted) setStripeConfig(data)
      } catch {
        if (mounted) setStripeConfig(null)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
        return
      }

      setBillingHistoryLoading(true)
      try {
        const response = await fetch('/api/stripe/billing-history')
        const data = await response.json().catch(() => null)

        if (mounted && response.ok && data?.success) {
          setBillingHistory(data.invoices || [])
        }
      } catch {
        if (mounted) setBillingHistory([])
      } finally {
        if (mounted) setBillingHistoryLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [currentUser])

  async function handleSave() {
    if (!account) return
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      toast.error('Only admins and managers can update account settings')
      return
    }
    setSaving(true)

    const { error } = await supabase
      .from('Accounts')
      .update({
        name: form.name,
        company_name: form.company_name,
        logo_url: form.logo_url || null,
        primary_color: form.primary_color,
        accent_color: form.accent_color,
        unique_customer_profile: form.unique_customer_profile,
        competitor_context: form.competitor_context,
        email_from_name: form.email_from_name,
        methodology: form.methodology,
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

  useEffect(() => {
    if (subscription) {
      setSelectedBillingCycle(subscription.billingCycle)
    }
  }, [subscription])

  async function handleUpdatePlan() {
    if (!subscription) return
    if (newRepCount === subscription.repCount && selectedBillingCycle === subscription.billingCycle) return
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      toast.error('Only admins and managers can update billing')
      return
    }

    setUpdatingPlan(true)
    try {
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRepCount: newRepCount || subscription.repCount, billingCycle: selectedBillingCycle }),
      })
      const data = await response.json()

      if (data.url) {
        // Redirect to checkout for new subscription
        window.location.href = data.url
      } else if (data.success) {
        toast.success(`Plan updated to ${data.billingCycle === 'annual' ? 'annual' : 'monthly'} billing`)
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

  async function handleSubscriptionAction(action: 'cancel' | 'reactivate') {
    if (!subscription?.stripeSubscriptionId) {
      toast.error('No active Stripe subscription found')
      return
    }
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      toast.error('Only admins and managers can update billing')
      return
    }

    setSubscriptionActionLoading(true)
    const toastId = toast.loading(
      action === 'cancel' ? 'Setting subscription to cancel...' : 'Reactivating subscription...'
    )
    try {
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await response.json().catch(() => null)

      if (response.ok && data?.success) {
        await refetch()
        toast.success(action === 'cancel' ? 'Subscription set to cancel at period end' : 'Subscription reactivated', {
          id: toastId,
        })
      } else {
        toast.error(data?.error || 'Failed to update subscription', { id: toastId })
      }
    } catch {
      toast.error('Failed to update subscription', { id: toastId })
    } finally {
      setSubscriptionActionLoading(false)
    }
  }

  async function handleStartCheckout(repCount: number, billingCycle: 'monthly' | 'annual' = 'monthly') {
    setBillingLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repCount, billingCycle }),
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
        {currentUser && !['admin', 'manager'].includes(currentUser.role) && (
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
            <h2 className="text-lg font-bold text-espresso mb-2">Account Settings</h2>
            <p className="text-sm text-stone-light">
              Ask an admin or manager to update account settings, billing, branding, and integrations.
            </p>
          </div>
        )}

        {/* Account Settings */}
        {currentUser && ['admin', 'manager'].includes(currentUser.role) && (
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
        )}

        {/* Company Context */}
        {currentUser && ['admin', 'manager'].includes(currentUser.role) && (
        <div id="company-context" className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Company Context</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-stone-light mb-1">Unique Customer</label>
              <textarea
                value={form.unique_customer_profile}
                onChange={(e) => setForm({ ...form, unique_customer_profile: e.target.value })}
                rows={4}
                placeholder="Who do you sell to, what do they care about, and what makes them a fit?"
                className="w-full px-3 py-2 bg-bone border border-terracotta/20 rounded-lg text-espresso text-sm focus:outline-none focus:border-terracotta placeholder:text-stone-light/50"
              />
              <p className="text-xs text-stone-light mt-1">
                Describe the customer profile the coaching brain should optimize for.
              </p>
            </div>
            <div>
              <label className="block text-sm text-stone-light mb-1">Competitors</label>
              <textarea
                value={form.competitor_context}
                onChange={(e) => setForm({ ...form, competitor_context: e.target.value })}
                rows={4}
                placeholder="List 3-4 competitors and the main objection or advantage for each."
                className="w-full px-3 py-2 bg-bone border border-terracotta/20 rounded-lg text-espresso text-sm focus:outline-none focus:border-terracotta placeholder:text-stone-light/50"
              />
              <p className="text-xs text-stone-light mt-1">
                Keep it practical: who they lose to, why they win, and the objection to expect.
              </p>
            </div>
          </div>
        </div>
        )}

        {/* White-Label Branding */}
        {currentUser && ['admin', 'manager'].includes(currentUser.role) && (
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
                <Image src={form.logo_url} alt="Logo preview" width={160} height={32} className="h-8 w-auto object-contain" />
              </div>
            )}
          </div>
        </div>
        )}

        {/* Email Settings */}
        {currentUser && ['admin', 'manager'].includes(currentUser.role) && (
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
        )}

        {/* Billing Section */}
        {currentUser && ['admin', 'manager'].includes(currentUser.role) && (
        <div id="billing" className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Billing & Subscription</h2>

          {stripeConfig && !stripeConfig.configured && (
            <div className="mb-4 rounded-lg border border-pink/30 bg-pink/5 p-4">
              <p className="font-semibold text-terracotta">Stripe is not fully configured</p>
              <p className="text-sm text-stone-light mt-1">
                Missing:{' '}
                {[
                  !stripeConfig.hasSecretKey ? 'secret key' : null,
                  !stripeConfig.hasWebhookSecret ? 'webhook secret' : null,
                  !stripeConfig.hasMonthlyPrice ? 'monthly price' : null,
                  !stripeConfig.hasAnnualPrice ? 'annual price' : null,
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

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
                <p className="text-sm text-stone-light mb-3">Plan</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedBillingCycle('monthly')}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      selectedBillingCycle === 'monthly'
                        ? 'border-terracotta bg-terracotta/10 text-espresso'
                        : 'border-terracotta/20 bg-white text-stone-light hover:border-terracotta/40'
                    }`}
                  >
                    <div className="font-semibold">Monthly</div>
                    <div className="text-xs mt-1 text-stone-light">
                      ${PRICE_PER_REP.monthly} / rep / month
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBillingCycle('annual')}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      selectedBillingCycle === 'annual'
                        ? 'border-terracotta bg-terracotta/10 text-espresso'
                        : 'border-terracotta/20 bg-white text-stone-light hover:border-terracotta/40'
                    }`}
                  >
                    <div className="font-semibold">Annual</div>
                    <div className="text-xs mt-1 text-stone-light">
                      ${PRICE_PER_REP.annual} / rep / year
                    </div>
                  </button>
                </div>
                <p className="text-xs text-stone-light mb-3">
                  Annual saves ${PRICE_PER_REP.monthly * 12 - PRICE_PER_REP.annual} per rep each year.
                </p>
                <p className="text-sm text-stone-light mb-3">Adjust Rep Slots</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
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
                      type="button"
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
                    type="button"
                    onClick={handleUpdatePlan}
                    disabled={updatingPlan}
                    className="mt-4 w-full bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {updatingPlan
                      ? 'Updating...'
                      : `${newRepCount > subscription.repCount ? 'Upgrade' : 'Downgrade'} to ${newRepCount} Reps`}
                  </button>
                )}
                {newRepCount === subscription.repCount && selectedBillingCycle !== subscription.billingCycle && (
                  <button
                    type="button"
                    onClick={handleUpdatePlan}
                    disabled={updatingPlan}
                    className="mt-4 w-full bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {updatingPlan ? 'Updating...' : `Switch to ${selectedBillingCycle === 'annual' ? 'Annual' : 'Monthly'} Billing`}
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
                    {isBillingGraceActive
                      ? daysLeftInGrace !== null
                        ? `Please update your payment method within ${daysLeftInGrace} day${daysLeftInGrace === 1 ? '' : 's'} to avoid losing access.`
                        : 'Please update your payment method within the grace period to avoid losing access.'
                      : 'Your grace period has ended. Update your payment method to restore access.'}
                  </p>
                </div>
              )}

              {/* Manage Subscription Button */}
              {subscription.stripeCustomerId && (
                <div className="space-y-3">
                  <button
                    type="button"
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
                    disabled={billingLoading || !stripeConfig?.configured}
                    className="w-full bg-terracotta/10 border border-terracotta/30 text-terracotta font-semibold py-3 px-4 rounded-lg hover:bg-terracotta/20 transition-colors disabled:opacity-50"
                  >
                    {billingLoading ? 'Opening...' : 'Manage Subscription'}
                  </button>

                  {subscription.subscriptionStatus !== 'canceled' && (
                    <button
                      type="button"
                      onClick={() => void handleSubscriptionAction(subscription.cancelAtPeriodEnd ? 'reactivate' : 'cancel')}
                      disabled={subscriptionActionLoading || !stripeConfig?.configured}
                      className={`w-full font-semibold py-3 px-4 rounded-lg border transition-colors disabled:opacity-50 ${
                        subscription.cancelAtPeriodEnd
                          ? 'bg-white border-bone-dark text-espresso hover:bg-bone-light'
                          : 'bg-pink/5 border-pink/30 text-terracotta hover:bg-pink/10'
                      }`}
                    >
                      {subscriptionActionLoading
                        ? 'Updating...'
                        : subscription.cancelAtPeriodEnd
                          ? 'Reactivate Subscription'
                          : 'Cancel at Period End'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-stone-light mb-4">No active subscription</p>
                <button
                  onClick={() => void handleStartCheckout(1, 'monthly')}
                  disabled={billingLoading || !stripeConfig?.configured}
                  className="bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-3 px-6 rounded-lg hover:shadow-glow-teal transition-all disabled:opacity-50"
                >
                  {billingLoading ? 'Loading...' : 'Subscribe Now'}
                </button>
            </div>
          )}
        </div>
        )}

        {subscription && subscription.subscriptionStatus === 'canceled' && (
          <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
            <h2 className="text-lg font-bold text-espresso mb-2">Subscription Ended</h2>
            <p className="text-sm text-stone-light mb-4">
              This subscription is canceled. Start a new one to regain access.
            </p>
              <button
              onClick={() => void handleStartCheckout(subscription.repCount, selectedBillingCycle)}
              disabled={billingLoading || !stripeConfig?.configured}
              className="bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-3 px-6 rounded-lg hover:shadow-glow-teal transition-all disabled:opacity-50"
            >
              {billingLoading ? 'Loading...' : 'Reactivate Subscription'}
            </button>
          </div>
        )}

        {/* Billing History */}
        {currentUser && ['admin', 'manager'].includes(currentUser.role) && (
          <div id="billing-history" className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-espresso">Billing History</h2>
                <p className="text-xs text-stone-light">Download receipts and invoice PDFs from Stripe.</p>
              </div>
            </div>

            {billingHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
              </div>
            ) : billingHistory.length > 0 ? (
              <div className="space-y-3">
                {billingHistory.map((invoice) => (
                  <div key={invoice.id} className="rounded-xl border border-bone-dark bg-bone/40 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-espresso">
                            {invoice.number ? `Invoice #${invoice.number}` : 'Invoice'}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-teal/10 text-teal'
                              : invoice.status === 'open'
                                ? 'bg-gold/10 text-gold'
                                : invoice.status === 'void'
                                  ? 'bg-stone-light/20 text-stone-light'
                                  : 'bg-pink/10 text-pink'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                        <p className="text-sm text-stone-light">
                          {invoice.description || invoice.billingReason || 'Stripe invoice'} · {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-stone-light">
                          {invoice.amountPaid > 0
                            ? `${(invoice.amountPaid / 100).toLocaleString(undefined, { style: 'currency', currency: invoice.currency.toUpperCase() })} paid`
                            : `${(invoice.amountDue / 100).toLocaleString(undefined, { style: 'currency', currency: invoice.currency.toUpperCase() })} due`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {invoice.hostedInvoiceUrl && (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-terracotta/20 bg-white px-3 py-2 text-sm font-medium text-espresso hover:bg-terracotta/10"
                          >
                            <HiExternalLink />
                            View
                          </a>
                        )}
                        {invoice.invoicePdf && (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-3 py-2 text-sm font-medium text-white hover:bg-terracotta-bright"
                          >
                            <HiDownload />
                            PDF
                          </a>
                        )}
                      </div>
                    </div>
                    {(invoice.periodStart || invoice.periodEnd) && (
                      <p className="mt-3 text-xs text-stone-light">
                        {invoice.periodStart ? new Date(invoice.periodStart).toLocaleDateString('en-US') : 'Start'} - {invoice.periodEnd ? new Date(invoice.periodEnd).toLocaleDateString('en-US') : 'End'}
                      </p>
                    )}
                    {invoice.failureReason && (
                      <p className="mt-2 text-xs text-pink">
                        {invoice.failureReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-bone-dark bg-bone/30 p-6 text-sm text-stone-light">
                No invoices found yet. Stripe receipts will appear here after the first successful payment.
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link href="/integrations" className="block text-terracotta text-sm hover:text-terracotta-bright">Manage Integrations (HubSpot, Fathom)</Link>
            <Link href="/team" className="block text-terracotta text-sm hover:text-terracotta-bright">Manage Team Members</Link>
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-white rounded-2xl border border-bone-dark shadow-sm p-6">
          <h2 className="text-lg font-bold text-espresso mb-4">Sales Methodology</h2>
          <p className="text-sm text-stone-light mb-4">
            Select the sales methodology your team uses. This determines how coaching analysis is performed.
          </p>
          <div className="space-y-3">
            {[
              { id: 'sandler', name: 'Sandler Selling System', initial: 'S', description: 'Qualify early, control the process, focus on pain' },
              { id: 'meddic', name: 'MEDDIC', initial: 'M', description: 'Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion' },
              { id: 'meddpicc', name: 'MEDDPICC', initial: 'MP', description: 'MEDDIC plus Paper Process and Competition for enterprise deals' },
              { id: 'challenger', name: 'Challenger Sale', initial: 'C', description: 'Teach, tailor, take control of the sale' },
              { id: 'spin', name: 'SPIN Selling', initial: 'SP', description: 'Situation, Problem, Implication, Need-Payoff questions' },
              { id: 'gap', name: 'Gap Selling', initial: 'G', description: 'Problem-centric selling focused on closing the gap' },
            ].map((methodology) => (
              <button
                key={methodology.id}
                type="button"
                onClick={() => setForm({ ...form, methodology: methodology.id })}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  form.methodology === methodology.id
                    ? 'bg-terracotta/10 border-terracotta/30 shadow-sm'
                    : 'bg-white border-bone-dark hover:border-terracotta/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                  form.methodology === methodology.id
                    ? 'bg-terracotta/20 text-terracotta'
                    : 'bg-bone text-stone-light'
                }`}>
                  {methodology.initial}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-semibold text-sm ${
                    form.methodology === methodology.id ? 'text-espresso' : 'text-stone-light'
                  }`}>
                    {methodology.name}
                  </p>
                  <p className="text-xs text-stone-light">
                    {methodology.description}
                  </p>
                </div>
                {form.methodology === methodology.id && (
                  <div className="w-5 h-5 bg-terracotta rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        {currentUser && ['admin', 'manager'].includes(currentUser.role) && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-bold py-3 px-8 rounded-lg hover:shadow-glow-teal transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
        )}

        {/* Danger Zone */}
        {currentUser?.role === 'admin' && (
        <div className="bg-white rounded-2xl border border-pink/20 p-6">
          <h2 className="text-lg font-bold text-terracotta mb-2">Danger Zone</h2>
          <p className="text-stone-light text-sm mb-4">These actions are irreversible.</p>
          <button className="text-sm text-terracotta border border-pink/30 bg-pink/5 px-4 py-2 rounded-lg hover:bg-pink/10 transition-colors">
            Delete Account
          </button>
          <div className="mt-4 rounded-lg border border-bone-dark bg-bone/30 p-4">
            <p className="text-sm font-semibold text-espresso">Emergency ownership handoff</p>
            <p className="text-xs text-stone-light mt-1">
              Use the support-only transfer screen if the primary manager is unavailable.
            </p>
            <Link
              href="/support"
              className="mt-3 inline-flex rounded-lg bg-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-terracotta-bright"
            >
              Open Support Screen
            </Link>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
