// Methodology-agnostic component labels for UI display.
// Source of truth: supabase/functions/analyze-call/methodology-scoring.ts
//
// Each methodology's components have a 'key' (internal) and 'name' (display).
// This file provides the display labels for frontend components that
// previously hardcoded Sandler-specific names.

export const METHODOLOGY_COMPONENT_LABELS: Record<string, Record<string, string>> = {
  sandler: {
    bonding_rapport: 'Bonding & Rapport',
    upfront_contract: 'Upfront Contract',
    pain_funnel: 'Pain Funnel',
    budget_step: 'Budget Step',
    decision_step: 'Decision Step',
    fulfillment: 'Fulfillment',
    post_sell: 'Post-Sell',
    no_free_consulting: 'No Free Consulting',
  },
  challenger: {
    commercial_insight: 'Commercial Insight',
    reframe: 'Reframe',
    rational_drowning: 'Rational Drowning',
    emotional_impact: 'Emotional Impact',
    tailoring: 'Tailoring',
    constructive_control: 'Constructive Control',
  },
  spin: {
    situation_questions: 'Situation Questions',
    problem_questions: 'Problem Questions',
    implication_questions: 'Implication Questions',
    need_payoff_questions: 'Need-Payoff Questions',
  },
  gap: {
    current_state: 'Current State',
    desired_state: 'Desired State',
    gap_quantification: 'Gap Quantification',
    impact_building: 'Impact Building',
    solution_bridge: 'Solution Bridge',
    decision_path: 'Decision Path',
  },
  meddpicc: {
    metrics: 'Metrics',
    economic_buyer: 'Economic Buyer',
    decision_criteria: 'Decision Criteria',
    decision_process: 'Decision Process',
    paper_process: 'Paper Process',
    implications_of_pain: 'Implications of Pain',
    champion: 'Champion',
    competition: 'Competition',
  },
  meddic: {
    metrics: 'Metrics',
    economic_buyer: 'Economic Buyer',
    decision_criteria: 'Decision Criteria',
    decision_process: 'Decision Process',
    implications_of_pain: 'Implications of Pain',
    champion: 'Champion',
  },
  generic: {
    overall: 'Overall',
  },
}

/**
 * Return component name→label map for a given methodology.
 * Falls back to generic if methodology is unknown.
 */
export function getMethodologyComponentLabels(methodology: string | null | undefined): Record<string, string> {
  const id = methodology?.toLowerCase() || 'generic'
  return METHODOLOGY_COMPONENT_LABELS[id] || METHODOLOGY_COMPONENT_LABELS.generic
}

/**
 * Return display names for all components in a methodology.
 */
export function getMethodologyComponentNames(methodology: string | null | undefined): string[] {
  const labels = getMethodologyComponentLabels(methodology)
  return Object.values(labels)
}
