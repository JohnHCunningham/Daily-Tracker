# Repository Structure - Quick Reference

## Two Separate Projects

You have **TWO completely different projects** with different purposes:

---

## 1. Landing Page / Marketing Site

**Repository:** `one-click-coaching-website`
**GitHub:** https://github.com/JohnHCunningham/one-click-coaching-website
**Vercel:** `one-click-coaching-website` → www.oneclickcoaching.com
**Database:** Neon Postgres

### What It Does
- Static marketing website
- Lead generation chatbot (OpenAI)
- Blog posts about sales methodology
- "Book a Demo" CTAs

### Key Files
- `/index.html` - Homepage
- `/api/copilot-message.js` - Slack bot (NOT FOR WEB APP!)
- `/api/copilot-feedback.js` - Slack bot feedback
- `/sales-copilot-intents.json` - Sandler intents

### What We Built Here (By Mistake)
- ❌ Slack bot for Sandler coaching
  - This was the wrong place! Should have been in the app
  - We copied the intents JSON to the right repo

---

## 2. The Actual App / SaaS Product

**Repository:** `oneclickcoaching`
**GitHub:** https://github.com/JohnHCunningham/oneclickcoaching
**Vercel:** `oneclickcoaching-xeso` → oneclickcoaching-xeso.vercel.app
**Database:** Supabase

### What It Does
- Manager dashboards (team performance, pipeline, coaching)
- Rep dashboards (personal scores, commitments, coaching feed)
- Call analysis with Sandler methodology scores
- Integrations (HubSpot, Fathom, Aircall)
- 1-on-1 notes, goals, celebrations
- **NEW:** Sandler coaching copilot (what we're building now)

### Key Directories
- `/web` - Next.js app
- `/web/app/(app)/dashboard/page.tsx` - Main dashboard
- `/web/app/api/` - API routes
- `/web/components/` - Reusable React components
- `/supabase/migrations/` - Database schema changes

### What We're Building Here (Correct!)
- ✅ Copilot chat API (`/api/copilot/chat`)
- ✅ Copilot feedback API (`/api/copilot/feedback`)
- ✅ Supabase tables (Copilot_Interactions, Copilot_Feedback)
- ⏳ Chat UI component (next step)
- ⏳ Floating widget in app layout

---

## Why This Matters

**Landing Page Repo:**
- For attracting leads
- Public-facing content
- Lead-gen chatbot asks: "How many reps do you have?"

**App Repo:**
- For paying customers
- Behind authentication
- Coaching copilot asks: "Give me pain funnel questions"

---

## Current Work

We are now working in: **`oneclickcoaching` repo**
Building: **Sandler coaching copilot for the app dashboard**
NOT building: Slack bot, landing page features, lead-gen chat

---

## Quick Test

**To verify you're in the right place:**
```bash
pwd
# Should output: /Users/johncunningham/oneclickcoaching/web
```

**If you're in the wrong repo:**
```bash
cd ~/oneclickcoaching/web
```

---

## Visual Comparison

```
┌─────────────────────────────────────────────────────────┐
│ LANDING PAGE (one-click-coaching-website)              │
├─────────────────────────────────────────────────────────┤
│ www.oneclickcoaching.com                                │
│                                                         │
│ [Book a Demo] [Pricing] [Blog]                        │
│                                                         │
│ 💬 Chat Widget: "How can I help you today?"           │
│    → Qualifies leads, captures emails                  │
│    → Uses OpenAI                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ THE APP (oneclickcoaching)                              │
├─────────────────────────────────────────────────────────┤
│ oneclickcoaching-xeso.vercel.app/login                 │
│                                                         │
│ [Dashboard] [Calls] [Goals] [Team] [Settings]         │
│                                                         │
│ 🤖 Copilot Widget: "Ask me about Sandler..."          │
│    → Coaches reps during live calls                     │
│    → Uses Claude                                        │
└─────────────────────────────────────────────────────────┘
```

---

**Bottom Line:** We're building the coaching copilot in the **app repo** (`oneclickcoaching`), not the website repo. Completely separate from the lead-gen chatbot.
