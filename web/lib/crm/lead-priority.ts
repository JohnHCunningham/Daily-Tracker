// Shared "who do I work next" ordering — single source of truth for lead
// priority across the stage list, the "Next Up" tickler, and the keyboard
// shortcut's top-lead picker. Import from here everywhere; do NOT reimplement
// priority sorting in a component (three files drifted out of sync this way).

import { STAGE_FOLLOW_UP_DAYS } from './stages'

// Minimal structural shape so this module doesn't import the full CRMLead type
// from a page (which would create a circular dependency). Any lead object with
// these fields satisfies it.
export interface PrioritizableLead {
  classification: string | null
  profile_signal: string | null
  last_contact_at: string | null
  created_at: string
}

// Canonical priority order:
//   1. V-A before everything else
//   2. ONE_STAR (profile viewers) next
//   3. Never-contacted leads first (the actionable backlog)
//   4. Among never-contacted: oldest created_at first (import order = FIFO)
//   5. Among contacted: oldest last_contact_at first (most overdue)
//
// last_contact_at is the only real contact signal. created_at is a bulk-import
// timestamp and is used ONLY as a FIFO tiebreaker for the never-contacted
// backlog — never as a proxy for "when I last touched this person."
export function prioritySortLeads(a: PrioritizableLead, b: PrioritizableLead): number {
  if (a.classification === 'V-A' && b.classification !== 'V-A') return -1
  if (a.classification !== 'V-A' && b.classification === 'V-A') return 1

  if (a.profile_signal === 'ONE_STAR' && b.profile_signal !== 'ONE_STAR') return -1
  if (a.profile_signal !== 'ONE_STAR' && b.profile_signal === 'ONE_STAR') return 1

  const aNever = !a.last_contact_at
  const bNever = !b.last_contact_at
  if (aNever && !bNever) return -1
  if (!aNever && bNever) return 1

  const aTime = a.last_contact_at
    ? new Date(a.last_contact_at).getTime()
    : new Date(a.created_at).getTime()
  const bTime = b.last_contact_at
    ? new Date(b.last_contact_at).getTime()
    : new Date(b.created_at).getTime()

  // Older first (most overdue / oldest in the backlog queue).
  if (aTime < bTime) return -1
  if (aTime > bTime) return 1
  return 0
}

// Days a lead is past its follow-up window. Positive = overdue by N days.
// -1 = not applicable (no follow-up scheduled for the stage, or never contacted).
export function daysOverdue(
  lead: { last_contact_at: string | null },
  stage: string
): number {
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
