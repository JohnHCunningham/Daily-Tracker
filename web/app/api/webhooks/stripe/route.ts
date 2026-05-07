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
    const { data: loggedEvent, error: logError } = await supabaseAdmin
      .from('Stripe_Webhook_Events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        status: 'processing',
        payload: event,
        customer_id: (event.data.object as { customer?: string | null })?.customer || null,
        subscription_id: (event.data.object as { subscription?: string | null })?.subscription || null,
      })
      .select('id')
      .single()

    if (logError) {
      if ((logError as { code?: string }).code === '23505') {
        return NextResponse.json({ received: true, duplicate: true })
      }

      console.error('Failed to log Stripe webhook event:', logError)
      return NextResponse.json({ error: 'Webhook event log failed' }, { status: 500 })
    }

    const eventRowId = loggedEvent?.id

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

    if (eventRowId) {
      await supabaseAdmin
        .from('Stripe_Webhook_Events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', eventRowId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    const message = error instanceof Error ? error.message : 'Webhook handler failed'
    try {
      await supabaseAdmin
        .from('Stripe_Webhook_Events')
        .update({
          status: 'failed',
          error_message: message,
        })
        .eq('event_id', event.id)
    } catch {
      // ignore secondary logging failure
    }
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
      billing_grace_ends_at: null,
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
      billing_grace_ends_at: null,
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
      billing_grace_ends_at: null,
    })
    .eq('id', account.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  const { data: account } = await supabaseAdmin
    .from('Accounts')
    .select('id, name, company_name, stripe_customer_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!account) return

  await supabaseAdmin
    .from('Accounts')
    .update({
      subscription_status: 'past_due',
      billing_grace_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', account.id)

  await notifyBillingFailure({
    accountId: account.id,
    accountName: account.company_name || account.name || 'One Click Coaching',
    invoice,
    stripe,
  })
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
        billing_grace_ends_at: null,
      })
      .eq('id', account.id)
  } else {
    await supabaseAdmin
      .from('Accounts')
      .update({
        billing_grace_ends_at: null,
      })
      .eq('id', account.id)
  }
}

async function notifyBillingFailure({
  accountId,
  accountName,
  invoice,
  stripe,
}: {
  accountId: string
  accountName: string
  invoice: Stripe.Invoice
  stripe: Stripe
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log('Billing failure notification skipped: RESEND_API_KEY not configured')
    return
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: recipients } = await supabaseAdmin
    .from('Users')
    .select('full_name, email, role')
    .eq('account_id', accountId)
    .in('role', ['admin', 'manager'])

  if (!recipients || recipients.length === 0) {
    return
  }

  const currency = (invoice.currency || 'usd').toUpperCase()
  const amountDue = (invoice.amount_due || 0) / 100
  const invoiceNumber = invoice.number || invoice.id
  const invoiceUrl = invoice.hosted_invoice_url || `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.oneclickcoaching.com'}/settings#billing`
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.oneclickcoaching.com'}/settings#billing`
  const nextAttempt = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000).toLocaleString()
    : 'soon'

  for (const recipient of recipients) {
    const recipientName = recipient.full_name || recipient.email || 'there'

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'One Click Coaching <noreply@oneclickcoaching.com>',
        to: [recipient.email],
        subject: `Billing issue for ${accountName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #241a14;">
            <h1 style="font-size: 24px; margin-bottom: 16px;">Billing issue detected</h1>
            <p>Hi ${recipientName},</p>
            <p>Stripe reported a payment failure for <strong>${accountName}</strong>.</p>
            <ul style="padding-left: 20px;">
              <li>Invoice: ${invoiceNumber}</li>
              <li>Amount due: ${currency} ${amountDue.toFixed(2)}</li>
              <li>Next retry: ${nextAttempt}</li>
            </ul>
            <p>
              <a href="${invoiceUrl}" style="display:inline-block;background:#b5583e;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;margin-right:8px;">View invoice</a>
              <a href="${portalUrl}" style="display:inline-block;background:#ffffff;color:#241a14;padding:12px 18px;border:1px solid #d8cbbf;border-radius:8px;text-decoration:none;font-weight:700;">Open billing</a>
            </p>
            <p style="font-size: 13px; color: #75685f;">The account stays in grace while billing retries are active.</p>
          </div>
        `,
        text: `Billing issue detected for ${accountName}.\n\nInvoice: ${invoiceNumber}\nAmount due: ${currency} ${amountDue.toFixed(2)}\nNext retry: ${nextAttempt}\n\nView invoice: ${invoiceUrl}\nOpen billing: ${portalUrl}`,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('Billing failure email failed:', response.status, body)
    }
  }
}
