// Central pipeline structure — single source of truth for stage order, labels,
// colors, and advance progression. Import from here everywhere; do NOT hardcode
// stage order in components.
//
// Canonical order (user-approved): Pending → Request Sent → Observability
// → Mirror → Free Analysis → Call → Breakup (terminal).

export type StageKey =
  | 'pending'
  | 'request_sent'
  | 'observability'
  | 'mirror'
  | 'free_analysis'
  | 'call'
  | 'breakup'

export const STAGE_ORDER: StageKey[] = [
  'pending',
  'request_sent',
  'observability',
  'mirror',
  'free_analysis',
  'call',
  'breakup',
]

export const STAGE_LABELS: Record<StageKey, string> = {
  pending: 'Pending',
  request_sent: 'Request Sent',
  observability: 'Observability',
  mirror: 'Mirror',
  free_analysis: 'Free Analysis',
  call: 'Call',
  breakup: 'Breakup',
}

export const STAGE_COLORS: Record<StageKey, string> = {
  pending: '#8F847A', // stone-light — cold start
  request_sent: '#C9A687', // clay
  observability: '#D4B89A', // clay bright
  mirror: '#D4633E', // terracotta
  free_analysis: '#E87456', // terracotta bright
  call: '#2A221C', // espresso
  breakup: '#B5583E', // terracotta dark
}

// Advance-stage progression. "breakup" is terminal (maps to itself).
export const NEXT_STAGE: Record<StageKey, StageKey> = {
  pending: 'request_sent',
  request_sent: 'observability',
  observability: 'mirror',
  mirror: 'free_analysis',
  free_analysis: 'call',
  call: 'breakup',
  breakup: 'breakup',
}

// Days after last contact before follow-up is due (per stage). -1 = no follow-up.
export const STAGE_FOLLOW_UP_DAYS: Record<string, number> = {
  pending: 0,
  request_sent: 4,
  observability: 3,
  mirror: 7,
  free_analysis: 5,
  call: -1,
  breakup: 14,
}
