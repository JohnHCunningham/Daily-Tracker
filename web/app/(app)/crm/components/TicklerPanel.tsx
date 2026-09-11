'use client'

import { useMemo } from 'react'
import { HiClock, HiStar, HiChevronRight, HiArrowRight } from 'react-icons/hi'
import type { CRMLead } from '../page'
import { type StageKey } from '@/lib/crm/stages'
import { prioritySortLeads, daysOverdue } from '@/lib/crm/lead-priority'

interface TicklerPanelProps {
  leads: CRMLead[]
  onLeadClick: (lead: CRMLead) => void
  onSelectStage: (stage: StageKey) => void
}

// Actionable stages, in pipeline order. Call is excluded (scheduled, no follow-up).
const ACTIONABLE_STAGES: StageKey[] = [
  'pending',
  'request_sent',
  'observability',
  'mirror',
  'free_analysis',
  'breakup',
]

// Action label shown per stage (what John actually does at this stage).
const STAGE_ACTION_LABELS: Record<string, string> = {
  pending: 'Send Connection',
  request_sent: 'Check Acceptance',
  observability: 'Send Research Link',
  mirror: 'Send Mirror',
  free_analysis: 'Send Analysis',
  breakup: 'Send Breakup',
}

// Max leads to surface per stage in the tickler; the rest live in the stage tab.
const BATCH_PER_STAGE = 20

export default function TicklerPanel({ leads, onLeadClick, onSelectStage }: TicklerPanelProps) {
  // Group + prioritize + cap leads per actionable stage.
  const stageBatches = useMemo(() => {
    const result: Record<string, { total: number; overdue: CRMLead[]; upcoming: CRMLead[] }> = {}
    for (const stage of ACTIONABLE_STAGES) {
      const stageLeads = leads.filter((l) => l.status === stage)
      if (stageLeads.length === 0) continue
      const sorted = [...stageLeads].sort(prioritySortLeads)
      const overdue = sorted.filter((l) => daysOverdue(l, stage) >= 0).slice(0, BATCH_PER_STAGE)
      const upcoming = sorted.filter((l) => daysOverdue(l, stage) < 0).slice(0, BATCH_PER_STAGE)
      result[stage] = { total: stageLeads.length, overdue, upcoming }
    }
    return result
  }, [leads])

  const hasWork = Object.keys(stageBatches).length > 0

  if (!hasWork) {
    return (
      <div className="bg-white border border-bone-dark rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 text-espresso">
          <HiClock className="text-lg" />
          <span className="font-medium">All caught up!</span>
          <span className="text-sm text-stone-light">No prospects waiting in the pipeline.</span>
        </div>
      </div>
    )
  }

  const renderPill = (lead: CRMLead, overdueDays?: number) => (
    <button
      key={lead.id}
      onClick={() => onLeadClick(lead)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bone border border-bone-dark rounded-lg hover:border-terracotta hover:shadow-sm transition-all text-left group"
    >
      {lead.classification === 'V-A' && (
        <span className="text-xs font-bold text-teal bg-teal/10 px-1 rounded">V-A</span>
      )}
      {lead.profile_signal === 'ONE_STAR' && <HiStar className="text-gold text-sm" />}
      <span className="text-sm font-medium text-espresso group-hover:text-terracotta">
        {lead.first_name} {lead.last_name?.charAt(0)}.
      </span>
      {overdueDays != null && overdueDays >= 0 && (
        <span className="text-xs font-bold text-terracotta-dark">+{overdueDays}d</span>
      )}
      <HiChevronRight className="text-stone-light text-sm opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )

  return (
    <div className="bg-white border border-bone-dark rounded-xl mb-4 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-bone-light/60 border-b border-bone-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiClock className="text-terracotta text-lg" />
          <h3 className="font-semibold text-espresso">Next Up</h3>
          <span className="text-xs text-stone-light">Prioritized V-A → ONE_STAR</span>
        </div>
      </div>

      {/* Per-stage groups */}
      <div className="divide-y divide-bone-dark">
        {ACTIONABLE_STAGES.map((stage) => {
          const group = stageBatches[stage]
          if (!group) return null

          return (
            <div key={stage} className="p-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-espresso uppercase tracking-wide">
                    {STAGE_ACTION_LABELS[stage] || stage}
                  </span>
                  {group.overdue.length > 0 && (
                    <span className="text-xs font-semibold text-terracotta-dark">
                      {group.overdue.length} overdue
                    </span>
                  )}
                  <span className="text-xs text-stone-light">({group.total})</span>
                </div>
                <button
                  onClick={() => onSelectStage(stage)}
                  className="flex items-center gap-1 text-xs text-terracotta hover:text-terracotta-bright transition-colors flex-shrink-0"
                >
                  View all
                  <HiArrowRight className="text-sm" />
                </button>
              </div>

              {group.overdue.length > 0 && (
                <div className="mb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-terracotta-dark mb-1.5">
                    Overdue
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.overdue.map((lead) => renderPill(lead, daysOverdue(lead, stage)))}
                  </div>
                </div>
              )}

              {group.upcoming.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-light mb-1.5">
                    Upcoming
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.upcoming.map((lead) => renderPill(lead))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Research link helper */}
      {stageBatches.observability && (
        <div className="px-4 py-2 bg-terracotta/10 border-t border-bone-dark">
          <a
            href="https://www.oneclickcoaching.com/research.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-terracotta hover:text-terracotta-bright flex items-center gap-1"
          >
            Research page (6-question test) →
          </a>
        </div>
      )}
    </div>
  )
}
