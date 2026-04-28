import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, STRIPE_PRICES } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { newRepCount } = body as { newRepCount: number }

    if (!newRepCount || newRepCount < 1) {
      return NextResponse.json({ error: 'Invalid rep count' }, { status: 400 })
    }

    // Get the user's account
    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get account with subscription info
    const { data: account } = await supabase
      .from('Accounts')
      .select('id, stripe_subscription_id, stripe_customer_id')
      .eq('id', userData.account_id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // If no subscription exists, create a new checkout session
    if (!account.stripe_subscription_id) {
      // Redirect to checkout for new subscription
      let customerId = account.stripe_customer_id

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            account_id: account.id,
            user_id: user.id,
          },
        })
        customerId = customer.id

        await supabase
          .from('Accounts')
          .update({ stripe_customer_id: customerId })
          .eq('id', account.id)
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: STRIPE_PRICES.monthly,
            quantity: newRepCount,
            adjustable_quantity: {
              enabled: true,
              minimum: 1,
              maximum: 100,
            },
          },
        ],
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            account_id: account.id,
            rep_count: String(newRepCount),
            billing_cycle: 'monthly',
          },
        },
        success_url: `${request.headers.get('origin')}/settings?checkout=success`,
        cancel_url: `${request.headers.get('origin')}/settings?checkout=canceled`,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      })

      return NextResponse.json({ url: session.url, type: 'checkout' })
    }

    // Update existing subscription quantity
    const subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id)
    const subscriptionItemId = subscription.items.data[0]?.id

    if (!subscriptionItemId) {
      return NextResponse.json({ error: 'Subscription item not found' }, { status: 400 })
    }

    // Update the quantity
    await stripe.subscriptions.update(account.stripe_subscription_id, {
      items: [
        {
          id: subscriptionItemId,
          quantity: newRepCount,
        },
      ],
      proration_behavior: 'create_prorations', // Charge/credit the difference
      metadata: {
        rep_count: String(newRepCount),
      },
    })

    // Update our database immediately (webhook will also update, but this is faster for UI)
    await supabase
      .from('Accounts')
      .update({
        rep_count: newRepCount,
        max_team_members: newRepCount,
      })
      .eq('id', account.id)

    return NextResponse.json({ success: true, newRepCount, type: 'updated' })
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
