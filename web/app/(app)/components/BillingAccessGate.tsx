'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface BillingAccessGateProps {
  status: string
  trialEndsAt: string | null
  billingGraceEndsAt: string | null
  children: React.ReactNode
}

function daysRemaining(endsAt: string | null) {
  if (!endsAt) return null
  const diffTime = new Date(endsAt).getTime() - Date.now()
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(days, 0)
}

export default function BillingAccessGate({
  status,
  trialEndsAt,
  billingGraceEndsAt,
  children,
}: BillingAccessGateProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const currentTrialDays = daysRemaining(trialEndsAt)
  const currentGraceDays = daysRemaining(billingGraceEndsAt)
  const isGraceActive =
    status === 'past_due' &&
    !!billingGraceEndsAt &&
    new Date(billingGraceEndsAt).getTime() > Date.now()

  const hasAccess =
    status === 'active' ||
    (status === 'trialing' && (currentTrialDays === null || currentTrialDays > 0)) ||
    (isGraceActive && (currentGraceDays === null || currentGraceDays > 0))

  if (hasAccess || pathname.startsWith('/settings') || pathname.startsWith('/crm')) {
    return <>{children}</>
  }

  const isTrialExpired = status === 'trialing' && currentTrialDays === 0
  const isGraceExpired = status === 'past_due' && !isGraceActive

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-xl rounded-2xl border border-bone-dark bg-white shadow-sm p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-terracotta mb-3">
          Billing required
        </p>
        <h1 className="text-2xl font-bold text-espresso mb-2">
          {isTrialExpired
            ? 'Your trial ended'
            : isGraceExpired
              ? 'Billing grace ended'
              : 'Subscription inactive'}
        </h1>
        <p className="text-stone-light mb-6">
          {isTrialExpired
            ? 'Renew your subscription to get back into the app.'
            : isGraceExpired
              ? 'Your billing grace period has ended. Update billing to restore access.'
              : status === 'past_due'
                ? 'Payment failed, but your account is still within the grace window.'
                : 'Activate your subscription to access the product.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/settings#billing"
            className="inline-flex items-center justify-center rounded-lg bg-terracotta px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-bright transition-colors"
          >
            Go to Billing
          </Link>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="inline-flex items-center justify-center rounded-lg border border-bone-dark px-4 py-2.5 text-sm font-semibold text-espresso hover:bg-bone-light transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
