import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AppShell from './components/AppShell'
import BrandProvider from './components/BrandProvider'
import SubscriptionBanner from './components/SubscriptionBanner'
import BillingAccessGate from './components/BillingAccessGate'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let userData: any = null

  const { data } = await supabase
    .from('Users')
    .select('role, full_name, account_id')
    .eq('auth_id', user.id)
    .single()

  userData = data

  if (!userData) {
    const { data: repairResult, error: repairError } = await supabase
      .rpc('ensure_user_has_account')

    if (!repairError && repairResult?.created) {
      const { data: repairedUser } = await supabase
        .from('Users')
        .select('role, full_name, account_id')
        .eq('auth_id', user.id)
        .single()

      if (repairedUser) {
        userData = repairedUser
      }
    }
  }

  let subscriptionStatus = 'incomplete'
  let trialEndsAt: string | null = null
  let billingGraceEndsAt: string | null = null

  if (userData?.account_id) {
    // Read subscription state with the service role. The Accounts table in
    // this project lacks the RLS policy that lets the session user read their
    // own row, so a session-keyed read returns null and the app wrongly shows
    // "Subscription inactive". Server-side billing status is authoritative.
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data: account } = await serviceClient
      .from('Accounts')
      .select('subscription_status, trial_ends_at, billing_grace_ends_at')
      .eq('id', userData.account_id)
      .single()

    if (account) {
      subscriptionStatus = account.subscription_status || 'trialing'
      trialEndsAt = account.trial_ends_at
      billingGraceEndsAt = account.billing_grace_ends_at
    }
  }

  const userRole = userData?.role || 'rep'

  return (
    <BrandProvider>
      <div className="min-h-screen bg-gradient-to-br from-bone-light via-white to-bone flex">
        <AppShell user={user} userRole={userRole}>
          <SubscriptionBanner
            status={subscriptionStatus}
            trialEndsAt={trialEndsAt}
            billingGraceEndsAt={billingGraceEndsAt}
            userRole={userRole}
          />
          <main className="flex-1 p-6 overflow-auto">
            <BillingAccessGate
              status={subscriptionStatus}
              trialEndsAt={trialEndsAt}
              billingGraceEndsAt={billingGraceEndsAt}
            >
              {children}
            </BillingAccessGate>
          </main>
        </AppShell>
      </div>
    </BrandProvider>
  )
}
