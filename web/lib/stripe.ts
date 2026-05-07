import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  }
  return _stripe
}

// For backwards compatibility
export const stripe = typeof process.env.STRIPE_SECRET_KEY === 'string'
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
  : (null as unknown as Stripe)

// Price IDs for per-rep pricing ($50/rep/month, $500/rep/year)
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
} as const

// Per-rep pricing
export const PRICE_PER_REP = {
  monthly: 50, // $50/rep/month
  annual: 500, // $500/rep/year (2 months free)
} as const

export type BillingCycle = 'monthly' | 'annual'
