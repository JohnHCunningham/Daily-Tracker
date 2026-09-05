'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { CRMLead, PipelineStage } from '../page'
import LeadCard from './LeadCard'

interface KanbanColumnProps {
  stage: PipelineStage
  leads: CRMLead[]
  onCardClick?: (lead: CRMLead) => void
}

export default function KanbanColumn({ stage, leads, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.stage_key,
  })

  // Count V-A and ONE_STAR leads
  const vaCount = leads.filter((l) => l.classification === 'V-A').length
  const oneStarCount = leads.filter((l) => l.profile_signal === 'ONE_STAR').length

  // Sort leads: V-A first, then ONE_STAR, then by last contact (most recent first)
  const sortedLeads = [...leads].sort((a, b) => {
    // V-A comes first
    if (a.classification === 'V-A' && b.classification !== 'V-A') return -1
    if (a.classification !== 'V-A' && b.classification === 'V-A') return 1

    // ONE_STAR comes next
    if (a.profile_signal === 'ONE_STAR' && b.profile_signal !== 'ONE_STAR') return -1
    if (a.profile_signal !== 'ONE_STAR' && b.profile_signal === 'ONE_STAR') return 1

    // Then by last contact (most recent first)
    const aDate = a.last_contact_at ? new Date(a.last_contact_at).getTime() : 0
    const bDate = b.last_contact_at ? new Date(b.last_contact_at).getTime() : 0
    return bDate - aDate
  })

  // Identify stale leads (no contact in 21+ days or no contact at all with old created_at)
  const now = Date.now()
  const staleDays = 21
  const staleThreshold = now - staleDays * 24 * 60 * 60 * 1000

  const isFresh = (lead: CRMLead) => {
    // If has recent contact, it's fresh
    if (lead.last_contact_at) {
      return new Date(lead.last_contact_at).getTime() > staleThreshold
    }
    // If recently created, it's fresh
    if (lead.created_at) {
      return new Date(lead.created_at).getTime() > staleThreshold
    }
    return false
  }

  const freshLeads = sortedLeads.filter(isFresh)
  const staleLeads = sortedLeads.filter((l) => !isFresh(l))

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex-shrink-0 bg-bone-light/50 rounded-xl border transition-all ${
        isOver ? 'border-terracotta bg-terracotta/5' : 'border-bone-dark'
      }`}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-bone-dark"
        style={{ borderTopColor: stage.color, borderTopWidth: '3px', borderTopStyle: 'solid' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-espresso">{stage.stage_label}</h3>
          <span className="text-xs font-medium text-stone-light bg-white px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
        {(vaCount > 0 || oneStarCount > 0) && (
          <div className="flex gap-2 mt-1">
            {vaCount > 0 && (
              <span className="text-xs text-teal font-medium">
                {vaCount} V-A
              </span>
            )}
            {oneStarCount > 0 && (
              <span className="text-xs text-gold font-medium">
                {oneStarCount} ONE_STAR
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        <SortableContext items={sortedLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {/* Fresh leads */}
          {freshLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onCardClick={onCardClick} />
          ))}

          {/* Stale divider */}
          {freshLeads.length > 0 && staleLeads.length > 0 && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 border-t border-dashed border-stone-light/50"></div>
              <span className="text-xs text-stone-light">older</span>
              <div className="flex-1 border-t border-dashed border-stone-light/50"></div>
            </div>
          )}

          {/* Stale leads */}
          {staleLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} isStale onCardClick={onCardClick} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="text-center py-8 text-stone-light text-sm">
            No leads in this stage
          </div>
        )}
      </div>
    </div>
  )
}
