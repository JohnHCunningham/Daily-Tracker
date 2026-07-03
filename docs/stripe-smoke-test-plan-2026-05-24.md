# Stripe Payment Smoke Test Plan — May 24, 2026

## Prerequisites

- Stripe test mode confirmed (check Vercel env: `STRIPE_SECRET_KEY` should start with `sk_test_`)
- Test account in production app (manager/admin role)
- Stripe test cards ready:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0341`
  - Expiry: any future date
  - CVC: any 3 digits

---

## TEST 1: Checkout Session Creation

**Goal:** Verify checkout creates a Stripe session with correct pricing.

**Steps:**
1. Login as manager at app.oneclickcoaching.com
2. Navigate to Settings → Billing
3. Select rep count (e.g., 3 reps)
4. Select billing cycle (monthly or annual)
5. Click "Subscribe" or checkout button

**Verify:**
- [ ] Redirected to Stripe checkout page
- [ ] URL is `checkout.stripe.com`
- [ ] Line item shows correct quantity (3 × $50/mo or $500/yr)
- [ ] 14-day trial mentioned
- [ ] Can adjust quantity on Stripe page

**Expected DB state (before payment):**
- `Accounts.stripe_customer_id` — populated with `cus_...`

---

## TEST 2: Successful Checkout → Subscription Active

**Goal:** Verify webhook processes a completed checkout end-to-end.

**Steps:**
1. Complete checkout with test card `4242 4242 4242 4242`
2. Wait for redirect back to `/dashboard?checkout=success`
3. Check Stripe dashboard for the subscription
4. Check Supabase for updated account

**Verify (in Supabase `Accounts` table):**
- [ ] `subscription_status` = `'trialing'` (14-day trial active)
- [ ] `stripe_subscription_id` = `sub_...`
- [ ] `stripe_price_id` = price ID from env
- [ ] `rep_count` = quantity selected
- [ ] `billing_cycle` = `'monthly'` or `'annual'`
- [ ] `trial_ends_at` = 14 days from now
- [ ] `current_period_end` = trial end date
- [ ] `max_team_members` = rep count
- [ ] `cancel_at_period_end` = false

**Verify (in Supabase `Stripe_Webhook_Events`):**
- [ ] Row exists for `checkout.session.completed` with status `'processed'`
- [ ] Row exists for `customer.subscription.created` with status `'processed'`

**Verify (in app):**
- [ ] Trial banner shows days remaining (e.g., "14 days left in trial")
- [ ] App content fully accessible (not blocked by gate)

---

## TEST 3: Billing Gate — Trial Active

**Goal:** Verify gate allows access during active trial.

**Steps:**
1. Login as account with `subscription_status = 'trialing'`
2. Navigate to Dashboard, Notes, Team pages

**Verify:**
- [ ] All app pages load normally
- [ ] No billing gate appears
- [ ] Trial banner visible

---

## TEST 4: Billing Gate — Trial Expired

**Goal:** Verify gate blocks access when trial ends without payment.

**Steps:**
1. Manually set account in Supabase:
   - `subscription_status = 'trialing'`
   - `trial_ends_at = 2 days ago` (past date)
2. Login as that account
3. Attempt to access Dashboard

**Verify:**
- [ ] Redirected to billing gate
- [ ] Message: "Your trial ended"
- [ ] "Go to Billing" button visible
- [ ] Settings page still accessible

**Reset after test:**
- [ ] Restore `trial_ends_at` to 2 days from now

---

## TEST 5: Payment Failure → Past Due

**Goal:** Verify webhook handles payment failure correctly.

**Steps:**
1. Use Stripe test clock or manually trigger `invoice.payment_failed` webhook
   - Alternative: Create subscription with test card `4000 0000 0000 0341` and let first charge fail after trial
2. Check account state

**Verify (DB):**
- [ ] `subscription_status` = `'past_due'`
- [ ] `billing_grace_ends_at` = 5 days from now
- [ ] `Stripe_Webhook_Events` row for `invoice.payment_failed` with status `'processed'`

**Verify (email):**
- [ ] Resend email sent to admin/manager
- [ ] Email contains: account name, invoice number, amount, next retry date
- [ ] Email has "View invoice" and "Open billing" links

---

## TEST 6: Billing Gate — Past Due (Grace Active)

**Goal:** Verify gate allows access during grace period.

**Steps:**
1. Set account to `subscription_status = 'past_due'`, `billing_grace_ends_at = 3 days from now`
2. Login

**Verify:**
- [ ] App loads normally (grace period active)
- [ ] No gate blocking

---

## TEST 7: Billing Gate — Past Due (Grace Expired)

**Goal:** Verify gate blocks access after grace period.

**Steps:**
1. Set account to `subscription_status = 'past_due'`, `billing_grace_ends_at = 2 days ago`
2. Login

**Verify:**
- [ ] Billing gate appears
- [ ] Message: "Billing grace ended"
- [ ] "Go to Billing" button works

---

## TEST 8: Payment Recovery

**Goal:** Verify past_due → active recovery works.

**Steps:**
1. Account is currently `past_due` with grace active
2. Trigger `invoice.payment_succeeded` webhook (or use Stripe test clock to simulate successful retry)

**Verify (DB):**
- [ ] `subscription_status` = `'active'`
- [ ] `billing_grace_ends_at` = null

---

## TEST 9: Subscription Canceled

**Goal:** Verify cancel webhook updates account.

**Steps:**
1. Cancel subscription in Stripe dashboard
2. Trigger `customer.subscription.deleted` webhook or wait for it

**Verify (DB):**
- [ ] `subscription_status` = `'canceled'`
- [ ] `billing_grace_ends_at` = null
- [ ] `cancel_at_period_end` = false

**Verify (app):**
- [ ] Billing gate blocks access
- [ ] Message: "Subscription inactive"

---

## TEST 10: Quantity Change

**Goal:** Verify subscription update syncs rep count changes.

**Steps:**
1. Update subscription quantity in Stripe dashboard (e.g., 3 → 5 reps)
2. Trigger `customer.subscription.updated` webhook

**Verify (DB):**
- [ ] `rep_count` = 5
- [ ] `max_team_members` = 5

---

## TEST 11: Duplicate Webhook Protection

**Goal:** Verify idempotency — same event doesn't corrupt state.

**Steps:**
1. Send same `checkout.session.completed` event twice (use Stripe CLI or curl)
2. Check `Stripe_Webhook_Events` table

**Verify:**
- [ ] First attempt: status `'processed'`
- [ ] Second attempt: returns `{ received: true, duplicate: true }` (200)
- [ ] Only one row in `Stripe_Webhook_Events` (unique on `event_id`)

---

## Smoke Test Order (Recommended)

1. TEST 1 — Checkout session creation
2. TEST 2 — Successful checkout → trialing
3. TEST 3 — Gate: trial active (should pass)
4. TEST 11 — Duplicate protection
5. TEST 4 — Gate: trial expired
6. TEST 5 — Payment failure → past_due
7. TEST 6 — Gate: past_due with grace
8. TEST 7 — Gate: past_due grace expired
9. TEST 8 — Payment recovery
10. TEST 10 — Quantity change sync
11. TEST 9 — Subscription canceled

**Estimated time:** 2-3 hours with Stripe test mode

---

## Notes

- All tests use Stripe TEST MODE only — never run against live keys
- Stripe test clock can fast-forward trial periods to avoid waiting 14 days
- Webhook events can be triggered manually via Stripe CLI: `stripe trigger checkout.session.completed`
- If Resend emails aren't received, check Resend dashboard for delivery status
