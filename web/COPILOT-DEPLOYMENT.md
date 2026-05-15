# Copilot Deployment Guide

## ✅ What We Built

### 1. Database Schema
**File:** `supabase/migrations/20260511_copilot_tables.sql`
- `Copilot_Interactions` table (stores all chat interactions)
- `Copilot_Feedback` table (stores 👍/👎 feedback)
- Row Level Security policies (users can only see their account's data)
- Indexes for performance

### 2. API Routes
**Files:**
- `app/api/copilot/chat/route.ts` - Handles chat messages
- `app/api/copilot/feedback/route.ts` - Handles feedback

**Features:**
- Intent matching using Claude
- Response generation with Sandler methodology
- Database logging
- User authentication check

### 3. UI Component
**File:** `components/CopilotChat.tsx`
- Floating "Sandler Coach" button in bottom-right
- Chat modal with conversation history
- Real-time responses from Claude
- 👍/👎 feedback buttons
- Markdown formatting for responses

### 4. Integration
**File:** `app/(app)/layout.tsx`
- Copilot widget added to app layout
- Available on all pages inside the app

### 5. Intent Logic
**File:** `lib/sales-copilot-intents.json`
- 9 Sandler methodology intents
- Sample utterances for intent matching
- Response templates for Claude

## 📋 Deployment Checklist

### Step 1: Run Database Migration

```bash
cd ~/oneclickcoaching

# If you have Supabase CLI installed locally:
npx supabase migration up

# Or apply via Supabase Dashboard:
# 1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
# 2. Copy contents of supabase/migrations/20260511_copilot_tables.sql
# 3. Paste and run
```

**Verify:**
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'Copilot%';

-- Should return: Copilot_Interactions, Copilot_Feedback
```

### Step 2: Add Environment Variable

**Option A: Via Vercel CLI**
```bash
cd ~/oneclickcoaching/web

# Get your Anthropic API key from: https://console.anthropic.com/
vercel env add ANTHROPIC_API_KEY

# When prompted:
# - Value: sk-ant-your-key-here
# - Environments: Production, Preview, Development (select all)
```

**Option B: Via Vercel Dashboard**
1. Go to https://vercel.com/your-team/oneclickcoaching-xeso/settings/environment-variables
2. Add new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (your key)
   - **Environments:** Production, Preview, Development

### Step 3: Test Locally

```bash
cd ~/oneclickcoaching/web

# Make sure environment variables are pulled
vercel env pull .env.local

# Run dev server
npm run dev

# Open http://localhost:3000
# Log in
# Look for floating "Sandler Coach" button in bottom-right
```

**Test cases:**
1. Click the button - chat should open
2. Type "help" - should show help menu
3. Ask "give me pain funnel questions" - should get Sandler coaching
4. Click 👍 - feedback should be saved
5. Check Supabase dashboard - interaction should be logged

### Step 4: Deploy to Production

```bash
cd ~/oneclickcoaching/web

# Commit all changes
git add -A
git commit -m "Add Sandler coaching copilot to app dashboard

Features:
- Real-time Sandler methodology coaching
- Floating chat widget available on all pages
- Intent matching with Claude
- Database logging of interactions and feedback
- 9 Sandler intents with response templates

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to trigger Vercel deployment
git push
```

**Monitor deployment:**
```bash
# Watch deployment status
vercel list

# Check logs after deployment
vercel logs
```

### Step 5: Verify Production

1. Visit https://oneclickcoaching-xeso.vercel.app
2. Log in with your account
3. Look for "Sandler Coach" button
4. Test a few questions
5. Check Supabase dashboard for logged interactions

## 🧪 Test Questions

Try these to verify it's working:

**Getting Started:**
- "Give me an upfront contract"
- "How should I start a Sandler call?"

**Pain & Discovery:**
- "Give me pain funnel questions"
- "How do I go deeper on pain?"

**Objections:**
- "They asked for pricing early"
- "They said too expensive"
- "They said we'll think about it"

**Decision & Close:**
- "How do I find the decision maker?"
- "They said send a proposal"
- "How do I set a clear next step?"

## 🔍 Troubleshooting

### Copilot button doesn't appear
- Check that you're logged in
- Check browser console for errors
- Verify CopilotChat component is in layout.tsx

### "Unauthorized" error
- Check Supabase auth is working
- Verify cookies are being set correctly
- Check network tab for 401 responses

### No response from copilot
- Check ANTHROPIC_API_KEY is set in Vercel
- Check Vercel function logs: `vercel logs`
- Verify Anthropic API key is valid

### Database errors
- Check migration ran successfully
- Verify tables exist in Supabase
- Check RLS policies are active

### Intent matching fails
- Check intents JSON is loaded correctly
- Verify Claude API is responding
- Check question format in API route

## 📊 Monitoring

### Check Usage
```sql
-- Total interactions
SELECT COUNT(*) FROM Copilot_Interactions;

-- Interactions by user
SELECT user_email, COUNT(*) as question_count
FROM Copilot_Interactions
GROUP BY user_email
ORDER BY question_count DESC;

-- Most common intents
SELECT intent_matched, COUNT(*) as count
FROM Copilot_Interactions
WHERE intent_matched IS NOT NULL
GROUP BY intent_matched
ORDER BY count DESC;

-- Helpfulness ratio
SELECT
  COUNT(CASE WHEN helpful = true THEN 1 END) as thumbs_up,
  COUNT(CASE WHEN helpful = false THEN 1 END) as thumbs_down,
  ROUND(
    COUNT(CASE WHEN helpful = true THEN 1 END)::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100,
    1
  ) as helpful_percentage
FROM Copilot_Feedback;
```

### Vercel Metrics
```bash
# Check function invocations
vercel logs --function=/api/copilot/chat

# Check for errors
vercel logs --level=error
```

## 🎯 Success Criteria

The copilot is working well if:
- ✅ Response time < 3 seconds
- ✅ Helpfulness > 70% (👍 ratio)
- ✅ Reps use it during live calls
- ✅ Intent matching accuracy > 80%
- ✅ No authentication errors

## 🔄 What's Next

### Phase 2 Enhancements:
1. **Chat history** - Save conversation across sessions
2. **Manager analytics** - Dashboard showing usage patterns
3. **Contextual awareness** - Know which call is being viewed
4. **Quick actions** - "Copy to clipboard" button
5. **Voice input** - Speak questions during calls
6. **Suggested questions** - Show common questions as chips

---

**Ready to deploy?** Follow the checklist above!
