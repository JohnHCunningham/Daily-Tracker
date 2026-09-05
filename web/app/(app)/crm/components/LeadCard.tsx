'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { HiStar, HiEye, HiClock } from 'react-icons/hi'
import type { CRMLead } from '../page'

interface LeadCardProps {
  lead: CRMLead
  isDragging?: boolean
  isStale?: boolean
  onCardClick?: (lead: CRMLead) => void
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
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

export default function LeadCard({ lead, isDragging, isStale, onCardClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isBeingDragged = isDragging || isSortableDragging

  // Handle click - only trigger if not dragging
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking the link
    if ((e.target as HTMLElement).closest('a')) return
    // Don't trigger if we're dragging
    if (isBeingDragged) return
    onCardClick?.(lead)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`
        bg-white rounded-xl border p-3 cursor-grab active:cursor-grabbing
        transition-all group
        ${isBeingDragged
          ? 'shadow-lg border-terracotta rotate-2 scale-105'
          : 'border-bone-dark hover:border-terracotta/30 hover:shadow-md'
        }
        ${isStale ? 'opacity-50 grayscale-[30%]' : ''}
      `}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <Link
          href={`/crm/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0"
        >
          <h4 className="font-semibold text-sm text-espresso truncate hover:text-terracotta transition-colors">
            {lead.first_name} {lead.last_name}
          </h4>
        </Link>

        {/* Badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {lead.classification === 'V-A' && (
            <span className="text-xs font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded">
              V-A
            </span>
          )}
          {lead.profile_signal === 'ONE_STAR' && (
            <HiStar className="text-gold text-sm" title="ONE_STAR - Profile Viewer" />
          )}
          {lead.profile_signal === 'VIEWED' && (
            <HiEye className="text-stone-light text-sm" title="VIEWED" />
          )}
        </div>
      </div>

      {/* Title */}
      {lead.title && (
        <p className="text-xs text-stone-light truncate mb-1">{lead.title}</p>
      )}

      {/* Company */}
      {lead.company && (
        <p className="text-xs text-stone truncate mb-2">{lead.company}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-bone-dark/50">
        {/* Category */}
        {lead.category && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              categoryColors[lead.category] || categoryColors.Other
            }`}
          >
            {lead.category}
          </span>
        )}

        {/* Next Step or Last Contact */}
        <div className="flex items-center gap-1 text-xs text-stone-light">
          <HiClock className="text-sm" />
          {lead.next_step ? (
            <span className="text-terracotta font-medium">{lead.next_step}</span>
          ) : (
            <span>{formatRelativeDate(lead.last_contact_at)}</span>
          )}
        </div>
      </div>

      {/* DM Variant Tag (if set) */}
      {lead.dm_variant && (
        <div className="mt-2">
          <span className="text-xs text-stone-light bg-bone px-2 py-0.5 rounded">
            {lead.dm_variant}
          </span>
        </div>
      )}
    </div>
  )
}
