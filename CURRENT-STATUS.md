# One Click Coaching — Current Status (Feb 21, 2026)

## What This Is
A standalone Sandler sales coaching management tool for Sandler consultants to resell to their clients at $50/rep/month (consultant marks up). Built with Next.js 14 + Supabase + OpenAI.

## Repo
- **Local:** `/Users/johncunningham/oneclickcoaching`
- **GitHub:** `JohnHCunningham/oneclickcoaching`
- **Branch:** `landing-page` (default)
- **Deploy:** Vercel (needs `oneclickcoaching.com` domain pointed to it)

## Build Status
`npm run build` passes cleanly. **40 routes** compile successfully.

## What's Been Built (Code Complete)

### Infrastructure
1. **White-label foundation** — Migration 056 adds branding fields to Accounts table. BrandProvider React context injects CSS vars. Sidebar shows custom logo/company name.
2. **RAG Knowledge Base** — `Sandler_Knowledge_Base` table (migration 034) with pgvector embeddings. `rag-search` edge function with semantic search. `scripts/seed-knowledge-base.ts` ready to run — seeds all 8 Sandler components, objection handling, best practices with OpenAI embeddings.
3. **Daily Cron Pipeline** — Chains: hubspot-sync → fathom-sync → analyze-call → notify leaders. Aircall removed from the current product scope. Includes `Pipeline_Runs` tracking table.
4. **Non-Repetition Engine** — Migration 058 creates Coaching_Suggestions_Log table. GPT-4 is instructed to not repeat prior suggestions per rep. Escalates recurring weaknesses.

### Frontend Pages (All Compiled)
1. **Radial KPI Dashboard** (`/dashboard`) — Leader view: 5 radial circles, team members table, recent coaching, needs attention alerts. Rep view: personal scores, Sandler breakdown, benchmarks.
2. **Planning & Benchmarks** (`/planning`) — Migration 057 creates Benchmarks table. Leader sets targets per rep or team-wide. Radial progress circles.
3. **Coaching Page** (`/coaching`) — Pending/Sent/Replies tabs. Leader edits and approves before sending.
4. **Settings Page** (`/settings`) — Account name, logo, colors, email from-name.
5. **Team Page** (`/team`) — Team roster, invite modal with role selection, member profiles.
6. **Celebrations Page** (`/celebrations`) — Badges, wins feed, 5 badge types.
7. **Calls Page** (`/calls`, `/calls/[callId]`) — Call history with Sandler scores, individual call analysis.
8. **Integrations Page** (`/integrations`) — HubSpot and Fathom with connect/disconnect/sync UI.
9. **Landing Page** (`/`) — Trimmed, clean marketing page.
10. **Blog** (`/blog`) — Markdown-based, 9 posts.

### Edge Functions (All Complete)
- `analyze-call` — GPT-4o structured Sandler analysis with RAG, fallback to keyword scoring
- `hubspot-sync` — OAuth-based sync of calls, emails, meetings, tasks
- `fathom-sync` — API key-based sync of video call transcripts
- `send-coaching-email` — Resend-based email with HTML template, reply tokens
- `coaching-reply` — Handle email replies to coaching
- `rag-search` — Semantic search, scripts-for-weakness, coaching-context modes
- `generate-embedding` — On-demand embedding generation
- `hubspot-oauth-callback` / `fathom-oauth-callback` — OAuth flow handlers

### Migrations (Written, Not Yet Applied to Production)
- `056_white_label_accounts.sql`
- `057_planning_benchmarks.sql`
- `058_coaching_suggestions_log.sql`
- `059_daily_cron.sql`

## What Still Needs To Be Done

### Deploy Steps (Manual / Ops)
- [ ] Point `oneclickcoaching.com` DNS to Vercel
- [ ] Set env vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`
- [ ] Enable `pg_cron` and `pg_net` extensions in Supabase Dashboard
- [ ] Set database settings for cron: `ALTER DATABASE postgres SET app.supabase_url = '...'` and `app.service_role_key = '...'`
- [ ] Run migrations 056-059: `supabase db push`
- [ ] Deploy edge functions: `supabase functions deploy --all`
- [ ] Configure Resend API key: `supabase secrets set RESEND_API_KEY=...`
- [ ] Run knowledge base seeder: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... OPENAI_API_KEY=... npx ts-node scripts/seed-knowledge-base.ts`
- [ ] Seed demo data or connect live HubSpot/Fathom
- [ ] Git push to trigger Vercel deploy

### Testing After Deploy
- [ ] Test email delivery end-to-end (Resend)
- [ ] Verify coaching-reply endpoint works for rep responses
- [ ] Verify RAG search returns relevant results after seeding
- [ ] Test daily cron fires correctly at 8am EST

### Nice-to-Have (Post-Launch)
- [ ] Cron schedule override in settings UI
- [ ] Stripe billing integration
- [ ] Notification preferences per user
- [ ] Logo file upload (currently URL-based)

## URL Structure
```
oneclickcoaching.com                    → Landing page (public)
oneclickcoaching.com/blog               → Blog (9 posts)
oneclickcoaching.com/login              → Sign in
oneclickcoaching.com/signup             → Create account
oneclickcoaching.com/dashboard          → Radial KPI dashboard (role-aware)
oneclickcoaching.com/calls              → Call history with scores
oneclickcoaching.com/calls/[id]         → Call detail + Sandler analysis
oneclickcoaching.com/coaching           → Review/approve/send coaching (tabbed)
oneclickcoaching.com/planning           → Benchmarks & quota tracking
oneclickcoaching.com/celebrations       → Team wins & badges
oneclickcoaching.com/team               → Team management
oneclickcoaching.com/integrations       → HubSpot, Fathom setup
oneclickcoaching.com/integrations/fathom  → Fathom connect/sync
oneclickcoaching.com/integrations/hubspot → HubSpot connect/sync
oneclickcoaching.com/settings           → Branding, account, email config
```

## Tech Stack
- Next.js 14 (App Router, TypeScript, Tailwind CSS)
- Supabase (Postgres, Edge Functions, RLS, Auth, pg_cron)
- OpenAI GPT-4o (Sandler analysis) + text-embedding-3-small (RAG)
- Chart.js (radial/doughnut KPIs, trend lines)
- Resend (email delivery)
- Vercel (hosting)

## Design Tokens
- Primary: #0C1030 (deep navy)
- Accent: #10C3B0 (teal)
- Aqua: #3DE0D2
- Pink: #E64563
- Gold: #F4B03A
- Fonts: Plus Jakarta Sans (headings), DM Sans (body) — currently using Inter

## Key Files
- `landing-page/app/(app)/dashboard/page.tsx` — Main dashboard
- `landing-page/app/(app)/planning/page.tsx` — Benchmarks
- `landing-page/app/(app)/coaching/page.tsx` — Coaching approval flow
- `landing-page/app/(app)/settings/page.tsx` — White-label settings
- `landing-page/app/(app)/components/ScoreRadial.tsx` — Radial KPI component
- `landing-page/app/(app)/components/BrandProvider.tsx` — White-label context
- `landing-page/app/(app)/components/Sidebar.tsx` — Navigation
- `supabase/functions/analyze-call/index.ts` — GPT-4 Sandler brain
- `supabase/functions/analyze-call/sandler-methodology.ts` — Sandler rubrics + scripts
- `supabase/functions/_shared/rag-utils.ts` — RAG utilities
- `supabase/migrations/059_daily_cron.sql` — Daily coaching pipeline cron
- `scripts/seed-knowledge-base.ts` — RAG knowledge base seeder
- `docs/plans/2026-02-21-mvp-sandler-management-tool.md` — Full plan

## Business Context
- Target: Sandler consultants who resell to their sales teams
- Pricing: $50/rep/month (your wholesale price, consultant marks up)
- Leader approves all coaching before it goes to reps
- 8am Mon-Fri cron: sync → analyze → queue coaching → notify leader
- White-label: consultant can use their own logo/colors
- Key value: deep Sandler methodology analysis that doesn't repeat itself
