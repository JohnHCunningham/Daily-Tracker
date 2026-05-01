'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const roleBadgeColor: Record<string, string> = {
  admin: 'bg-clay/20 text-clay-dark border-clay/30',
  manager: 'bg-terracotta/20 text-terracotta-dark border-terracotta/30',
  coach: 'bg-terracotta-bright/20 text-terracotta border-terracotta-bright/30',
  rep: 'bg-bone text-stone border-bone-dark',
}

export default function TopBar({ user, userRole }: { user: User; userRole: string }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = user.user_metadata?.full_name || user.email

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-clay/20 flex items-center justify-between px-6 shadow-sm">
      <div />
      <div className="flex items-center gap-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${roleBadgeColor[userRole] || roleBadgeColor.rep}`}>
          {userRole.toUpperCase()}
        </span>
        <div className="text-right">
          <p className="text-sm font-medium text-espresso">{displayName}</p>
          <p className="text-xs text-stone-light">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-stone hover:text-terracotta transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
