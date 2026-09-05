# John Dashboard: OCC Product / App

This file is a chat-readable product dashboard for the One Click Coaching app.

## 🔴 ACTIVE: App Lockdown — COMPLETE June 21

**3 blockers. CLEARED.** See `docs/APP-LOCKDOWN-JUNE19.md` for full step-by-step.

| Day | Item | Status |
|---|---|---|
| Tue Jun 17 | Fathom real-call test (record → sync → analyze) | ✅ Proven (10 calls Jun 20) |
| Wed Jun 18 | Coaching email deploy + end-to-end test | ✅ |
| Wed Jun 18 | Stripe webhook real transaction test | ✅ Live (webhook configured Jun 21) |
| Thu Jun 19 | Regression smoke + launch | ✅ Production |

**Cleared:** Fathom OAuth working. Stripe test subscription confirmed (Harry Smith, $1). Webhook endpoint live with updated secret. Sync Now route created and deployed.

## Design Standards (Power Design — apply to all UI work)

All app UI must follow these rules from the Power Design system:
- **Type:** Inter (display 600, body 400). JetBrains Mono for metrics/scores. 4 sizes max per view, 1.333 scale. Body ≥24px screen, line-height 1.5.
- **Color:** Dominant #FAFAF8, secondary #0F1B2D, accent #C8501E (one use per view — the number that hurts). WCAG 4.5:1 minimum.
- **Spacing:** 8-pt grid exclusively. {4,8,16,24,32,48,64,96,128}px.
- **Precedence:** Accessibility > brand tokens > aesthetics.
- **No:** Gradients, multiple accents, stock imagery, motivational language, emojis.
- Full spec: `power-design` skill (thresholds.json + verify.js)

## Primary Docs

- System audit: `docs/system-audit-2026-05-04.md`
- Ship-it execution plan: `docs/ship-it-execution-plan-2026-05-04.md`
- Full app audit plan: `docs/plans/2026-03-15-full-app-audit.md`
- Integration layer plan: `INTEGRATION-LAYER-PLAN.md`
- Current status: `CURRENT-STATUS.md`

## Integration Focus

For each integration, track four states separately:

1. Built
2. Configured
3. Deployed
4. Proven end-to-end with a smoke test

## Fathom Checklist

- [x] UI connect page exists
- [x] OAuth start/callback route exists
- [x] Connection row is created/updated
- [x] Sync function deployed
- [x] Required DB fields/migration applied
- [x] Real Fathom connect flow completed
- [x] Sync Now produces conversation rows with transcript text
- [x] Fathom real-call test — 10 calls synced Jun 20
- [x] Logs reviewed for failed recording/transcript/summary calls

## Latest Verification

### 2026-06-12 — Meta noindex Fix (Fable 5 Audit Finding)

| # | Test | Result |
|---|------|--------|
| 1 | App root layout noindex, nofollow | ✅ FIXED + deployed |
| 2 | Stripped SEO keywords, OpenGraph, Twitter cards | ✅ |
| 3 | metadataBase → app.oneclickcoaching.com | ✅ |
| 4 | Canonical removed (was pointing to marketing site) | ✅ |

Finding from Fable 5: app.oneclickcoaching.com was serving the marketing site's full metadata — canonical URL, SEO keywords, og-image, "index, follow" robots. Deployed fix in `web/app/layout.tsx`.

### 2026-06-08 — Smoke Test Session

| # | Test | Result |
|---|------|--------|
| 1 | Login → dashboard | ✅ |
| 2 | Send/accept invite (tenant isolation) | ✅ |
| 3 | Rep isolation (can't see other reps) | ✅ |
| 4 | Admin drills into rep detail | ✅ |
| 5 | Notes — rep can initiate + reply to manager | ✅ FIXED + deployed |
| 6 | Calls — rep empty state (no dead link) | ✅ FIXED + deployed |
| 7 | Integrations gated to admin/manager | ✅ |
| 8 | Onboarding carousel — any-order navigation | ✅ FIXED + deployed |
| 9 | Badges methodology-agnostic | ❌ Sandler-hardcoded (3 files — logged) |

**Blocked (needs call data):** Fathom sync with real calls, coaching email delivery, Stripe billing flow.

**Next session:** Fathom → emails → Stripe.

Fathom OAuth + sync is now end-to-end proven:
- New Fathom app registered with development credentials
- Client ID/Secret configured in `.env.local`
- Redirect URI: `https://app.oneclickcoaching.com/api/integrations/fathom/oauth/callback`
- Connect flow completed successfully
- Sync Now produces conversation rows with transcript text

Status: FATHOM INTEGRATION IS LIVE. Seven months of fear, done by 12:20 PM.

### 2026-05-19 — Product Routes Audit Item

- `npm run build` passes.
- `/api/send-invite` exists and is account-scoped to the authenticated inviter.
- `/api/accept-invite` exists and rejects malformed requests with `400 Missing token or authId`.
- `/notes` route exists and redirects unauthenticated users to `/login` instead of returning 404.
- `/api/notes` exists and returns `401 Unauthorized` without a signed-in session.
- `team/[memberId]` now uses `/api/team/members/[memberId]`, scoped by `account_id` and role.
- `calls/[callId]` now uses `/api/calls/[callId]`, scoped by `account_id`; reps are restricted to their own `rep_email`.

Status: the original audit item “missing invite/notes routes” is no longer the active blocker in local code. Next product blocker is production deployment/smoke testing and deeper Edge Function auth/account validation.

### 2026-05-19 — Edge Function Auth / Account Validation

Verified locally/static from `/Users/johncunningham/oneclickcoaching`:

- Shared helper exists at `supabase/functions/_shared/auth.ts`.
- `fathom-sync` and `hubspot-sync` use the shared helper and derive `account_id` from the authenticated user for browser calls.
- For internal/service-role calls, the shared helper requires explicit `account_id`; missing internal `account_id` returns a controlled `400`.
- The shared helper rejects missing auth with `401`, unknown account with `404`, and non-admin/non-manager integration access with `403`.
- `analyze-call` uses the shared helper, rejects browser-supplied cross-account `account_id` in batch mode, and scopes single-call lookup by `id` plus `account_id`.
- Hardened `analyze-call` update path so the final `Synced_Conversations` update also filters by `account_id`.
- Lightweight bracket scan passed for `_shared/auth.ts`, `fathom-sync`, `hubspot-sync`, and `analyze-call`.

Open follow-ups:

- Production deployment is not proven; confirm deployed Edge Functions match local code before real-client use.
- Production smoke tests are still pending.
- Legacy `fathom-oauth-callback` and `hubspot-oauth-callback` Edge Functions use separate `User_Roles` auth logic and older token endpoints; current app OAuth path appears to be the Next route under `web/app/api/integrations/[provider]/oauth/callback/route.ts`, but deployed legacy function status should be confirmed before launch.

Status: Edge Function auth/account validation is locally reviewed and slightly hardened. Next blocker is deployment verification plus production smoke testing.

### 2026-05-19 — Audit Continuation / Smoke Test Queue

Local/static audit notes:

- Current app OAuth path is the Next.js route pair under `web/app/api/integrations/[provider]/oauth/start/route.ts` and `web/app/api/integrations/[provider]/oauth/callback/route.ts`.
- Older docs still reference deployed Supabase Edge OAuth callbacks (`hubspot-oauth-callback`, `fathom-oauth-callback`). Treat these as legacy until production deployment confirms whether they are still deployed/used.
- Stripe hardcoded price fallbacks appear removed from `web/lib/stripe.ts`; prices now come from `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ANNUAL`.
- Billing gate exists in `web/app/(app)/components/BillingAccessGate.tsx` and wraps app content from `web/app/(app)/layout.tsx`.
- Signup only falls back to dashboard on checkout failure for localhost/127.0.0.1; production checkout failure now stays on signup with an error.
- `.env.example` now documents the app/env surface found in code, including Supabase, Stripe, Resend, HubSpot, Fathom, OpenAI, Anthropic Copilot, support override, app URL, and analytics.

Smoke Test Queue — run after local/static audit, not piecemeal:

| Area | Smoke test | Environment | Expected result | Risk |
| --- | --- | --- | --- | --- |
| Core auth | Login to production app as test manager | Production | Redirects to dashboard/app, not marketing site | Medium |
| Invite | Manager sends rep invite | Production test account | Invite row created, email/link available, account scoped | Medium |
| Invite accept | Rep accepts invite | Production test account | Rep joins correct account; cannot see other reps | High |
| Notes | Manager opens `/notes` and saves note | Production test account | Note saves/loads under correct account/user | Medium |
| Team detail | Manager opens team member detail | Production test account | Member data scoped to same account | High |
| Call detail | Manager opens call detail | Production test account | Call loads only inside account | High |
| Rep isolation | Rep attempts another rep call/member URL | Production test account | 404/403 or redirect; no cross-rep data | High |
| Edge sync auth | Invoke sync without auth | Production/staging | Controlled 401 | Low |
| Edge sync role | Rep invokes sync | Production/staging | Controlled 403 | Medium |
| Fathom OAuth | Connect Fathom with Google SSO | Production test account | API_Connections row active and account scoped | High |
| Fathom sync | Click Sync Now | Production test account | Conversation rows created with transcript/summary when available | High |
| HubSpot sync | Connect/sync HubSpot test portal | Production test account | Activities sync with owner mappings and account scope | High |
| Billing checkout | Create checkout session | Stripe test/prod test account | Redirects to Stripe with correct per-rep price/quantity | High |
| Billing webhook | Complete checkout | Stripe test/prod test account | Account subscription_status, rep_count, max_team_members update | High |
| Billing gate | Expired/canceled/past_due account opens app | Production/staging | App content blocked except settings/billing | High |
| Email | Send invite/coaching email | Production test account | Resend sends from configured domain; no credential leak | Medium |

Status: keep adding to this queue as the audit finds proof steps. Do not mark launch-ready until the queue is run and results are recorded.

### 2026-05-19 — Deployment Verification Pass 1

Non-destructive checks completed from `/Users/johncunningham/oneclickcoaching`:

- Vercel project link exists at `.vercel/project.json`: project `oneclickcoaching-xeso`, root directory `web`, framework Next.js, Node.js 24.x.
- `https://oneclickcoaching-xeso.vercel.app/login` returns HTTP 200.
- `https://www.oneclickcoaching.com` returns HTTP 200 for the marketing site.
- `https://app.oneclickcoaching.com` does not resolve; Vercel domain inspection says DNS is not configured and recommends `A app.oneclickcoaching.com 76.76.21.21`.
- Vercel env names are present for production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, Stripe vars, Resend vars, HubSpot OAuth vars, Fathom OAuth vars, and `ANTHROPIC_API_KEY`.
- Supabase local project ref is `qwqlsbccwnwrdpcaccjz`.
- Legacy Edge OAuth callbacks are not currently deployed at that project: `fathom-oauth-callback` and `hubspot-oauth-callback` both return Supabase function `404 NOT_FOUND`.
- Main sync/analyze functions are deployed: `fathom-sync`, `hubspot-sync`, and `analyze-call` return controlled `401` without authorization.
- Deployment mismatch warning: deployed `send-coaching-email` returns `400 Missing required field: coaching_message_id` on unauthenticated POST `{}`, while local code authenticates first. Treat deployed email function as stale until redeployed or intentionally scoped.

Status: deployment is partially verified. Legacy OAuth callbacks are not deployed, which removes one launch risk. The new blocker is deployed Edge Function drift: `send-coaching-email` does not appear to match the current local auth model.

### 2026-05-19 — Aircall Removed From Product Scope

John confirmed Aircall will not be used.

Local changes:

- Removed Aircall from `/integrations` UI.
- Removed `/integrations/aircall` page.
- Removed dashboard `Sync Now` invocation of `aircall-sync`.
- Removed the local `supabase/functions/aircall-sync` function directory.
- Added migration `097_remove_aircall_from_pipeline.sql` so the daily pipeline only syncs HubSpot/Fathom before analysis/milestones.
- Updated app copy to refer to HubSpot/Fathom only.

Deployment note: local removal is not the same as production removal. Production still needs an approved deploy/migration pass; if the old `aircall-sync` function remains deployed, it should be deleted from Supabase during that pass.

## Deployment Status — 2026-05-20

**✅ DEPLOYED TO PRODUCTION:**
- ✅ All critical env vars added (OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY)
- ✅ Migration 097 applied (Aircall removed from pipeline)
- ✅ Edge Functions deployed with auth hardening (fathom-sync, hubspot-sync, analyze-call)
- ✅ aircall-sync deleted from Supabase
- ✅ Next.js app deployed (42 routes, build passing)
- ✅ DNS configured: app.oneclickcoaching.com resolving
- ✅ Automated smoke tests passing:
  - Login page loads
  - Protected routes redirect to login
  - Protected APIs return 401
  - Edge Functions require auth
  - aircall-sync confirmed deleted (404)

**Current deployment URL:**
- Production: https://oneclickcoaching-xeso.vercel.app
- Custom domain: https://app.oneclickcoaching.com

**❌ BLOCKED — Fathom OAuth:**
- Fathom OAuth app registered with new credentials
- Cannot locate app management page in Fathom developer portal to add/verify redirect URIs
- Support ticket sent to Fathom: 2026-05-20
- When resolved: update FATHOM_CLIENT_ID, FATHOM_CLIENT_SECRET, redeploy, test OAuth flow

**✅ SMOKE TESTS COMPLETED (2026-05-21):**
- ✅ Manager login → dashboard
- ✅ Send/accept rep invite (tenant isolation proven)
- ✅ Notes CRUD (account scoped, conversation switching fixed)
- ✅ Team/call detail pages (account scoped, name edit added)
- ✅ HubSpot OAuth + sync (attribution bug found and fixed)
- ✅ Billing gate (trial warning banner added)
- ✅ Email delivery (invite emails working)
- ✅ Rep dashboard isolation (manager onboarding hidden from reps)
- ❌ Fathom OAuth + sync (BLOCKED — awaiting support response)

**Critical fix applied:** HubSpot activities now correctly attributed to OCC user email (john+abc-rep@oneclickcoaching.com), not provider email. See references/hubspot-attribution-fix-2026-05-21.md.

**✅ STRIPE SMOKE TEST COMPLETED (2026-05-25):**

All 7 Stripe API endpoints tested and passing on production (app.oneclickcoaching.com):

| Endpoint | Result |
|---|---|
| `/api/stripe/create-checkout-session` | ✅ 401 (auth required) |
| `/api/stripe/create-portal-session` | ✅ 401 (auth required) |
| `/api/stripe/manage-subscription` | ✅ 401 (auth required) |
| `/api/stripe/update-subscription` | ✅ 401 (auth required) |
| `/api/stripe/billing-history` | ✅ 401 (auth required) |
| `/api/stripe/config-status` | ✅ 401 (auth required) |
| `/api/webhooks/stripe` | ✅ 405 (POST-only, deployed) |

Environment verified: all 4 Stripe env vars present in Vercel production (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL).

Billing UI verified in code: rep count adjuster, cancel/reactivate, portal link, trial days display, billing history with PDF links, past-due/grace warnings — all present.

Two May 21 billing bugs confirmed fixed: missing cancel/add buttons, missing trial notification.

**Remaining gap:** Webhook → database flow cannot be tested without a real paid transaction (requires actual Stripe checkout completion to trigger the webhook). Code path is complete — webhook handler parses all Stripe events, billing gate reads subscription_status from DB. This is the only untestable piece.

No new bugs found. Stripe integration is revenue-ready.

Full test plan: `docs/stripe-smoke-test-plan-2026-05-24.md`

**See:** `/docs/DEPLOYMENT-READINESS.md` for detailed sequence and `/docs/FATHOM-OAUTH-BLOCKER.md` for resolution steps.

### 2026-05-26 — RAG Methodology-Agnostic Refactor ✅ COMPLETE

**All 6 methodologies seeded and searchable. System is methodology-agnostic end-to-end.**

#### Migration (098_methodology_agnostic_kb.sql)
- Added `methodology` column to `Sandler_Knowledge_Base`
- Rewrote `search_sandler_content` with `filter_methodology` parameter
- Updated `find_scripts_for_weakness` with methodology filter
- Applied via Supabase SQL editor

#### Code Changes (6 files)
| File | Change |
|---|---|
| `_shared/rag-utils.ts` | `ragSearch()` accepts `methodology`. Added `normalizeMethodology()`, `getMethodologyLabel()`. Removed Sandler-only `COMPONENT_NAME_MAP`. |
| `_shared/methodology-seed-data.ts` | **New.** 5 methodology knowledge bases: Challenger, SPIN, Gap, MEDDIC, MEDDPICC |
| `analyze-call/index.ts` | `if (methodologyConfig.id === "sandler")` → `if (use_rag)` — RAG fires for ALL methodologies |
| `rag-search/index.ts` | All 3 actions accept/pass `methodology` filter |
| `seed-knowledge-base/index.ts` | Accepts `{"methodology":"challenger"}` or `{"methodology":"all"}`. Per-methodology seeding. |
| `send-coaching-email/index.ts` | Manager-approved coaching inserts now carry `methodology` |

#### Knowledge Base (128 entries)
| Methodology | Entries | Search Test |
|---|---|---|
| Sandler | 64 | "upfront contract" → 0.609 ✓ |
| Challenger | 13 | "commercial insight" → 0.676 ✓ |
| SPIN | 13 | "implication questions" → 0.510 ✓ |
| Gap | 13 | "diagnose before prescribe" → 0.582 ✓ |
| MEDDIC | 13 | "economic buyer" → 0.611 ✓ |
| MEDDPICC | 12 | "paper process" → 0.560 ✓ |

#### Known Issue
~~SUPABASE_SERVICE_ROLE_KEY mismatch~~ **FIXED 2026-05-26:** Migrated to new JWT signing keys. Created `INTERNAL_API_KEY` secret for internal bearer auth (Supabase protects `SUPABASE_` prefix). Functions deployed with `--no-verify-jwt` — gateway JWT off, internal bearer handles auth. All 6 methodology searches verified with authenticated calls.

## Useful Hermes Requests

- `show deployment readiness status`
- `what are the deployment blockers?`
- `continue with smoke tests` (after deployment)
- `check what is built vs deployed vs proven`
