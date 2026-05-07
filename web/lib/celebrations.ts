import type { ComponentType } from 'react'
import {
  HiBadgeCheck,
  HiClipboardCheck,
  HiFire,
  HiLightningBolt,
  HiSparkles,
  HiStar,
  HiTrendingUp,
} from 'react-icons/hi'

export type CelebrationCategory = 'methodology' | 'execution' | 'business'

export interface CelebrationBadgeConfig {
  icon: ComponentType<{ className?: string }>
  color: string
  category: CelebrationCategory
  label: string
  description: string
}

export const celebrationBadgeConfig: Record<string, CelebrationBadgeConfig> = {
  first_call: {
    icon: HiSparkles,
    color: 'bg-terracotta/20 text-terracotta border-terracotta/30',
    category: 'execution',
    label: 'First Call',
    description: 'A rep has their first analyzed call.',
  },
  pain_funnel_pro: {
    icon: HiFire,
    color: 'bg-pink/20 text-terracotta border-pink/30',
    category: 'methodology',
    label: 'Pain Funnel',
    description: 'Strong discovery and pain handling.',
  },
  upfront_contract_master: {
    icon: HiClipboardCheck,
    color: 'bg-clay/20 text-clay border-clay/30',
    category: 'methodology',
    label: 'Upfront Contract',
    description: 'Clear set-up and next-step control.',
  },
  decision_process_master: {
    icon: HiBadgeCheck,
    color: 'bg-aqua/20 text-espresso border-aqua/30',
    category: 'methodology',
    label: 'Decision Process',
    description: 'The buying process is being clarified.',
  },
  budget_champion: {
    icon: HiTrendingUp,
    color: 'bg-gold/20 text-gold border-gold/30',
    category: 'methodology',
    label: 'Budget',
    description: 'Budget is being discussed early and directly.',
  },
  consistent_closer: {
    icon: HiBadgeCheck,
    color: 'bg-clay/20 text-clay border-clay/30',
    category: 'execution',
    label: 'Consistent Closer',
    description: 'Repeatedly executing the close well.',
  },
  perfect_score: {
    icon: HiStar,
    color: 'bg-clay/20 text-clay border-clay/30',
    category: 'execution',
    label: 'Perfect Score',
    description: 'A component score hit 10/10.',
  },
  streak_builder: {
    icon: HiLightningBolt,
    color: 'bg-terracotta-bright/20 text-terracotta-bright border-aqua/30',
    category: 'execution',
    label: 'Streak Builder',
    description: 'Scores improved over consecutive calls.',
  },
  score_champion: {
    icon: HiStar,
    color: 'bg-terracotta/20 text-terracotta border-terracotta/30',
    category: 'execution',
    label: 'Score Champion',
    description: 'A rep is sustaining high overall scores.',
  },
  quota_hit: {
    icon: HiTrendingUp,
    color: 'bg-clay/20 text-clay border-clay/30',
    category: 'business',
    label: 'Quota Crusher',
    description: 'A rep hit or exceeded a goal.',
  },
}

export const celebrationCategories: Array<{
  key: CelebrationCategory
  label: string
  description: string
}> = [
  {
    key: 'methodology',
    label: 'Methodology',
    description: 'Win the behaviors that make the methodology stick.',
  },
  {
    key: 'execution',
    label: 'Execution',
    description: 'Reward consistency, improvement, and closing discipline.',
  },
  {
    key: 'business',
    label: 'Business',
    description: 'Tie team wins back to quota and actual outcomes.',
  },
]

export const celebrationBadgeSections: Record<
  CelebrationCategory,
  string[]
> = {
  methodology: [
    'first_call',
    'pain_funnel_pro',
    'upfront_contract_master',
    'decision_process_master',
    'budget_champion',
  ],
  execution: [
    'consistent_closer',
    'perfect_score',
    'streak_builder',
    'score_champion',
  ],
  business: ['quota_hit'],
}

export function getCelebrationBadgeConfig(badgeKey: string | null | undefined) {
  if (!badgeKey) {
    return {
      icon: HiSparkles,
      color: 'bg-terracotta/20 text-terracotta border-terracotta/30',
      category: 'execution' as CelebrationCategory,
      label: 'Win',
      description: 'A team win worth celebrating.',
    }
  }

  return celebrationBadgeConfig[badgeKey] || {
    icon: HiSparkles,
    color: 'bg-terracotta/20 text-terracotta border-terracotta/30',
    category: 'execution' as CelebrationCategory,
    label: 'Win',
    description: 'A team win worth celebrating.',
  }
}
