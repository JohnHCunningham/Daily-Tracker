# One Click Coaching System Audit

Date: 2026-05-04  
Scope: deployed app shell, local `web` app code, Supabase functions/migrations, Stripe billing code, and the separate current website repo at `/Users/johncunningham/one-click-coaching-website`.

Important repository split:
- `oneclickcoaching/web` is the authenticated product app.
- `oneclickcoaching/web/components/*` contains an old landing page and should not be treated as the current website.
- The current website source of truth is `/Users/johncunningham/one-click-coaching-website`, a static HTML repo. Its local remote currently points to `JohnHCunningham/one-click-coaching-website.git`; the repo URL provided on 2026-05-04 is `JohnC-Auto/one-click-coaching-website.git`.

## Executive Summary

The product is not ready to ship as a paid multi-tenant SaaS yet. The public marketing site and basic auth pages are live enough for inspection, but the app has several ship-blocking product gaps:

- Team invitations cannot complete in the `web` app because `/api/send-invite` and `/api/accept-invite` are referenced but not implemented there.
- The app links to `/notes`, but no `/notes` route exists in `web`, so 1-on-1 notes are broken.
- Cross-rep visibility is not consistently enforced in page code. Some screens rely on Supabase RLS to save them, while their own queries and UI allow access by arbitrary `memberId` or `callId`.
- Integration flows are internally inconsistent: HubSpot UI stores `api_key`, but the sync function expects OAuth `access_token`; Aircall UI stores a base64 combined key, but the sync function expects `api_key` plus `api_secret`.
- Edge Functions use the service-role key and accept caller-supplied `account_id` / `call_id` without proving the authenticated user belongs to that account.
- Stripe exists in code, but it is not fully ship-ready: env docs are incomplete, price IDs are hardcoded fallbacks, checkout can be bypassed, and expired/canceled subscriptions are only bannered, not gated.
- The April PDF audit says the app was “~85% built” and blocked by DNS, production migrations, Stripe, and multi-tenant security. As of this audit, some deployment/billing code has moved forward, but security, onboarding, integrations, and billing gating remain the blockers.

## Browser Evidence

Screenshots from Playwright are in `web/output/playwright/oneclickcoaching/`.

| Evidence | Result | Screenshot |
|---|---|---|
| Current static website nav | Pass: homepage, pricing, blog, sign-in link loaded on the deployed marketing site | `01-homepage-desktop.png`, `02-pricing.png`, `03-blog.png` |
| Auth pages | Pass: signup/login/forgot-password render | `04-signup.png`, `05-login-invalid.png`, `07-forgot-password.png` |
| Invalid login | Pass: shows `Invalid login credentials` and returns button to `Sign In` | `05-login-invalid.png` |
| Mobile marketing nav | Fail: mobile shows logo + Sign In only; no menu for Platform, Methodologies, For Teams, Pricing, Blog | `06-mobile-homepage.png` |
| 1-on-1 Notes | Fail: deployed `/notes` returns 404 | `08-notes-missing.png` |
| Invite page without token | Expected failure state exists | `09-accept-invite-no-token.png` |

Also confirmed by HTTP: deployed `POST https://oneclickcoaching-xeso.vercel.app/api/accept-invite` returns `404`.

## Ship Blockers

### 0. Separate app and website deployment decisions

The current website is not the landing code inside `oneclickcoaching/web`. The static website repo has the real public pages:

- `/Users/johncunningham/one-click-coaching-website/index.html`
- `/Users/johncunningham/one-click-coaching-website/pricing.html`
- `/Users/johncunningham/one-click-coaching-website/blog.html`
- `/Users/johncunningham/one-click-coaching-website/security.html`
- `/Users/johncunningham/one-click-coaching-website/privacy.html`
- `/Users/johncunningham/one-click-coaching-website/terms.html`

Required:
- Keep `www.oneclickcoaching.com` pointed at the static website repo.
- Put the authenticated app at `app.oneclickcoaching.com` or another clear app host.
- Do not route production marketing traffic to `oneclickcoaching/web` landing components.
- Align CTAs between website and app once Stripe/onboarding is ready.

### 1. Team invitations are broken

`TeamPage` creates an `Invitations` row, then calls `/api/send-invite`, but no such route exists under `web/app/api`.

Evidence:
- `web/app/(app)/team/page.tsx:135` inserts into `Invitations`.
- `web/app/(app)/team/page.tsx:149` calls `/api/send-invite`.
- `web/app/(auth)/accept-invite/page.tsx:113` calls `/api/accept-invite`.
- `web/app/api` only contains auth callback, chat, Stripe, and Stripe webhook routes.

Impact: paid accounts cannot reliably add reps. This directly blocks your “not see any other reps info” concern because no real team lifecycle can be verified until invite acceptance works.

Required:
- Add `web/app/api/send-invite/route.ts`.
- Move or recreate the existing `landing-page/app/api/accept-invite/route.ts` into `web/app/api/accept-invite/route.ts`.
- Add tests for invite create, email send, accept, expired token, reused token, existing-user accept.

### 2. 1-on-1 Notes is linked but not built

The sidebar and dashboard link to `/notes`, and member profiles link to `/notes?rep=...`, but no route exists.

Evidence:
- `web/app/(app)/components/Sidebar.tsx` includes `/notes`.
- `web/app/(app)/dashboard/page.tsx:986` links to `/notes`.
- `web/app/(app)/team/[memberId]/page.tsx:423` links to `/notes?rep=...`.
- Playwright screenshot `08-notes-missing.png` shows production 404.

Required:
- Build `/app/(app)/notes/page.tsx`.
- Enforce role behavior: reps see only their own notes/messages; managers/coaches see scoped reps in their account.
- Back it with `Direct_Messages` and/or `Manager_Notes` consistently.

### 3. Cross-rep and cross-account access is not consistently enforced in app code

`team/[memberId]` loads a user by id before checking the current user’s account, then uses that member email to query scores/goals/coaching. Role update allows changing any loaded member role if RLS permits it.

Evidence:
- `web/app/(app)/team/[memberId]/page.tsx:64` loads from `Users` by `id` only.
- `web/app/(app)/team/[memberId]/page.tsx:94` scopes scores to current user account, but uses an email from the initially loaded member.
- `web/app/(app)/team/[memberId]/page.tsx:217` updates `Users.role` by member id only.
- `web/app/(app)/calls/[callId]/page.tsx:63` loads a call by `id` only.
- `web/app/(app)/calls/[callId]/page.tsx:80` loads HubSpot activities by `rep_email` and date without `account_id`.

Required:
- Every app query must start from the authenticated user’s `account_id` and role.
- Team member detail must use `.eq('account_id', currentUser.account_id)` and reject reps unless `member.email === currentUser.email`.
- Call detail must use `.eq('account_id', currentUser.account_id)` and, for reps, `.eq('rep_email', currentUser.email)`.
- Role changes must be server-side or RPC-only and restricted to admins/managers as intended.
- Add regression tests for two accounts and two reps.

### 4. Integration flows will not sync as written

HubSpot:
- UI saves `api_key` at `web/app/(app)/integrations/hubspot/page.tsx:72`.
- Sync function reads `access_token, token_expires_at` at `supabase/functions/hubspot-sync/index.ts:29`.

Aircall:
- UI stores `btoa(apiId:apiToken)` in `api_key` at `web/app/(app)/integrations/aircall/page.tsx:69`.
- Sync function reads `api_key, api_secret` and then base64-encodes them again at `supabase/functions/aircall-sync/index.ts:47`.

Sync security:
- HubSpot sync accepts arbitrary `account_id` at `supabase/functions/hubspot-sync/index.ts:172`.
- Analyze-call accepts arbitrary `account_id` in batch mode at `supabase/functions/analyze-call/index.ts:266`.
- These functions use `SUPABASE_SERVICE_ROLE_KEY`, so they bypass RLS.

Required:
- Pick OAuth or API-key mode per provider and make UI, schema, and function agree.
- Validate the JWT in every callable Edge Function.
- Derive `account_id` from the authenticated user, not request body.
- Use a server-side encrypted secret store or Supabase Vault pattern for integration credentials.

### 5. Stripe is present but not production-safe yet

Known from your note, but the audit confirms it:

- `.env.example` only documents `OPENAI_API_KEY`; it omits Supabase, Stripe, webhook, Resend, app URL, and analytics variables.
- `web/lib/stripe.ts:25` and `web/lib/stripe.ts:26` include hardcoded fallback price IDs.
- Signup falls back to `/dashboard` if checkout fails, so users can enter the app without billing completing.
- `SubscriptionBanner` only shows warnings to admins and does not gate app usage for expired/canceled/past-due accounts.

Required:
- Remove hardcoded production price ID fallbacks.
- Document all required env vars.
- Add Stripe webhook idempotency and event logging.
- Decide policy: allow trial before payment, or require checkout first. Implement that policy explicitly.
- Gate app features when trial expired, subscription canceled, or payment past due.

## Important Non-Blockers

- `npm run build` passes.
- `npm run lint` is not configured; `next lint` prompts interactively. Add an ESLint config so CI can lint non-interactively.
- Marketing analytics uses placeholder `G-XXXXXXXXXX`, which causes noisy Google Analytics requests and incorrect reporting.
- Main `web/app/page.tsx` redirects to `https://www.oneclickcoaching.com`, so this repo’s `web` app is deployed as the auth/app host, not the marketing source of truth.

## What To Add Before Shipping

### Product

- Working team invite lifecycle.
- Working 1-on-1 notes.
- Manager/coach/admin role matrix with server-enforced permissions.
- Rep-only experience that cannot access other reps’ calls, goals, coaching, notes, or celebrations.
- Empty states seeded by real onboarding steps, not just blank dashboards.
- In-app “connect integration” success/failure states that reflect actual sync output.

### Billing

- Stripe checkout, portal, webhook verification, subscription update, and cancellation tested end-to-end.
- Trial expiration and subscription status feature gating.
- Rep-seat enforcement tied to Stripe quantity.
- Billing event log in database for support/debugging.

### Integrations

- HubSpot OAuth or API-key strategy completed.
- Fathom API-key flow verified against real data.
- Aircall credentials storage fixed.
- Sync functions authenticated and account-scoped.
- Daily cron verified in Supabase production.
- Sync logs visible in the UI.

### Security

- Server-side authorization on every mutation.
- RLS policies audited against the current migrations, not historical migrations.
- Callable Edge Functions validate JWT and derive account scope.
- Integration credentials encrypted and never written directly by browser clients.
- Tests for cross-account and cross-rep isolation.

### Operations

- Complete `.env.example`.
- Non-interactive lint config.
- CI for build, lint, type check, migrations, and Playwright smoke tests.
- Production smoke test after deployment.
- Error monitoring and audit logs for auth, billing, sync, and AI analysis.

## Recommended Ship Plan

1. Fix team invite and notes routes.
2. Lock down data access by role and account in app code and Edge Functions.
3. Make Stripe the source of truth for plan/seat status.
4. Fix integration credential/schema mismatches.
5. Add a Playwright suite with two-account fixtures: admin, manager, coach, rep A, rep B.
6. Run a real production pilot with one account, two reps, one manager, one connected integration, and one Stripe checkout.

## Verification Commands Run

```bash
npm run build
npx --yes playwright screenshot https://oneclickcoaching-xeso.vercel.app/notes web/output/playwright/oneclickcoaching/08-notes-missing.png
npx --yes playwright screenshot https://oneclickcoaching-xeso.vercel.app/accept-invite web/output/playwright/oneclickcoaching/09-accept-invite-no-token.png
curl -i -s -X POST https://oneclickcoaching-xeso.vercel.app/api/accept-invite -H 'content-type: application/json' -d '{"token":"audit","authId":"audit"}'
```
