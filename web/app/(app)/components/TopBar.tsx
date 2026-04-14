'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const roleBadgeColor: Record<string, string> = {
  admin: 'bg-gold/20 text-gold border-gold/30',
  manager: 'bg-teal/20 text-teal border-teal/30',
  coach: 'bg-aqua/20 text-aqua border-aqua/30',
  rep: 'bg-navy-light text-light-muted border-navy-light',
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
    <header className="h-16 bg-navy-dark border-b border-navy-light flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${roleBadgeColor[userRole] || roleBadgeColor.rep}`}>
          {userRole.toUpperCase()}
        </span>
        <div className="text-right">
          <p className="text-sm font-medium text-light">{displayName}</p>
          <p className="text-xs text-light-muted">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-light-muted hover:text-pink transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
