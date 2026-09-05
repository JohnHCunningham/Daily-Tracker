'use client'

import { useMemo } from 'react'
import { HiClock, HiExclamation, HiStar, HiChevronRight } from 'react-icons/hi'
import type { CRMLead } from '../page'

interface TicklerPanelProps {
  leads: CRMLead[]
  onLeadClick: (lead: CRMLead) => void
}

// Days after last contact before follow-up is due
const STAGE_FOLLOW_UP_DAYS: Record<string, number> = {
  pending: 0,           // Immediate - new prospects
  request_sent: 4,      // 3-5 days, wait for acceptance
  observability: 3,     // Send 6-question test link
  free_analysis: 5,     // After they take the test
  mirror: 7,            // The nudge
  breakup: 14,          // Final send
  call: -1,             // N/A - scheduled meetings
}

const STAGE_LABELS: Record<string, string> = {
  pending: 'Send Connection',
  request_sent: 'Check Acceptance',
  observability: 'Send Research Link',
  free_analysis: 'Send Analysis',
  mirror: 'Send Mirror',
  breakup: 'Send Breakup',
}

const STAGE_ORDER = ['pending', 'request_sent', 'observability', 'free_analysis', 'mirror', 'breakup']

interface DueLead extends CRMLead {
  daysOverdue: number
  daysSinceContact: number
}

export default function TicklerPanel({ leads, onLeadClick }: TicklerPanelProps) {
  const dueLeadsByStage = useMemo(() => {
    const now = Date.now()
    const result: Record<string, DueLead[]> = {}

    for (const stage of STAGE_ORDER) {
      const followUpDays = STAGE_FOLLOW_UP_DAYS[stage]
      if (followUpDays < 0) continue // Skip stages with no follow-up

      const stageLeads = leads.filter((lead) => lead.status === stage)
      const dueLeads: DueLead[] = []

      for (const lead of stageLeads) {
        // Use last_contact_at, or created_at if no contact yet
        const referenceDate = lead.last_contact_at || lead.created_at
        if (!referenceDate) continue

        const refTime = new Date(referenceDate).getTime()
        const daysSinceContact = Math.floor((now - refTime) / (1000 * 60 * 60 * 24))
        const daysOverdue = daysSinceContact - followUpDays

        // Include if due today or overdue
        if (daysOverdue >= 0) {
          dueLeads.push({
            ...lead,
            daysOverdue,
            daysSinceContact,
          })
        }
      }

      // Sort by: V-A first, then ONE_STAR, then most overdue
      dueLeads.sort((a, b) => {
        if (a.classification === 'V-A' && b.classification !== 'V-A') return -1
        if (a.classification !== 'V-A' && b.classification === 'V-A') return 1
        if (a.profile_signal === 'ONE_STAR' && b.profile_signal !== 'ONE_STAR') return -1
        if (a.profile_signal !== 'ONE_STAR' && b.profile_signal === 'ONE_STAR') return 1
        return b.daysOverdue - a.daysOverdue
      })

      if (dueLeads.length > 0) {
        result[stage] = dueLeads
      }
    }

    return result
  }, [leads])

  const totalDue = useMemo(() => {
    return Object.values(dueLeadsByStage).reduce((sum, arr) => sum + arr.length, 0)
  }, [dueLeadsByStage])

  if (totalDue === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 text-green-700">
          <HiClock className="text-lg" />
          <span className="font-medium">All caught up!</span>
          <span className="text-sm text-green-600">No prospects due for follow-up today.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl mb-4 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-amber-100/50 border-b border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiExclamation className="text-amber-600 text-lg" />
          <h3 className="font-semibold text-amber-900">Due Today</h3>
          <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {totalDue}
          </span>
        </div>
        <span className="text-xs text-amber-700">Click to open outreach modal</span>
      </div>

      {/* Stage groups */}
      <div className="divide-y divide-amber-200">
        {STAGE_ORDER.map((stage) => {
          const stageLeads = dueLeadsByStage[stage]
          if (!stageLeads || stageLeads.length === 0) return null

          return (
            <div key={stage} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  {STAGE_LABELS[stage] || stage}
                </span>
                <span className="text-xs text-amber-600">({stageLeads.length})</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {stageLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => onLeadClick(lead)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg hover:border-terracotta hover:shadow-sm transition-all text-left group"
                  >
                    {lead.classification === 'V-A' && (
                      <span className="text-xs font-bold text-teal bg-teal/10 px-1 rounded">
                        V-A
                      </span>
                    )}
                    {lead.profile_signal === 'ONE_STAR' && (
                      <HiStar className="text-gold text-sm" />
                    )}
                    <span className="text-sm font-medium text-espresso group-hover:text-terracotta">
                      {lead.first_name} {lead.last_name?.charAt(0)}.
                    </span>
                    {lead.daysOverdue > 0 && (
                      <span className="text-xs text-red-600 font-medium">
                        +{lead.daysOverdue}d
                      </span>
                    )}
                    <HiChevronRight className="text-stone-light text-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Research link reminder */}
      {dueLeadsByStage.observability && dueLeadsByStage.observability.length > 0 && (
        <div className="px-4 py-2 bg-terracotta/10 border-t border-amber-200">
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
