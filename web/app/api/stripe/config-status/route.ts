import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('Users')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (!userData || !['admin', 'manager'].includes(userData.role)) {
    return NextResponse.json({ error: 'Billing access denied' }, { status: 403 })
  }

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
