import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import BrandProvider from './components/BrandProvider'

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

  const userRole = userData?.role || 'rep'

  return (
    <BrandProvider>
      <div className="min-h-screen bg-navy flex">
        <Sidebar userRole={userRole} />
        <div className="flex-1 flex flex-col min-h-screen">
          <TopBar user={user} userRole={userRole} />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </BrandProvider>
  )
}
