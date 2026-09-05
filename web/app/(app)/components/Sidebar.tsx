'use client'

import Image from 'next/image'
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
  HiChatAlt2,
  HiLightningBolt,
  HiX,
  HiBriefcase,
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
  { href: '/copilot', label: 'Call Prep', icon: HiLightningBolt },
  { href: '/notes', label: '1-on-1 Notes', icon: HiChatAlt2 },
  { href: '/goals', label: 'Goals & Targets', icon: HiChartBar },
  { href: '/celebrations', label: 'Wins', icon: HiSparkles },
  { href: '/crm', label: 'Outreach CRM', icon: HiBriefcase, roles: ['admin', 'manager'] },
  { href: '/integrations', label: 'Integrations', icon: HiPuzzle, roles: ['admin', 'manager'] },
  { href: '/settings', label: 'Settings', icon: HiCog, roles: ['admin'] },
]

interface SidebarProps {
  userRole: string
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ userRole, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const brand = useBrand()

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (onClose) {
      onClose()
    }
  }

  return (
    <aside
      className={`
        w-60 bg-gradient-to-b from-bone-light to-bone border-r border-bone-dark flex flex-col
        fixed lg:relative top-0 left-0 h-full z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="p-5 border-b border-clay/20 flex items-center justify-between">
        <div className="flex-1">
          {brand.logoUrl ? (
            <Image
              src={brand.logoUrl}
              alt={brand.companyName}
              width={160}
              height={32}
              unoptimized
              className="h-8 w-auto object-contain"
            />
          ) : (
            <Link href="/dashboard" className="font-bold text-lg text-espresso" onClick={handleLinkClick}>
              {brand.companyName === 'One Click Coaching' ? (
                <>One Click<span className="text-terracotta"> Coaching</span></>
              ) : (
                <span>{brand.companyName}</span>
              )}
            </Link>
          )}
        </div>
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-bone-dark/20 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <HiX className="text-xl text-stone" />
          </button>
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
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-terracotta/10 text-terracotta border-l-4 border-terracotta ml-[-12px] pl-[8px]'
                  : 'text-stone hover:text-espresso hover:bg-terracotta/5'
              }`}
            >
              <Icon className="text-lg flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-clay/20">
        <p className="text-xs text-stone-light text-center">{brand.companyName}</p>
      </div>
    </aside>
  )
}
