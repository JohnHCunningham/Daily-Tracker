'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SubscriptionInfo {
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'
  billingCycle: 'monthly' | 'annual'
  repCount: number
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  maxTeamMembers: number
}

export interface UseSubscriptionReturn {
  subscription: SubscriptionInfo | null
  loading: boolean
  error: string | null
  isActive: boolean
  isTrialing: boolean
  isPastDue: boolean
  isCanceled: boolean
  daysLeftInTrial: number | null
  refetch: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubscription(null)
        return
      }

      const { data: userData } = await supabase
        .from('Users')
        .select('account_id')
        .eq('auth_id', user.id)
        .single()

      if (!userData?.account_id) {
        setSubscription(null)
        return
      }

      const { data: account, error: accountError } = await supabase
        .from('Accounts')
        .select(`
          subscription_status,
          billing_cycle,
          rep_count,
          trial_ends_at,
          current_period_end,
          cancel_at_period_end,
          stripe_customer_id,
          stripe_subscription_id,
          max_team_members
        `)
        .eq('id', userData.account_id)
        .single()

      if (accountError) throw accountError

      if (account) {
        setSubscription({
          subscriptionStatus: account.subscription_status || 'trialing',
          billingCycle: account.billing_cycle || 'monthly',
          repCount: account.rep_count || 1,
          trialEndsAt: account.trial_ends_at,
          currentPeriodEnd: account.current_period_end,
          cancelAtPeriodEnd: account.cancel_at_period_end || false,
          stripeCustomerId: account.stripe_customer_id,
          stripeSubscriptionId: account.stripe_subscription_id,
          maxTeamMembers: account.max_team_members || 10,
        })
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError('Failed to load subscription info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  const isActive = subscription?.subscriptionStatus === 'active'
  const isTrialing = subscription?.subscriptionStatus === 'trialing'
  const isPastDue = subscription?.subscriptionStatus === 'past_due'
  const isCanceled = subscription?.subscriptionStatus === 'canceled'

  // Calculate days left in trial
  let daysLeftInTrial: number | null = null
  if (isTrialing && subscription?.trialEndsAt) {
    const trialEnd = new Date(subscription.trialEndsAt)
    const now = new Date()
    const diffTime = trialEnd.getTime() - now.getTime()
    daysLeftInTrial = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (daysLeftInTrial < 0) daysLeftInTrial = 0
  }

  return {
    subscription,
    loading,
    error,
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    daysLeftInTrial,
    refetch: fetchSubscription,
  }
}
