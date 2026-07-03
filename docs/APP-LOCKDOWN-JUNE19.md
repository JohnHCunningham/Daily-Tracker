# OCC App — Lockdown Checklist (June 16-19)

## Day 1 — Tuesday June 17: Fathom Real-Call Test

### 1.1 Schedule a test call
- [ ] Book a 15-min call with yourself or a friend
- [ ] Ensure Fathom is recording (not just connected — actively recording)
- [ ] Talk naturally: discovery questions, qualification, pushback — real content

### 1.2 Verify the sync
- [ ] After call ends, go to app.oneclickcoaching.com → Integrations → Fathom → Sync Now
- [ ] Confirm conversation row appears with:
  - [ ] Transcript text present
  - [ ] Call metadata (duration, date, participants)
  - [ ] Analysis pipeline triggered (check logs)
- [ ] If missing: check Fathom dashboard for recording status, check Vercel logs

### 1.3 Log review
- [ ] Review analyze-call Edge Function logs for errors
- [ ] Confirm RAG methodology matching fired correctly
- [ ] Check that coaching insights were generated

**Gate:** Real call → real transcript → real analysis. Stop here if any link breaks.

---

## Day 2 — Wednesday June 18: Coaching Email + Stripe

### 2.1 Redeploy coaching email Edge Function
- [ ] Pull latest code: `cd /Users/johncunningham/oneclickcoaching`
- [ ] Deploy send-coaching-email to Supabase:
  ```
  supabase functions deploy send-coaching-email --no-verify-jwt
  ```
- [ ] Verify it no longer returns 400 on unauthenticated POST
- [ ] Check that INTERNAL_API_KEY env var is set in Supabase

### 2.2 End-to-end coaching email test
- [ ] Manager: review a call → approve coaching insights → trigger email
- [ ] Verify email arrives in rep inbox
- [ ] Check email content: methodology-correct, call-specific, actionable
- [ ] Confirm no credential leaks in headers

### 2.3 Stripe webhook verification
- [ ] Go to app.oneclickcoaching.com → Settings → Billing
- [ ] Start a checkout session for 1 rep (test)
- [ ] Complete checkout with Stripe test card: `4242 4242 4242 4242`
- [ ] Verify webhook fires:
  - [ ] `subscription_status` updates in DB
  - [ ] `rep_count` updates
  - [ ] `max_team_members` updates
- [ ] Cancel subscription → verify gate blocks app access correctly
- [ ] Reactivate → verify gate lifts

**Gate:** Coaching email delivers. Stripe money moves.

---

## Day 3 — Thursday June 19: Final Smoke + Launch

### 3.1 Quick regression
- [ ] Login as manager → dashboard loads
- [ ] Login as rep → isolated view
- [ ] Fathom sync still works
- [ ] HubSpot sync still works
- [ ] Notes CRUD still works

### 3.2 Deploy any fixes
- [ ] Push to production: `vercel --prod`
- [ ] Confirm build passes

### 3.3 Launch
- [ ] Remove any "beta" / "coming soon" language from app
- [ ] Verify app.oneclickcoaching.com resolves cleanly
- [ ] Send yourself the first paid invoice (confirms billing live)

---

## Quick Reference

| What | Command/Location |
|---|---|
| App dashboard | https://app.oneclickcoaching.com |
| Vercel deploy | `cd /Users/johncunningham/oneclickcoaching && vercel --prod` |
| Supabase deploy | `cd oneclickcoaching && supabase functions deploy <name> --no-verify-jwt` |
| Vercel logs | vercel.com → oneclickcoaching-xeso → Logs |
| Stripe test card | 4242 4242 4242 4242 (any future expiry, any CVC) |
| Edge function list | `supabase functions list` |
