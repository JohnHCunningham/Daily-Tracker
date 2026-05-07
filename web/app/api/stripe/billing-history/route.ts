import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

type BillingHistoryItem = {
  id: string
  number: string | null
  status: string
  currency: string
  amountPaid: number
  amountDue: number
  createdAt: string
  periodStart: string | null
  periodEnd: string | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  billingReason: string | null
  description: string | null
  paidAt: string | null
  failureReason: string | null
}

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      .select('stripe_customer_id, name')
      .eq('id', userData.account_id)
      .single()

    if (!account?.stripe_customer_id) {
      return NextResponse.json({ success: true, invoices: [], accountName: account?.name || null })
    }

    const invoices = await stripe.invoices.list({
      customer: account.stripe_customer_id,
      limit: 12,
    })

    const items: BillingHistoryItem[] = invoices.data
      .map((invoice) => {
        const invoiceAny = invoice as Stripe.Invoice & {
          last_finalization_error?: { message?: string }
        }

        return {
          id: invoice.id,
          number: invoice.number || null,
          status: invoice.status || 'draft',
          currency: invoice.currency || 'usd',
          amountPaid: invoice.amount_paid || 0,
          amountDue: invoice.amount_due || 0,
          createdAt: new Date((invoice.created || 0) * 1000).toISOString(),
          periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
          hostedInvoiceUrl: invoice.hosted_invoice_url || null,
          invoicePdf: invoice.invoice_pdf || null,
          billingReason: invoice.billing_reason || null,
          description: invoice.description || null,
          paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
          failureReason: invoiceAny.last_finalization_error?.message || null,
        }
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return NextResponse.json({
      success: true,
      accountName: account.name || null,
      invoices: items,
    })
  } catch (error) {
    console.error('Billing history error:', error)
    return NextResponse.json(
      { error: 'Failed to load billing history' },
      { status: 500 }
    )
  }
}
