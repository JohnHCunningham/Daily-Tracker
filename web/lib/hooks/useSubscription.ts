'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SubscriptionInfo {
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'
  billingCycle: 'monthly' | 'annual'
  repCount: number
  trialEndsAt: string | null
  billingGraceEndsAt: string | null
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
  daysLeftInGrace: number | null
  isBillingGraceActive: boolean
  refetch: () => Promise<void>
}

function getDaysRemaining(endsAt: string | null) {
  if (!endsAt) return null
  const diffTime = new Date(endsAt).getTime() - Date.now()
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(days, 0)
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchSubscription = useCallback(async () => {
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
          billing_grace_ends_at,
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
          subscriptionStatus: account.subscription_status || 'incomplete',
          billingCycle: account.billing_cycle || 'monthly',
          repCount: account.rep_count || 1,
          trialEndsAt: account.trial_ends_at,
          billingGraceEndsAt: account.billing_grace_ends_at,
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
  }, [supabase])

  useEffect(() => {
    void fetchSubscription()
  }, [fetchSubscription])

  const isActive = subscription?.subscriptionStatus === 'active'
  const isTrialing = subscription?.subscriptionStatus === 'trialing'
  const isPastDue = subscription?.subscriptionStatus === 'past_due'
  const isCanceled = subscription?.subscriptionStatus === 'canceled'

  // Calculate days left in trial
  const daysLeftInTrial = isTrialing ? getDaysRemaining(subscription?.trialEndsAt ?? null) : null
  const daysLeftInGrace = isPastDue ? getDaysRemaining(subscription?.billingGraceEndsAt ?? null) : null
  const isBillingGraceActive =
    isPastDue && !!subscription?.billingGraceEndsAt && new Date(subscription.billingGraceEndsAt).getTime() > Date.now()

  return {
    subscription,
    loading,
    error,
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    daysLeftInTrial,
    daysLeftInGrace,
    isBillingGraceActive,
    refetch: fetchSubscription,
  }
}
