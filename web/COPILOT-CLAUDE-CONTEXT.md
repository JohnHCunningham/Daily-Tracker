# Sandler Coaching Copilot - Claude Context

## Current Work (May 2026)

Building a real-time Sandler coaching assistant directly into the app dashboard.

## Quick Links

- **Full Architecture:** See `COPILOT-INTEGRATION.md`
- **Repo Comparison:** See `../REPO-STRUCTURE.md`

## What's Built

- ✅ Database schema: `supabase/migrations/20260511_copilot_tables.sql`
- ✅ Intents JSON: `lib/sales-copilot-intents.json` (9 Sandler intents)
- ✅ Chat API: `app/api/copilot/chat/route.ts`
- ✅ Feedback API: `app/api/copilot/feedback/route.ts`

## What's Next

- ⏳ Build chat UI component (`components/CopilotChat.tsx`)
- ⏳ Add floating widget to app layout
- ⏳ Run Supabase migration to create tables
- ⏳ Deploy and test

## Key Decisions

1. **Why app, not Slack?** - Reps are already in the dashboard, reduces context-switching
2. **Why Claude, not OpenAI?** - Better at nuanced methodology coaching
3. **Why Supabase, not Neon?** - App uses Supabase, keep data in one place

## Environment Variables Needed

```bash
ANTHROPIC_API_KEY=sk-ant-...  # Add to Vercel
```

## Testing Plan

1. Run migration locally: `npx supabase migration up`
2. Test chat API: Ask "give me pain funnel questions"
3. Verify database logging works
4. Test feedback buttons (👍/👎)
5. Deploy to Vercel production

## Success Criteria

- Response time < 3 seconds
- Responses follow Sandler methodology
- 👍 feedback > 70%
- Reps use it during live calls

## Important Notes

- **NOT the same as `/api/chat`** - that's the lead-gen chatbot
- **NOT a Slack bot** - we pivoted from that approach
- **Copilot = coaching assistant for authenticated users inside the app**
