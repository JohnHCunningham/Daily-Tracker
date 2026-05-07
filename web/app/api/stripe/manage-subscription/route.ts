import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

type Action = 'cancel' | 'reactivate'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const action = body?.action as Action | undefined

    if (!action || !['cancel', 'reactivate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if (!['admin', 'manager'].includes(userData.role)) {
      return NextResponse.json({ error: 'Billing access denied' }, { status: 403 })
    }

    const { data: account } = await supabase
      .from('Accounts')
      .select('id, stripe_subscription_id, stripe_customer_id')
      .eq('id', userData.account_id)
      .single()

    if (!account?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id)
    const currentPeriodEnd = 'current_period_end' in subscription
      ? (subscription as { current_period_end?: number }).current_period_end ?? null
      : null

    if (action === 'cancel') {
      if (subscription.cancel_at_period_end) {
        return NextResponse.json({ success: true, cancelAtPeriodEnd: true })
      }

      const updated = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      })

      await supabase
        .from('Accounts')
        .update({
          cancel_at_period_end: updated.cancel_at_period_end,
          current_period_end: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null,
        })
        .eq('id', account.id)

      return NextResponse.json({
        success: true,
        cancelAtPeriodEnd: updated.cancel_at_period_end,
        currentPeriodEnd: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null,
      })
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Canceled subscriptions must be reactivated from Stripe Checkout or the billing portal' },
        { status: 400 }
      )
    }

    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
    })

    await supabase
      .from('Accounts')
      .update({
        cancel_at_period_end: updated.cancel_at_period_end,
        current_period_end: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null,
      })
      .eq('id', account.id)

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
    })
  } catch (error) {
    console.error('Manage subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
