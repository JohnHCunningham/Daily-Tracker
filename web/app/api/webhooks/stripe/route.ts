import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization for Supabase admin client
let _supabaseAdmin: SupabaseClient | null = null
function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!subscriptionId) return

  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  // Get the full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Find account by customer ID
  const { data: account } = await supabaseAdmin
    .from('Accounts')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!account) {
    console.error('No account found for customer:', customerId)
    return
  }

  // Get quantity from the actual subscription item (in case customer adjusted it)
  const repCount = subscription.items.data[0]?.quantity || parseInt(subscription.metadata?.rep_count || '1', 10)
  const billingCycle = subscription.metadata?.billing_cycle || 'monthly'

  // Get period end from subscription
  const periodEnd = 'current_period_end' in subscription
    ? (subscription as { current_period_end: number }).current_period_end
    : null

  await supabaseAdmin
    .from('Accounts')
    .update({
      stripe_subscription_id: subscriptionId,
      stripe_price_id: subscription.items.data[0]?.price.id,
      subscription_status: subscription.status,
      rep_count: repCount,
      billing_cycle: billingCycle,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      max_team_members: repCount, // Sync rep count to max team members
    })
    .eq('id', account.id)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const supabaseAdmin = getSupabaseAdmin()

  const { data: account } = await supabaseAdmin
    .from('Accounts')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!account) {
    console.error('No account found for customer:', customerId)
    return
  }

  // Get quantity from the subscription item
  const quantity = subscription.items.data[0]?.quantity || 1
  const billingCycle = subscription.metadata?.billing_cycle || 'monthly'

  // Get period end from subscription
  const periodEnd = 'current_period_end' in subscription
    ? (subscription as { current_period_end: number }).current_period_end
    : null

  await supabaseAdmin
    .from('Accounts')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      subscription_status: subscription.status,
      rep_count: quantity,
      billing_cycle: billingCycle,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      max_team_members: quantity, // Sync rep count to max team members
    })
    .eq('id', account.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const supabaseAdmin = getSupabaseAdmin()

  const { data: account } = await supabaseAdmin
    .from('Accounts')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!account) {
    console.error('No account found for customer:', customerId)
    return
  }

  await supabaseAdmin
    .from('Accounts')
    .update({
      subscription_status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('id', account.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const supabaseAdmin = getSupabaseAdmin()

  const { data: account } = await supabaseAdmin
    .from('Accounts')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!account) return

  await supabaseAdmin
    .from('Accounts')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', account.id)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  // Access subscription from parent property if available
  const subscriptionId = (invoice as { subscription?: string | null }).subscription

  if (!subscriptionId) return

  const supabaseAdmin = getSupabaseAdmin()
  const { data: account } = await supabaseAdmin
    .from('Accounts')
    .select('id, subscription_status')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!account) return

  // Only update if recovering from past_due
  if (account.subscription_status === 'past_due') {
    await supabaseAdmin
      .from('Accounts')
      .update({
        subscription_status: 'active',
      })
      .eq('id', account.id)
  }
}
