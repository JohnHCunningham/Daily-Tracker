import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import BrandProvider from './components/BrandProvider'
import SubscriptionBanner from './components/SubscriptionBanner'

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

  let { data: userData } = await supabase
    .from('Users')
    .select('role, full_name, account_id')
    .eq('auth_id', user.id)
    .single()

  if (!userData) {
    // Auto-repair: user signed up but account creation failed
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

  // Get subscription status for banner
  let subscriptionStatus = 'trialing'
  let trialEndsAt: string | null = null

  if (userData?.account_id) {
    const { data: account } = await supabase
      .from('Accounts')
      .select('subscription_status, trial_ends_at')
      .eq('id', userData.account_id)
      .single()

    if (account) {
      subscriptionStatus = account.subscription_status || 'trialing'
      trialEndsAt = account.trial_ends_at
    }
  }

  const userRole = userData?.role || 'rep'

  return (
    <BrandProvider>
      <div className="min-h-screen bg-bone-light flex">
        <Sidebar userRole={userRole} />
        <div className="flex-1 flex flex-col min-h-screen">
          <TopBar user={user} userRole={userRole} />
          <SubscriptionBanner
            status={subscriptionStatus}
            trialEndsAt={trialEndsAt}
            userRole={userRole}
          />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </BrandProvider>
  )
}
