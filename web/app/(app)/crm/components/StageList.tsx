'use client'

import Link from 'next/link'
import { HiStar, HiEye, HiClock, HiChevronRight } from 'react-icons/hi'
import type { CRMLead } from '../page'
import { STAGE_FOLLOW_UP_DAYS, type StageKey } from '@/lib/crm/stages'

interface StageListProps {
  stage: StageKey
  leads: CRMLead[]
  onOpenLead: (lead: CRMLead) => void
}

const categoryColors: Record<string, string> = {
  VP: 'bg-teal/10 text-teal',
  Enablement: 'bg-terracotta/10 text-terracotta',
  Manager: 'bg-clay/30 text-espresso',
  'Sandler Franchisee': 'bg-gold/20 text-espresso',
  'Sandler User': 'bg-aqua/20 text-espresso',
  'Sales Trainers': 'bg-pink/20 text-espresso',
  Other: 'bg-stone-light/20 text-stone',
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'No contact'
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

function daysOverdue(lead: CRMLead, stage: StageKey): number {
  const followUpDays = STAGE_FOLLOW_UP_DAYS[stage]
  if (followUpDays == null || followUpDays < 0) return -1

  // "Overdue" only applies once a lead has actually been contacted.
  // Leads with no contact yet (e.g. pending backlog) are not overdue.
  if (!lead.last_contact_at) return -1

  const diffDays = Math.floor(
    (Date.now() - new Date(lead.last_contact_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  return diffDays - followUpDays
}

export default function StageList({ stage, leads, onOpenLead }: StageListProps) {
  // Priority sort: V-A first, then ONE_STAR, then most overdue, then last contact desc.
  const sorted = [...leads].sort((a, b) => {
    if (a.classification === 'V-A' && b.classification !== 'V-A') return -1
    if (a.classification !== 'V-A' && b.classification === 'V-A') return 1

    if (a.profile_signal === 'ONE_STAR' && b.profile_signal !== 'ONE_STAR') return -1
    if (a.profile_signal !== 'ONE_STAR' && b.profile_signal === 'ONE_STAR') return 1

    const aOver = daysOverdue(a, stage)
    const bOver = daysOverdue(b, stage)
    if (aOver !== bOver) return bOver - aOver

    const aDate = a.last_contact_at ? new Date(a.last_contact_at).getTime() : 0
    const bDate = b.last_contact_at ? new Date(b.last_contact_at).getTime() : 0
    return bDate - aDate
  })

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-stone-light text-sm">
        No leads in this stage
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((lead) => {
        const overdue = daysOverdue(lead, stage)
        return (
          <div
            key={lead.id}
            onClick={() => onOpenLead(lead)}
            className="group bg-white border border-bone-dark rounded-xl px-4 py-3 cursor-pointer transition-all hover:border-terracotta/40 hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              {/* Name + title + company */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/crm/${lead.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-espresso hover:text-terracotta transition-colors truncate"
                  >
                    {lead.first_name} {lead.last_name}
                  </Link>
                  {lead.classification === 'V-A' && (
                    <span className="text-xs font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded flex-shrink-0">
                      V-A
                    </span>
                  )}
                  {lead.profile_signal === 'ONE_STAR' && (
                    <HiStar className="text-gold flex-shrink-0" title="ONE_STAR - Profile Viewer" />
                  )}
                  {lead.profile_signal === 'VIEWED' && (
                    <HiEye className="text-stone-light flex-shrink-0" title="VIEWED" />
                  )}
                </div>
                <p className="text-sm text-stone truncate mt-0.5">
                  {lead.title && <span>{lead.title}</span>}
                  {lead.title && lead.company && <span className="text-stone-light"> · </span>}
                  {lead.company && <span>{lead.company}</span>}
                </p>
              </div>

              {/* Category */}
              {lead.category && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline ${
                    categoryColors[lead.category] || categoryColors.Other
                  }`}
                >
                  {lead.category}
                </span>
              )}

              {/* Next step / last contact */}
              <div className="text-right flex-shrink-0 w-28 hidden md:block">
                {lead.next_step ? (
                  <p className="text-sm text-terracotta font-medium truncate">{lead.next_step}</p>
                ) : (
                  <p className="text-sm text-stone-light">{formatRelativeDate(lead.last_contact_at)}</p>
                )}
                {overdue > 0 && (
                  <p className="text-xs text-red-600 font-medium">+{overdue}d overdue</p>
                )}
              </div>

              {/* Chevron */}
              <HiChevronRight className="text-stone-light group-hover:text-terracotta transition-colors flex-shrink-0" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
