'use client'

import Link from 'next/link'

interface SubscriptionBannerProps {
  status: string
  trialEndsAt: string | null
  billingGraceEndsAt: string | null
  userRole: string
}

function daysRemaining(endsAt: string | null) {
  if (!endsAt) return null
  const diffTime = new Date(endsAt).getTime() - Date.now()
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(days, 0)
}

export default function SubscriptionBanner({
  status,
  trialEndsAt,
  billingGraceEndsAt,
  userRole,
}: SubscriptionBannerProps) {
  // Only show banners for leaders
  if (!['admin', 'manager'].includes(userRole)) {
    return null
  }

  // Calculate days left in trial
  const daysLeft = status === 'trialing' ? daysRemaining(trialEndsAt) : null
  const graceDaysLeft = status === 'past_due' ? daysRemaining(billingGraceEndsAt) : null
  const isGraceActive =
    status === 'past_due' &&
    !!billingGraceEndsAt &&
    new Date(billingGraceEndsAt).getTime() > Date.now()

  // Trial ending soon (7 days or less)
  if (status === 'trialing' && daysLeft !== null && daysLeft <= 7) {
    return (
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-yellow-500 text-sm font-medium">
              {daysLeft === 0
                ? 'Your trial ends today!'
                : daysLeft === 1
                ? 'Your trial ends tomorrow!'
                : `Your trial ends in ${daysLeft} days`}
            </span>
          </div>
          <Link
            href="/settings#billing"
            className="bg-yellow-500 text-espresso text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Subscribe Now
          </Link>
        </div>
      </div>
    )
  }

  // Past due payment
  if (status === 'past_due') {
    return (
      <div className={`${isGraceActive ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'} border-b px-6 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className={`w-5 h-5 ${isGraceActive ? 'text-yellow-500' : 'text-red-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className={`${isGraceActive ? 'text-yellow-500' : 'text-red-500'} text-sm font-medium`}>
              {isGraceActive
                ? graceDaysLeft === 0
                  ? 'Payment failed. Your grace period ends today.'
                  : `Payment failed. You have ${graceDaysLeft} day${graceDaysLeft === 1 ? '' : 's'} left to update billing.`
                : 'Payment failed. Your grace period has ended. Update your payment method to restore access.'}
            </span>
          </div>
          <Link
            href="/settings#billing"
            className={`${isGraceActive ? 'bg-yellow-500 hover:bg-yellow-400 text-espresso' : 'bg-red-500 hover:bg-red-400 text-white'} text-sm font-bold px-4 py-1.5 rounded-lg transition-colors`}
          >
            Update Payment
          </Link>
        </div>
      </div>
    )
  }

  // Canceled subscription
  if (status === 'canceled') {
    return (
      <div className="bg-gray-500/10 border-b border-gray-500/20 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <span className="text-gray-400 text-sm font-medium">
              Your subscription has ended. Resubscribe to access all features.
            </span>
          </div>
          <Link
            href="/settings#billing"
            className="bg-terracotta text-espresso text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-aqua transition-colors"
          >
            Resubscribe
          </Link>
        </div>
      </div>
    )
  }

  // No banner needed for active subscriptions
  return null
}
