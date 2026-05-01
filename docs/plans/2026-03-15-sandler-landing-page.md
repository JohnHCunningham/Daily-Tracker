# Project Plan: Standalone Sandler Landing Page

**Date:** 2026-03-15
**Route:** oneclickcoaching.com/sandler
**Status:** Planning

---

## Objective

Build a standalone landing page at `/sandler` that speaks directly to Sandler-trained sales teams and Sandler franchise owners. This page replaces the generic methodology-agnostic messaging with Sandler-specific language, pain points, and proof — making it the URL you hand to a Sandler franchise owner or VP Sales who went through Sandler training.

---

## What Already Exists

- `landing-page/app/sandler/page.tsx` — A Sandler resource page already exists (needs review for current state)
- `landing-page/app/blog/` — 9 Sandler thought leadership posts
- 8-component Sandler scoring framework built into the product (Upfront Contract, Pain Funnel, Budget, Decision Process, Fulfillment, Post-Sell, Bonding & Rapport, Negative Reverse Selling)
- 50+ contextual coaching scripts library
- `SANDLER-REVENUE-FACTORY-START-HERE.md` — Full product plan
- `OBJECTION-HANDLING-GUIDE.md` — Sales messaging, objection handling, competitive positioning
- `OPENING-EMAIL-SANDLER.md` — Outreach email template
- OCC client profile in marketing-orchestrator with Sandler-specific ICP

---

## Page Structure

### Section 1: Hero
- Headline targeting the core pain: methodology training drift under pressure
- Sub-headline naming Sandler specifically — "Your team learned the Sandler System. But are they using it on every call?"
- CTA: Book a demo / See how it works
- Trust signal: "Built for Sandler-trained teams"

### Section 2: The Problem (Specificity)
- The training-to-execution gap: reps revert to old patterns under quota pressure
- Managers can't listen to every call
- Coaching is delayed, generic, or inconsistent
- The Sandler submarine gets abandoned mid-call and nobody catches it
- Use language from the ICP profile and objection handling guide

### Section 3: How OCC Works (Sandler-Specific)
- Show the 8-component scoring system by name
- Visual of a scored call with Sandler methodology breakdown
- Daily automated analysis → coaching suggestion → manager approval → rep receives within 24 hours
- Emphasize: AI trained on Sandler methodology, not generic sales tips

### Section 4: The 8 Sandler Components Scored
- Visual grid or cards showing each component:
  1. Upfront Contract
  2. Pain Funnel
  3. Budget
  4. Decision Process
  5. Fulfillment
  6. Post-Sell
  7. Bonding & Rapport
  8. Negative Reverse Selling
- Brief description of what each measures
- Example: "Did the rep establish a clear upfront contract before diving into discovery?"

### Section 5: For Franchise Owners (White-Label)
- "Offer AI coaching intelligence to every team you've trained"
- White-label: your brand, your colors, your logo
- Revenue model: wholesale at $150/user, resell at your price
- Extends the training relationship beyond the initial engagement
- Solves the "training drift" problem that erodes franchise value

### Section 6: Social Proof / Thought Leadership
- Link to the 9 Sandler blog posts
- Pull key stats from the objection handling guide ($210K-370K value per 10-rep team)
- Testimonials (when available)

### Section 7: Pricing
- Direct: $299/user/month (or current pricing)
- Franchise/Wholesale: $150/user/month
- "Free pilot for qualified Sandler teams"

### Section 8: CTA / Contact
- Book a demo form
- "See your team's Sandler scores in 48 hours"

---

## Technical Implementation

- **File:** `landing-page/app/sandler/page.tsx` (update existing)
- **Style:** Use existing OCC design tokens (navy, teal, gold, Plus Jakarta Sans + DM Sans)
- **Components:** Reuse landing page components where possible, create Sandler-specific sections
- **SEO:** Target keywords: "Sandler coaching software", "Sandler sales methodology reinforcement", "AI coaching for Sandler teams"
- **Analytics:** Track separately from main landing page
- **Mobile:** Full responsive (already handled by Next.js + Tailwind setup)

---

## Content Sources

| Content Need | Source |
|---|---|
| Pain language | `references/client-profiles/one-click-coaching.md` (ICP section) |
| Objection handling | `OBJECTION-HANDLING-GUIDE.md` |
| 8 components | `supabase/functions/analyze-call/index.ts` (scoring rubric) |
| Blog content | `landing-page/app/blog/` (9 posts) |
| Product positioning | `SANDLER-REVENUE-FACTORY-START-HERE.md` |
| Brand voice | `founder-bio` skill + `branding.md` |
| Franchise model | `OBJECTION-HANDLING-GUIDE.md` (wholesale pricing section) |

---

## Dependencies

- Main landing page should be deployed first (or simultaneously)
- Blog posts should be live and linkable
- Demo booking flow needs to work (Calendly or similar)

---

## Success Criteria

- Page loads fast, looks premium, feels Sandler-specific (not generic)
- A Sandler franchise owner reading it thinks "this was built for us"
- Clear path to demo booking
- SEO-optimized for Sandler-specific search terms
- Mobile-first responsive design
