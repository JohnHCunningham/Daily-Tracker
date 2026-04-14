'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HiHome,
  HiUserGroup,
  HiPhone,
  HiAcademicCap,
  HiPuzzle,
  HiChartBar,
  HiCog,
  HiSparkles,
  HiClipboardList,
} from 'react-icons/hi'
import { useBrand } from './BrandProvider'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: HiHome },
  { href: '/team', label: 'Team', icon: HiUserGroup, roles: ['admin', 'manager', 'coach'] },
  { href: '/calls', label: 'Calls', icon: HiPhone },
  { href: '/coaching', label: 'Coaching', icon: HiAcademicCap },
  { href: '/planning', label: 'Planning', icon: HiClipboardList, roles: ['admin', 'manager', 'coach'] },
  { href: '/goals', label: 'Goals', icon: HiChartBar },
  { href: '/celebrations', label: 'Wins', icon: HiSparkles },
  { href: '/integrations', label: 'Integrations', icon: HiPuzzle, roles: ['admin', 'manager'] },
  { href: '/settings', label: 'Settings', icon: HiCog, roles: ['admin'] },
]

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const brand = useBrand()

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <aside className="w-60 bg-navy-dark border-r border-navy-light flex flex-col">
      <div className="p-5 border-b border-navy-light">
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt={brand.companyName} className="h-8 object-contain" />
        ) : (
          <Link href="/dashboard" className="font-bold text-lg text-light">
            {brand.companyName === 'One Click Coaching' ? (
              <>One Click<span className="text-teal"> Coaching</span></>
            ) : (
              <span>{brand.companyName}</span>
            )}
          </Link>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal/10 text-teal'
                  : 'text-light-muted hover:text-light hover:bg-navy-light'
              }`}
            >
              <Icon className="text-lg flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-navy-light">
        <p className="text-xs text-light-muted text-center">{brand.companyName}</p>
      </div>
    </aside>
  )
}
