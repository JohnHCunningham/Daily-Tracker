'use client'

import { useCallback, useState } from 'react'
import { HiStar, HiEye, HiChevronRight, HiClipboard, HiCheck } from 'react-icons/hi'
import toast from 'react-hot-toast'
import type { CRMLead } from '../page'
import { NEXT_STAGE, STAGE_FOLLOW_UP_DAYS, STAGE_LABELS, type StageKey } from '@/lib/crm/stages'
import {
  TEMPLATES,
  getPersonaFromLead,
  getStageFromStatus,
  linkedinSearchUrl,
  personalizeTemplate,
} from '@/lib/crm/outreach-messages'
import { fireConfetti, isMilestone, milestoneMessage } from '@/lib/crm/celebrate'
import CopyName from './CopyName'

interface StageListProps {
  stage: StageKey
  leads: CRMLead[]
  onOpenLead: (lead: CRMLead) => void
  onLeadAdvanced: (lead: CRMLead) => void
  todayMovedCount?: number
}

const categoryColors: Record<string, string> = {
  VP: 'bg-teal/10 text-teal',
  Enablement: 'bg-terracotta/10 text-terracotta',
  Manager: 'bg-clay/30 text-espresso',
  'Sandler Franchisee': 'bg-gold/20 text-espresso',
  'Sandler User': 'bg-clay/20 text-espresso',
  'Sales Trainers': 'bg-bone-dark/60 text-espresso',
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

export default function StageList({
  stage,
  leads,
  onOpenLead,
  onLeadAdvanced,
  todayMovedCount = 0,
}: StageListProps) {
  const [advancingLeadId, setAdvancingLeadId] = useState<string | null>(null)

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

  const handleCopyAndAdvance = useCallback(
    async (lead: CRMLead) => {
      if (advancingLeadId) return

      const currentStage = lead.status as StageKey
      const nextStage = NEXT_STAGE[currentStage]

      if (currentStage === nextStage) {
        toast('Breakup is the final stage')
        return
      }

      setAdvancingLeadId(lead.id)

      try {
        const messageStage = getStageFromStatus(lead.status)
        const persona = getPersonaFromLead(lead.title, lead.category)
        const currentMessage = personalizeTemplate(TEMPLATES[messageStage][persona], lead)

        await navigator.clipboard.writeText(currentMessage)

        const linkedinTarget = lead.linkedin_url || linkedinSearchUrl(lead.first_name, lead.last_name)
        window.open(linkedinTarget, '_blank')

        const response = await fetch('/api/crm/advance-stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: lead.id,
            nextStage,
            messageSent: currentMessage.substring(0, 200),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to advance stage')
        }

        const { lead: updatedLead } = await response.json()
        const newCount = todayMovedCount + 1

        if (isMilestone(newCount)) {
          fireConfetti(true)
          toast.success(milestoneMessage(newCount), { duration: 4500 })
        } else {
          fireConfetti(false)
          toast.success(`Copied! Moving to ${STAGE_LABELS[nextStage]}`)
        }

        onLeadAdvanced(updatedLead)
      } catch (error) {
        console.error('Failed to copy and advance lead:', error)
        toast.error('Failed to advance stage')
      } finally {
        setAdvancingLeadId(null)
      }
    },
    [advancingLeadId, onLeadAdvanced, todayMovedCount]
  )

  if (leads.length === 0) {
    return (
      <div className="text-center py-14 bg-white border border-bone-dark rounded-xl">
        <p className="text-sm font-medium text-espresso">No leads in {STAGE_LABELS[stage]}</p>
        <p className="text-xs text-stone-light mt-1">This stage is clear for now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((lead) => {
        const overdue = daysOverdue(lead, stage)
        const currentStage = lead.status as StageKey
        const nextStage = NEXT_STAGE[currentStage]
        const isAtFinalStage = currentStage === nextStage
        const isAdvancing = advancingLeadId === lead.id
        return (
          <div
            key={lead.id}
            onClick={() => onOpenLead(lead)}
            className="group bg-white border border-bone-dark rounded-xl px-4 py-3 cursor-pointer transition-all hover:border-terracotta/40 hover:bg-bone-light/30 hover:shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              {/* Name + title + company */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CopyName
                    firstName={lead.first_name}
                    lastName={lead.last_name}
                    className="font-semibold text-espresso hover:text-terracotta transition-colors"
                  />
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
                  <p className="text-xs text-terracotta-dark font-medium">+{overdue}d overdue</p>
                )}
              </div>

              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    void handleCopyAndAdvance(lead)
                  }}
                  disabled={isAdvancing || isAtFinalStage}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all sm:min-w-36 ${
                    isAdvancing
                      ? 'bg-stone-light text-white cursor-wait'
                      : isAtFinalStage
                        ? 'bg-bone-dark text-stone cursor-not-allowed'
                        : 'bg-terracotta text-white hover:bg-terracotta-bright hover:shadow-md'
                  }`}
                >
                  {isAdvancing ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Working
                    </>
                  ) : isAtFinalStage ? (
                    <>
                      <HiCheck className="text-base" />
                      Final Stage
                    </>
                  ) : (
                    <>
                      <HiClipboard className="text-base" />
                      Copy & Next
                    </>
                  )}
                </button>

                <HiChevronRight className="hidden sm:block text-stone-light group-hover:text-terracotta transition-colors flex-shrink-0" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
