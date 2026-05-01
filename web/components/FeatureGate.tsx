'use client'

import { useSubscription } from '@/lib/hooks/useSubscription'
import Link from 'next/link'

interface FeatureGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireActive?: boolean // Requires active (non-trial) subscription
}

export function FeatureGate({
  children,
  fallback,
  requireActive = false,
}: FeatureGateProps) {
  const { subscription, loading, isActive, isTrialing, isPastDue, isCanceled } = useSubscription()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Allow access for active subscriptions
  if (isActive) {
    return <>{children}</>
  }

  // Allow access during trial if not requiring active subscription
  if (isTrialing && !requireActive) {
    return <>{children}</>
  }

  // Show fallback or default upgrade prompt
  if (fallback) {
    return <>{fallback}</>
  }

  return <UpgradePrompt isPastDue={isPastDue} isCanceled={isCanceled} />
}

function UpgradePrompt({
  isPastDue,
  isCanceled,
}: {
  isPastDue: boolean
  isCanceled: boolean
}) {
  return (
    <div className="bg-navy-light rounded-2xl border border-teal/20 p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-teal"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-light mb-2">
        {isPastDue
          ? 'Payment Required'
          : isCanceled
          ? 'Subscription Ended'
          : 'Upgrade Required'}
      </h3>

      <p className="text-light-muted text-sm mb-6">
        {isPastDue
          ? 'Your payment failed. Please update your payment method to continue.'
          : isCanceled
          ? 'Your subscription has ended. Resubscribe to access this feature.'
          : 'Subscribe to access this feature and start coaching your team.'}
      </p>

      <Link
        href="/settings#billing"
        className="inline-block bg-gradient-to-r from-teal to-aqua text-navy font-bold py-3 px-6 rounded-lg hover:shadow-glow-teal transition-all"
      >
        {isPastDue ? 'Update Payment' : 'View Plans'}
      </Link>
    </div>
  )
}

// Hook to check subscription status directly
export function useFeatureAccess() {
  const { isActive, isTrialing, isPastDue, isCanceled, subscription, loading } =
    useSubscription()

  const hasAccess = isActive || isTrialing
  const needsPayment = isPastDue
  const isExpired = isCanceled

  return {
    hasAccess,
    needsPayment,
    isExpired,
    subscription,
    loading,
  }
}
