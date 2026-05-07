import { NextResponse } from 'next/server'

export async function GET() {
  const hasSecretKey = Boolean(process.env.STRIPE_SECRET_KEY)
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET)
  const hasMonthlyPrice = Boolean(process.env.STRIPE_PRICE_MONTHLY)
  const hasAnnualPrice = Boolean(process.env.STRIPE_PRICE_ANNUAL)

  return NextResponse.json({
    configured:
      hasSecretKey &&
      hasWebhookSecret &&
      hasMonthlyPrice &&
      hasAnnualPrice,
    hasSecretKey,
    hasWebhookSecret,
    hasMonthlyPrice,
    hasAnnualPrice,
  })
}
