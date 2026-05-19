# OCC Deployment Readiness — 2026-05-19

Generated from product audit session. This is your re-entry checklist for deployment.

---

## Current State

**Local commits ready:**
- `9ee70da` — Remove Aircall from product scope
- `9a48266` — Harden Edge Function auth and add integration migrations

**Migrations ready (not yet applied to production):**
- 095: HubSpot user mappings
- 096: Fathom transcript source fields  
- 097: Remove Aircall from daily pipeline

**Build status:**
- ✅ `npm run build` passes (42 routes)
- ✅ No Aircall references in app/function code
- ✅ Auth patterns hardened with shared helper

---

## Production Environment Verification

### Vercel Production Env Vars (14/21 present)

**✅ PRESENT:**
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ANTHROPIC_API_KEY
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_MONTHLY
- STRIPE_PRICE_ANNUAL
- HUBSPOT_CLIENT_ID
- HUBSPOT_CLIENT_SECRET
- FATHOM_CLIENT_ID
- FATHOM_CLIENT_SECRET
- FATHOM_REDIRECT_URI

**❌ MISSING (7 vars):**
1. `OPENAI_API_KEY` — **CRITICAL** for analyze-call function
2. `SUPABASE_SERVICE_ROLE_KEY` — **CRITICAL** for Edge Functions
3. `RESEND_FROM_EMAIL` — optional, has fallback
4. `SUPPORT_OVERRIDE_SECRET` — optional, for emergency account takeover
5. `HUBSPOT_SCOPES` — optional, defaults exist in code
6. `FATHOM_AUTHORIZATION_URL` — optional, has default
7. `NEXT_PUBLIC_GA_ID` — optional, analytics only

**ℹ️ EXTRA (in Vercel, not in .env.example):**
- `Organization` — unknown purpose
- `RESEND_DOMAIN` — alternate spelling of RESEND_FROM_EMAIL?

### Supabase Edge Function Secrets (unknown)

Cannot verify without connecting to Supabase project. These secrets are set separately from Vercel:
- `RESEND_API_KEY` (for send-coaching-email)
- `OPENAI_API_KEY` (for analyze-call)
- `ANTHROPIC_API_KEY` (if analyze-call uses it)

**Action required:** Verify via Supabase dashboard or CLI when connected.

---

## DNS Configuration

**Current status:**
- ✅ Marketing: `www.oneclickcoaching.com` → responds HTTP 200
- ✅ App host: `oneclickcoaching-xeso.vercel.app` → responds HTTP 200
- ❌ App subdomain: `app.oneclickcoaching.com` → does not resolve

**Vercel recommendation:** `A app.oneclickcoaching.com 76.76.21.21`

**Blocker:** Most smoke tests assume `app.oneclickcoaching.com` is the production host. Either:
1. Configure DNS (preferred)
2. Update test plan to use `oneclickcoaching-xeso.vercel.app` temporarily

---

## Deployment Blockers (Must Fix Before Deployment)

### CRITICAL (Deployment will fail without these)
1. **OPENAI_API_KEY missing from Vercel** — analyze-call function will fail
2. **SUPABASE_SERVICE_ROLE_KEY missing from Vercel** — Edge Functions cannot auth internally
3. **DNS not configured** — app.oneclickcoaching.com does not resolve

### HIGH (Deployment succeeds, but features broken)
4. **Supabase secrets unknown** — need to verify RESEND_API_KEY, OPENAI_API_KEY are set in Edge Function environment
5. **Deployed aircall-sync function** — should be deleted from Supabase after migration 097 runs

### MEDIUM (Deployment works, smoke tests may fail)
6. **Production migration state unknown** — don't know which migrations are already applied
7. **Stripe test vs live keys** — need to confirm test keys for smoke testing
8. **RESEND_FROM_EMAIL missing** — email "from" address may fall back to wrong domain

---

## Deployment Sequence (When Ready)

### Phase 1: Pre-flight checks (15 min)
- [ ] Add OPENAI_API_KEY to Vercel production env
- [ ] Add SUPABASE_SERVICE_ROLE_KEY to Vercel production env
- [ ] Verify Supabase Edge Function secrets (RESEND_API_KEY, OPENAI_API_KEY)
- [ ] Check current migration state: which migrations are already applied?
- [ ] Confirm Stripe keys are test keys (for smoke testing)

### Phase 2: Migrations (10 min)
- [ ] Apply migration 095 (HubSpot user mappings)
- [ ] Apply migration 096 (Fathom transcript source fields)
- [ ] Apply migration 097 (Remove Aircall from pipeline)
- [ ] Verify migrations applied successfully

### Phase 3: Edge Functions (15 min)
- [ ] Deploy updated functions: fathom-sync, hubspot-sync, analyze-call
- [ ] Delete deployed aircall-sync function
- [ ] Verify functions respond with 401 (not 404)

### Phase 4: Next.js App (10 min)
- [ ] Push commits to trigger Vercel deploy
- [ ] Wait for build to complete
- [ ] Verify build succeeds

### Phase 5: DNS (5 min, then 10-60 min propagation)
- [ ] Configure `A app.oneclickcoaching.com 76.76.21.21` in DNS provider
- [ ] Wait for propagation
- [ ] Verify app.oneclickcoaching.com resolves

### Phase 6: Smoke Tests (2-4 hours)
Run tests from smoke test queue in JOHN-DASHBOARD.md in priority order:
1. Core auth
2. Tenant isolation (invite accept, rep isolation)
3. Integrations (Fathom OAuth, HubSpot sync)
4. Billing (checkout, webhook, gate)
5. Email delivery

---

## Estimated Time Blocks

**If all config is correct:**
- Pre-flight + deployment: 1 hour
- DNS propagation: 10-60 min
- Smoke tests: 2-3 hours
- **Total: 3-4 hours**

**If config issues found:**
- Debugging missing secrets: +30-60 min
- OAuth credential fixes: +30-60 min
- Billing webhook config: +30 min
- **Total: 5-6 hours**

---

## Next Session Entry Points

**Option A: Fix critical blockers first (30 min)**
- Add OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY to Vercel
- Verify Supabase secrets
- Check migration state
- Then pause or continue to deployment

**Option B: Full deployment (3-4 hour block)**
- Fix all blockers
- Run full deployment sequence
- Execute smoke tests
- Document results

**Option C: Staged deployment (multiple sessions)**
- Session 1: Fix config, apply migrations (1 hour)
- Session 2: Deploy functions and app (1 hour)
- Session 3: Run smoke tests (2-3 hours)

---

## Rollback Plan

If deployment fails mid-way:
- Vercel deploys are instant rollback via dashboard
- Migrations cannot be rolled back easily — test in staging first if available
- Edge Functions: redeploy previous version from git history

---

## Questions for John

Before deployment:
1. Do you have a Supabase staging project for migration testing?
2. Are the Stripe keys currently test or live keys?
3. Who manages DNS for oneclickcoaching.com? (Cloudflare/Route53/other?)
4. Is there a maintenance window preference, or deploy anytime?

---

**Last updated:** 2026-05-19 by Hermes (Claude Sonnet 4)  
**Next action:** Fix critical blockers, then schedule 3-4 hour deployment block
