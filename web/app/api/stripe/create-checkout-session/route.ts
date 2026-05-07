import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, STRIPE_PRICES, type BillingCycle } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { repCount = 1, billingCycle = 'monthly' } = body as {
      repCount?: number
      billingCycle?: BillingCycle
    }

    // Get the user's account
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

    const { count: activeRepCount } = await supabase
      .from('Users')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', userData.account_id)
      .eq('role', 'rep')

    const { count: pendingRepInvites } = await supabase
      .from('Invitations')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', userData.account_id)
      .eq('role', 'rep')
      .eq('status', 'pending')

    const usedSlots = (activeRepCount || 0) + (pendingRepInvites || 0)

    if (repCount < usedSlots) {
      return NextResponse.json(
        {
          error: `You currently have ${usedSlots} rep${usedSlots !== 1 ? 's' : ''} using slots. Increase rep slots before starting checkout.`,
        },
        { status: 409 }
      )
    }

    // Get account details
    const { data: account } = await supabase
      .from('Accounts')
      .select('id, name, company_name, stripe_customer_id')
      .eq('id', userData.account_id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    let customerId = account.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: account.company_name || account.name || undefined,
        metadata: {
          account_id: account.id,
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to account
      await supabase
        .from('Accounts')
        .update({ stripe_customer_id: customerId })
        .eq('id', account.id)
    }

    const priceId = billingCycle === 'annual' ? STRIPE_PRICES.annual : STRIPE_PRICES.monthly

    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe ${billingCycle} price not configured` },
        { status: 500 }
      )
    }

    // Create checkout session with quantity-based pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: repCount,
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
          rep_count: String(repCount),
          billing_cycle: billingCycle,
        },
      },
      success_url: `${request.headers.get('origin')}/dashboard?checkout=success`,
      cancel_url: `${request.headers.get('origin')}/settings?checkout=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
