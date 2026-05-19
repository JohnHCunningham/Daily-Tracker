# John Dashboard: OCC Product / App

This file is a chat-readable product dashboard for the One Click Coaching app.

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

- UI connect page exists
- OAuth start/callback route exists
- Connection row is created/updated
- Sync function deployed
- Required DB fields/migration applied
- Real Fathom connect flow completed
- Sync Now produces conversation rows with transcript text
- Logs reviewed for failed recording/transcript/summary calls

## Latest Verification

### 2026-05-19 — Product Routes Audit Item

Verified locally from `/Users/johncunningham/oneclickcoaching/web`:

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

## Deployment Status

**Ready to deploy:**
- ✅ Aircall removed (committed: 9ee70da)
- ✅ Auth hardening complete (committed: 9a48266)
- ✅ Migrations 095, 096, 097 ready
- ✅ Build passes (42 routes)

**Deployment blockers:**
- ❌ OPENAI_API_KEY missing from Vercel production
- ❌ SUPABASE_SERVICE_ROLE_KEY missing from Vercel production
- ❌ DNS: app.oneclickcoaching.com not configured

**See:** `/docs/DEPLOYMENT-READINESS.md` for full checklist and sequence.

**Estimated time:** 3-4 hours for deployment + smoke tests (if config is correct)

## Useful Hermes Requests

- `show deployment readiness status`
- `what are the deployment blockers?`
- `continue with smoke tests` (after deployment)
- `check what is built vs deployed vs proven`
