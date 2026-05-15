# Sales Copilot Integration - Architecture Document

## Overview

This document explains the copilot integration to ensure we're building the right thing in the right place.

## The Confusion: Two Different Chatbots

We currently have **TWO separate chatbots** serving different purposes:

### 1. **Landing Page Chatbot** (Existing - `/api/chat`)
- **Location:** `one-click-coaching-website` repo → www.oneclickcoaching.com
- **Purpose:** Lead generation and sales qualification
- **AI Model:** OpenAI GPT-4o-mini
- **Functionality:**
  - Answers questions about OCC pricing, features, security
  - Qualifies leads (team size, methodology, pain points)
  - Captures contact info (name, email, company)
  - Directs prospects to book demos
- **Users:** Website visitors (prospects, not customers)
- **Status:** ✅ Already built and working

### 2. **Sandler Coaching Copilot** (New - `/api/copilot`)
- **Location:** `oneclickcoaching` repo → oneclickcoaching-xeso.vercel.app (the app)
- **Purpose:** Real-time Sandler methodology coaching for sales reps
- **AI Model:** Claude Sonnet 4
- **Functionality:**
  - Answers Sandler methodology questions during live calls
  - Provides pain funnel questions, objection handling, upfront contracts
  - Matches user questions to 9 Sandler intents
  - Gives concise, actionable coaching advice
- **Users:** Paying customers (reps and managers inside the app)
- **Status:** 🚧 Currently building

## Why Build in the App (Not the Website)?

The Sandler Coaching Copilot belongs in the **app dashboard** because:

1. **Context:** Reps are already in the dashboard when they need coaching help
2. **Auth:** Only authenticated, paying customers should access it
3. **Data:** Integrates with existing Supabase data (Users, Accounts, etc.)
4. **UX:** Avoids context-switching - coach reps where they already work
5. **Analytics:** Track usage per account, measure helpfulness, improve over time

## Architecture

### Database (Supabase)

```sql
-- Track all copilot interactions
Copilot_Interactions
  - id (UUID)
  - account_id (references Accounts)
  - user_id (references Users)
  - user_email
  - question (what the user asked)
  - intent_matched (which Sandler intent matched)
  - response (what the copilot answered)
  - created_at

-- Track helpfulness feedback
Copilot_Feedback
  - id (UUID)
  - interaction_id (references Copilot_Interactions)
  - user_id
  - intent_name
  - helpful (boolean - 👍 or 👎)
  - created_at
```

### API Routes

- **POST /api/copilot/chat** - Send question, get Sandler coaching response
- **POST /api/copilot/feedback** - Submit 👍/👎 feedback on a response

### Frontend Component

- **Floating chat widget** - Available on all app pages
- Positioned in bottom-right corner (like Intercom)
- Opens a chat modal with conversation history
- Shows thumbs up/down buttons after each response

## Intent Matching System

The copilot uses 9 Sandler methodology intents:

1. `upfront_contract` - Setting expectations at call start
2. `explore_pain` - Pain funnel questions
3. `pain_depth` - Going deeper on pain
4. `budget_early` - Handling early pricing questions
5. `objection_expensive` - "Too expensive" objection
6. `objection_think` - "We'll think about it" objection
7. `decision_maker` - Finding who makes decisions
8. `send_proposal` - When they ask for a proposal
9. `set_next_step` - Creating clear next steps

Each intent has:
- Sample user utterances (training examples)
- Bot behavior description
- Response templates for Claude to use

## Data Flow

```
User asks question
  ↓
POST /api/copilot/chat
  ↓
Authenticate user (Supabase auth)
  ↓
Match question to intent (Claude)
  ↓
Generate response (Claude)
  ↓
Save to Copilot_Interactions table
  ↓
Return response + interaction ID
  ↓
User gives 👍/👎 feedback
  ↓
POST /api/copilot/feedback
  ↓
Save to Copilot_Feedback table
```

## What We're Building

### Phase 1: Core Functionality (Current)
- ✅ Database schema (Copilot_Interactions, Copilot_Feedback)
- ✅ API routes (/api/copilot/chat, /api/copilot/feedback)
- ⏳ Chat UI component (floating widget)
- ⏳ Integration into app layout

### Phase 2: Enhanced Features (Future)
- Chat history (show previous questions from this session)
- Manager analytics (which intents are used most, helpfulness by rep)
- Contextual coaching (aware of current call being viewed)
- Voice integration (dictate questions during calls)

## Verification Checklist

Before deploying, verify:
- [ ] Supabase migration ran successfully
- [ ] API routes accessible only to authenticated users
- [ ] Row Level Security policies prevent cross-account access
- [ ] Claude API key configured in environment variables
- [ ] Chat widget appears in app dashboard
- [ ] Responses are helpful and follow Sandler methodology
- [ ] Feedback buttons work and save to database

## Environment Variables Required

```bash
# Already configured
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Need to add
ANTHROPIC_API_KEY=sk-ant-...
```

## Next Steps

1. Run Supabase migration to create tables
2. Add ANTHROPIC_API_KEY to Vercel environment variables
3. Build chat UI component
4. Add floating widget to app layout
5. Test with real Sandler questions
6. Deploy to production
7. Monitor usage and feedback

## Success Metrics

How we'll know it's working:
- Reps use it during live calls (not just testing)
- Average helpfulness > 70% (👍 ratio)
- Response time < 3 seconds
- Managers report improved Sandler execution
- Reduced "how do I..." questions in team Slack

---

**TL;DR:** We're building a Sandler coaching assistant INSIDE the app dashboard (not the landing page). Reps can ask for help during calls and get instant, methodology-specific advice. Completely separate from the lead-gen chatbot on the website.
