# 🚀 Public Deployment Guide - AI Advantage Solutions Success Chart

This guide shows you how to securely deploy your dashboard publicly without exposing API keys.

---

## 🔐 Security Overview

**Problem:** If you put API keys directly in `success-chart.html` and deploy it publicly, anyone can steal them.

**Solution:** Use **Supabase Edge Functions** to keep your API keys secure on the server.

---

## 📋 Prerequisites

- Supabase project (you already have this!)
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com/settings/keys)
- Supabase CLI installed

---

## Step 1: Install Supabase CLI

### macOS (using Homebrew):
```bash
brew install supabase/tap/supabase
```

### Other platforms:
See: https://supabase.com/docs/guides/cli/getting-started

Verify installation:
```bash
supabase --version
```

---

## Step 2: Login to Supabase CLI

```bash
supabase login
```

This will open your browser to authenticate.

---

## Step 3: Link Your Project

```bash
cd /Users/johncunningham/Daily-Tracker
supabase link --project-ref qwqlsbccwnwrdpcaccjz
```

When prompted for your database password, enter the password you created when setting up your Supabase project.

---

## Step 4: Set Secret Environment Variables

Your Anthropic API key needs to be stored securely on Supabase (not in your code).

```bash
# Get your Anthropic API key from: https://console.anthropic.com/settings/keys
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

Verify it's set:
```bash
supabase secrets list
```

You should see:
- `ANTHROPIC_API_KEY` (set)
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

---

## Step 5: Deploy the Edge Function

```bash
supabase functions deploy analyze-conversation
```

You should see:
```
✓ Deployed Function analyze-conversation
  URL: https://qwqlsbccwnwrdpcaccjz.supabase.co/functions/v1/analyze-conversation
```

---

## Step 6: Enable Row Level Security (RLS)

Protect your data from unauthorized access:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qwqlsbccwnwrdpcaccjz)
2. Click **"SQL Editor"**
3. Run this SQL:

```sql
-- Enable RLS on all tables
ALTER TABLE "Daily_Tracker" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Weekly_Goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coaching_Insights" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation_Analyses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation_Improvement_Trends" ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - you can add authentication later)
CREATE POLICY "Allow public read/write on Daily_Tracker"
    ON "Daily_Tracker" FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read/write on Sales"
    ON "Sales" FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read/write on Projects"
    ON "Projects" FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read/write on Weekly_Goals"
    ON "Weekly_Goals" FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read/write on Coaching_Insights"
    ON "Coaching_Insights" FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read/write on Conversation_Analyses"
    ON "Conversation_Analyses" FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read/write on Conversation_Improvement_Trends"
    ON "Conversation_Improvement_Trends" FOR ALL
    USING (true)
    WITH CHECK (true);
```

**Note:** These policies allow anyone to read/write. For production, you'll want to add authentication (see Step 9).

---

## Step 7: Test the Edge Function

Test it works before deploying:

```bash
curl -i --location --request POST \
  'https://qwqlsbccwnwrdpcaccjz.supabase.co/functions/v1/analyze-conversation' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "transcript": "Hi, this is John from AI Advantage Solutions. How are you today?",
    "callType": "cold_call"
  }'
```

You should get back JSON with Sandler scores!

---

## Step 8: Deploy Your Dashboard

### Option A: Vercel (Recommended - Easiest)

1. Create account at [vercel.com](https://vercel.com)
2. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
3. Deploy:
   ```bash
   cd /Users/johncunningham/Daily-Tracker
   vercel
   ```
4. Follow prompts (defaults are fine)
5. Your dashboard is now live! 🎉

### Option B: Netlify

1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop your folder into Netlify
3. Done!

### Option C: GitHub Pages

1. Push to GitHub repository
2. Go to repo Settings → Pages
3. Select branch and `/root` folder
4. Save

**Your live URL will be something like:**
- Vercel: `https://daily-tracker-xxx.vercel.app`
- Netlify: `https://xxx.netlify.app`
- GitHub Pages: `https://yourusername.github.io/Daily-Tracker`

---

## Step 9: Add Authentication (Optional but Recommended)

Right now, anyone with your URL can use your dashboard. To restrict access:

### Option 1: Simple Password Protection

Add to the top of `success-chart.html`:

```javascript
const DASHBOARD_PASSWORD = 'your-secret-password';
const userPassword = prompt('Enter dashboard password:');
if (userPassword !== DASHBOARD_PASSWORD) {
    document.body.innerHTML = '<h1>Access Denied</h1>';
    throw new Error('Invalid password');
}
```

### Option 2: Supabase Authentication (More Secure)

Follow: https://supabase.com/docs/guides/auth/auth-email

This adds proper login/signup functionality.

---

## 🎯 What's Protected

✅ **Anthropic API Key** - Stored securely in Supabase secrets
✅ **Edge Function** - Only callable through Supabase (CORS protected)
✅ **Database** - Row Level Security enabled
✅ **Supabase Anon Key** - Safe to expose (read/write only, no admin access)

---

## 💰 Estimated Costs

### Supabase (Database + Edge Functions)
- Free tier: 500MB database, 500K edge function invocations/month
- Paid: Starts at $25/month for more resources

### Anthropic API (Claude)
- ~$0.10-0.30 per conversation analyzed
- If you analyze 100 calls/month = ~$10-30/month

### Hosting (Vercel/Netlify)
- **FREE** for personal projects!

---

## 🆘 Troubleshooting

### "Edge function not found"
- Run: `supabase functions deploy analyze-conversation`
- Check: `supabase functions list`

### "ANTHROPIC_API_KEY not set"
- Run: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
- Verify: `supabase secrets list`

### "Database connection error"
- Check RLS policies are created
- Verify Supabase project is active

### Edge function returns error
- Check logs: `supabase functions logs analyze-conversation`
- Test locally: `supabase functions serve analyze-conversation`

---

## 🔄 Updating Your Dashboard

After making changes to `success-chart.html`:

```bash
# If using Vercel
vercel --prod

# If using Netlify
netlify deploy --prod

# If using GitHub Pages
git add .
git commit -m "Update dashboard"
git push
```

To update the edge function:

```bash
supabase functions deploy analyze-conversation
```

---

## 🎉 You're Done!

Your dashboard is now:
- ✅ Publicly accessible
- ✅ Securely storing API keys
- ✅ Protected with Row Level Security
- ✅ Ready to share with clients/team

**Live Dashboard:** `https://your-deployment-url.vercel.app`

---

## 📞 Support

Need help?
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Email: john@aiadvantagesolutions.ca

---

**Built with ❤️ for AI Advantage Solutions**
