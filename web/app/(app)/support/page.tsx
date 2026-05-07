import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SupportOwnershipTransfer from './support-ownership-transfer'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentUser } = await supabase
    .from('Users')
    .select('role, full_name, email')
    .eq('auth_id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-bone-dark bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-espresso">Support Access</h1>
        <p className="mt-2 text-sm text-stone-light">
          This area is reserved for admin support operations.
        </p>
      </div>
    )
  }

  return <SupportOwnershipTransfer />
}
