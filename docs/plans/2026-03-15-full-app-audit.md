# Project Plan: Full OCC App Audit

**Date:** 2026-03-15
**Status:** Planning

---

## Objective

Comprehensive audit of the One Click Coaching application — landing page, dashboard, all protected routes, edge functions, database, integrations, and deployment infrastructure. Goal is to identify what's working, what's broken, what's incomplete, and produce a prioritized punch list to get the product deployment-ready.

---

## Current State Summary

- **Stack:** Next.js 14 + TypeScript + Tailwind CSS + Supabase (PostgreSQL + Edge Functions)
- **Routes:** 40 compiled routes
- **Edge Functions:** 14 deployed
- **Database:** 7+ migrations (056-059 pending)
- **Deployment:** Built to Vercel (daily-tracker-xi.vercel.app), DNS not pointed
- **Integrations:** HubSpot, Fathom, Aircall OAuth flows built

---

## Audit Scope

### Phase 1: Frontend — Page-by-Page Review

Test every route in the browser. For each page, check:
- Does it render without errors?
- Is the layout correct on desktop and mobile?
- Do interactive elements work (buttons, forms, tabs, modals)?
- Are there console errors?
- Does it match the OCC brand (navy, teal, Plus Jakarta Sans + DM Sans)?
- Are there placeholder/Lorem ipsum strings?
- Are loading states handled?
- Are empty states handled (no data yet)?

**Pages to audit:**

| Route | What It Does | Priority |
|---|---|---|
| `/` | Marketing landing page | HIGH |
| `/sandler` | Sandler resource page | HIGH |
| `/blog` | Blog index (9 posts) | MEDIUM |
| `/blog/[slug]` | Individual blog posts | MEDIUM |
| `/dashboard` | Radial KPI dashboard (leader + rep views) | HIGH |
| `/calls` | Call history list | HIGH |
| `/calls/[callId]` | Individual call detail with Sandler scores | HIGH |
| `/coaching` | Manager approval inbox (Pending/Sent/Replies) | HIGH |
| `/planning` | Benchmarks and quota tracking | MEDIUM |
| `/celebrations` | Team wins and badges | LOW |
| `/team` | Team roster and member management | MEDIUM |
| `/integrations` | HubSpot, Fathom, Aircall OAuth setup | HIGH |
| `/settings` | White-label branding config | MEDIUM |
| `/goals` | Goal tracking and trends | MEDIUM |
| Auth pages | Login, signup, password reset | HIGH |

### Phase 2: Backend — Edge Functions

For each of the 14 edge functions, verify:
- Does the function deploy without errors?
- Does the TypeScript compile?
- Are environment variables referenced correctly?
- Is error handling present?
- Are API keys/secrets properly scoped?

**Functions to audit:**

| Function | What It Does | Priority |
|---|---|---|
| `analyze-call` | GPT-4o Sandler analysis with RAG fallback | HIGH |
| `send-coaching-email` | Resend email delivery | HIGH |
| `coaching-reply` | Email reply handler | HIGH |
| `hubspot-sync` | HubSpot OAuth + call/email/meeting sync | HIGH |
| `fathom-sync` | Fathom video call transcript sync | MEDIUM |
| `aircall-sync` | Aircall phone recording sync | MEDIUM |
| `rag-search` | Semantic search (multiple modes) | HIGH |
| `generate-embedding` | OpenAI embedding generation | MEDIUM |
| `hubspot-oauth-callback` | HubSpot OAuth handler | HIGH |
| `fathom-oauth-callback` | Fathom OAuth handler | MEDIUM |
| `detect-milestones` | Achievement/badge detection | LOW |
| `seed-knowledge-base` | RAG KB seeding script | MEDIUM |
| Daily cron pipeline | Mon-Fri 8am sync → analyze → queue coaching | HIGH |
| `_shared/` | Shared RAG utilities | HIGH |

### Phase 3: Database

- Review all migrations (especially 056-059 pending ones)
- Check schema completeness: do all tables needed by the app exist?
- Verify RLS (Row Level Security) policies are correct
- Check indexes on frequently queried columns
- Verify pgvector extension is enabled for RAG
- Check that cron jobs are configured (pg_cron)

### Phase 4: Authentication & Authorization

- Login flow works end-to-end
- Signup flow works
- Password reset works
- Protected routes redirect unauthenticated users
- Leader vs rep role separation works correctly
- Team membership scoping (users only see their team's data)

### Phase 5: Integration Health

| Integration | Check |
|---|---|
| HubSpot | OAuth flow completes, token refresh works, data syncs correctly |
| Fathom | OAuth flow completes, transcripts pull correctly |
| Aircall | OAuth flow completes, recordings sync |
| OpenAI | API key valid, analyze-call produces correct 8-component scores |
| Resend | Email delivery works, coaching emails render correctly |
| Pinecone/pgvector | RAG search returns relevant results |
| Supabase | Real-time subscriptions work (if used), storage works |

### Phase 6: Deployment Infrastructure

- Vercel build succeeds
- Environment variables documented and set
- DNS configuration documented (oneclickcoaching.com → Vercel)
- SSL/HTTPS works
- Supabase project is on correct plan for edge functions + cron
- Database migrations can be applied cleanly
- Edge functions deploy via `supabase functions deploy`

### Phase 7: Performance & Security

- Lighthouse score on landing page (target: 90+)
- No exposed API keys in client-side code
- No hardcoded secrets
- CORS configured correctly on edge functions
- Rate limiting on public endpoints
- Input validation on forms
- CSP headers set

---

## Deliverables

1. **Audit Report** — Markdown file with findings per phase, severity ratings (CRITICAL / HIGH / MEDIUM / LOW), and screenshots of issues
2. **Punch List** — Prioritized task list of everything that needs fixing before launch
3. **Deployment Checklist** — Step-by-step guide to go from current state to live at oneclickcoaching.com

---

## Approach

Run the audit phase-by-phase. Use `webapp-testing` skill (Playwright) for frontend verification. Use Supabase CLI for edge function and database checks. Document every finding with file path and line number.

Start with Phase 1 (frontend) and Phase 4 (auth) since those are user-facing. Then backend, database, integrations, deployment, and security.

---

## Known Issues (from prior sessions)

- Migrations 056-059 not yet applied
- DNS not pointed to Vercel
- Environment variables may not be set in Vercel dashboard
- Knowledge base may not be seeded yet
- `.env.local` contains real keys (not committed, but needs to be in Vercel env)
- Pricing in copywriting-app says $50/rep/month but product plan says $150-299/user/month — need to reconcile
