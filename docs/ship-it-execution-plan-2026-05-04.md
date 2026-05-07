# OCC Ship-It Execution Plan

Date: 2026-05-04  
Input sources:
- Notion sprint plan: `OCC Sprint: Ship It`
- PDF audit: `/Users/johncunningham/Downloads/OCC-Product-Audit-Report (1).pdf`
- System audit: `docs/system-audit-2026-05-04.md`
- Current repo state: `web`, `supabase/functions`, `supabase/migrations`
- Current website repo: `/Users/johncunningham/one-click-coaching-website`

## Operating Rule

Two focused engineering hours per day. Work top to bottom, but update the old plan where reality has changed.

The old plan says run migrations through `059`; the repo now has migrations through `079`. The current ship target is not “migration 059 complete,” it is “production database matches the current repo and passes tenant-isolation checks.”

Repository rule:
- `oneclickcoaching/web` is the product app.
- `oneclickcoaching/web` also contains old landing-page code, but that is deprecated and should not drive website decisions.
- `/Users/johncunningham/one-click-coaching-website` is the current marketing website.
- Local website remote currently points to `JohnHCunningham/one-click-coaching-website.git`; user-provided repo is `JohnC-Auto/one-click-coaching-website.git`. Confirm before changing remotes or pushing.

## Current Phase Status

### Phase 1 — Deploy

Status: partially done, needs production verification and clear domain split.

Known:
- `https://www.oneclickcoaching.com` loads the marketing site.
- `https://oneclickcoaching-xeso.vercel.app` loads the app/auth host.
- `web/app/page.tsx` redirects root app traffic to `https://www.oneclickcoaching.com`.
- `npm run build` passes locally.
- The current public website is a static HTML repo, not the old landing page in `web`.

Open:
- Confirm Vercel/custom domain setup and final domain structure:
  - Marketing: `www.oneclickcoaching.com` from `/Users/johncunningham/one-click-coaching-website`.
  - Product app: recommended `app.oneclickcoaching.com` from `/Users/johncunningham/oneclickcoaching/web`.
- Verify production env vars in Vercel.
- Verify production Supabase migrations through `079`.
- Verify `pg_cron`, `pgvector`, RAG seed, and Resend.

Owner split:
- I can verify code, env variable names, migration requirements, smoke tests, and deployment config.
- You need to provide access or run the final Vercel/Supabase dashboard steps.

### Phase 2 — Secure

Status: not ship-ready. This is the current blocker before real clients.

Blockers from current audit:
- `team/[memberId]` loads by member id before account/role scoping.
- `calls/[callId]` loads by call id before account/role scoping.
- Edge Functions use service-role access while accepting caller-supplied `account_id` or `call_id`.
- Browser clients write integration credentials directly into Supabase.
- Need two-org Playwright/Supabase verification.

First engineering target:
1. Lock down app-page queries by `account_id`, role, and rep email.
2. Lock down mutations: role changes, goals, coaching, commitments.
3. Add Edge Function JWT/account validation.
4. Add multi-tenant regression tests.

### Phase 3 — Stripe

Status: partially built, not production-safe.

Existing:
- Checkout endpoint exists.
- Portal endpoint exists.
- Update subscription endpoint exists.
- Webhook endpoint exists.
- Stripe fields exist in migration `079`.

Blockers:
- Pricing model unresolved: PDF audit notes the website shows Starter/Growth/Scale/Enterprise tiered pricing while current app code uses `$50/rep/month` and `$500/rep/year`.
- Hardcoded Stripe price ID fallbacks exist.
- `.env.example` omits Stripe/Supabase/Resend/Vercel variables.
- Signup can fall back to dashboard if checkout fails.
- Subscription status is not actually gated.

First engineering target:
1. Decide pricing model.
2. Remove hardcoded price ID fallbacks.
3. Complete env docs.
4. Gate app access by subscription/trial status.
5. Add webhook idempotency/logging.

### Phase 4 — Integrations

Status: built-looking, not verified, and at least two provider flows are internally inconsistent.

HubSpot:
- UI saves `api_key`.
- Sync function expects OAuth `access_token`.
- Needs one chosen path.

Fathom:
- UI and sync are closer, but production OAuth/API-key story must be verified.

Aircall:
- UI saves base64 `apiId:apiToken` into `api_key`.
- Sync function expects `api_key` and `api_secret`, then base64-encodes again.
- Needs schema/UI/function alignment.

First engineering target:
1. Choose auth method per provider.
2. Make UI, schema, and Edge Function agree.
3. Store credentials server-side/encrypted.
4. Validate JWT and derive account from user.
5. Run real sync smoke tests.

## Immediate 2-Hour Sessions

### Session 1 — Make Product Routes Real

Goal: fix obvious broken product flows.

- Add `web/app/api/accept-invite/route.ts`.
- Add `web/app/api/send-invite/route.ts`.
- Add `/app/(app)/notes/page.tsx` minimal but real.
- Verify with Playwright screenshots.

Why first: clients cannot onboard reps without invites, and the app currently links to a 404 core feature.

### Session 2 — Data Isolation Pass 1

Goal: remove obvious cross-rep/cross-account query gaps.

- Patch `team/[memberId]`.
- Patch `calls/[callId]`.
- Patch role update path.
- Patch HubSpot activity query to include `account_id`.
- Add manual regression checklist.

### Session 3 — Edge Function Auth

Goal: service-role functions stop trusting request body account ids.

- Add shared auth/account helper for Edge Functions.
- Patch `hubspot-sync`, `fathom-sync`, `aircall-sync`, `analyze-call`.
- Preserve cron/service invocation path separately.

### Session 4 — Stripe Decision + Gating

Goal: make billing behavior coherent.

- Decide pricing model.
- Patch env docs.
- Remove fallback price IDs.
- Add subscription gate.
- Add billing lifecycle test plan.

### Session 5 — Integration Alignment

Goal: make provider flows internally consistent before production credentials are tested.

- HubSpot: OAuth or API key, not both.
- Aircall: split `api_id`/`api_token` or store one encoded credential consistently.
- Fathom: verify expected credential shape.

## What I Need From You

For code fixes:
- No credentials needed.

For production verification:
- Vercel project access or screenshots of env var settings.
- Supabase project access or permission for you to run SQL I provide.
- Stripe test keys and webhook signing secret, or permission for you to add env vars.
- Resend API key/domain status, or confirmation it is configured.
- A decision on pricing: tiered packages or per-rep pricing.
- Confirmation whether the website remote should be changed to `JohnC-Auto/one-click-coaching-website.git`.

## Recommended Domain Decision

Use:
- `www.oneclickcoaching.com` for marketing.
- `app.oneclickcoaching.com` for the authenticated product.

Then update:
- Vercel domains.
- Supabase auth redirect URLs.
- Stripe success/cancel URLs.
- Resend email dashboard links.
- Metadata/canonical URLs.

Do not point `www.oneclickcoaching.com` at the old `web` landing page.
