# 🔥 Fireflies.ai Auto-Sync Setup Guide

## Overview
Automatically sync and analyze every sales call transcript from Fireflies with **ZERO manual work**. Every call gets analyzed with your selected methodology within 30 minutes of completion.

---

## 📋 Setup Steps

### Step 1: Run Database Schema
1. Open Supabase SQL Editor
2. Copy all SQL from: `/Users/johncunningham/Daily-Tracker/fireflies-integration-schema.sql`
3. Click **Run**

This creates:
- ✅ Fireflies_Settings table (API key storage)
- ✅ Fireflies_Synced_Transcripts table (sync tracking)
- ✅ Functions for saving/retrieving settings
- ✅ Auto-sync tracking

---

### Step 2: Get Your Fireflies API Key

1. **Go to Fireflies.ai**:
   - Visit: https://app.fireflies.ai
   - Log in to your account

2. **Navigate to Integrations**:
   - Click your profile icon (top right)
   - Select **Settings**
   - Go to **Integrations** tab
   - Find **Custom Integrations** section

3. **Generate API Key**:
   - Click **"Generate API Key"**
   - Copy the key (you won't see it again!)
   - Keep it secure

---

### Step 3: Configure Auto-Sync

1. **Open Settings Page**:
   - Go to: `fireflies-settings.html`
   - Or add a link in your dashboard

2. **Enter API Key**:
   - Paste your Fireflies API key
   - Enable Auto-Sync toggle
   - Click **Save Settings**

3. **Test Connection**:
   - Click **Test Connection** button
   - Should show: "✅ Connection successful!"

---

### Step 4: Deploy Sync Function (Optional - for automatic sync)

**Option A: Supabase Edge Function (Recommended)**

1. Create folder: `supabase/functions/fireflies-sync/`
2. Copy `fireflies-sync-edge-function.js` to `supabase/functions/fireflies-sync/index.ts`
3. Deploy:
   ```bash
   supabase functions deploy fireflies-sync
   ```
4. Set up cron job to call function every 30 minutes

**Option B: Manual Sync**
- Use the "Sync Now" button in `fireflies-settings.html`
- Syncs on demand whenever you click it

---

## ✨ How It Works

### Automatic Flow:
1. **You have a sales call** → Fireflies records and transcribes it
2. **Within 30 minutes** → Auto-sync checks for new transcripts
3. **New transcript found** → Downloads and saves to your database
4. **AI Analysis** → Analyzes using your methodology (MEDDIC, Sandler, SPIN, etc.)
5. **Coaching Generated** → Insights appear in your dashboard
6. **Notification Sent** → Manager gets notified of coaching opportunity

### What Gets Synced:
- ✅ Meeting title
- ✅ Full transcript
- ✅ Duration
- ✅ Date/time
- ✅ Participants
- ✅ Fireflies unique ID (prevents duplicates)

### What Gets Analyzed:
- 🎯 Methodology execution (based on your selected methodology)
- 💬 Talk/listen ratio
- 📊 Key metrics (pain discovery, budget discussion, etc.)
- ✅ What went well
- 🔧 Areas to improve
- 💡 Specific recommendations

---

## 🎛️ Settings Explained

### Auto-Sync
- **Enabled**: Checks Fireflies every 30 minutes for new transcripts
- **Disabled**: Manual sync only (click "Sync Now" button)

### Sync Filters
- **Minimum Duration**: Skip very short calls (default: 5 minutes)
- **Only User Meetings**: Only sync meetings you attended (not all team meetings)

### Sync Frequency
- Default: Every 30 minutes
- Can be adjusted in database (sync_frequency_minutes)

---

## 📊 Monitoring

### View Stats:
- **Total Synced**: How many transcripts have been imported
- **Last Sync**: When the last sync happened
- **Analyzed**: How many have been analyzed with AI

### Recent Syncs:
- See list of recently synced transcripts
- Status indicators:
  - 🟢 **Synced**: Downloaded successfully
  - 🟡 **Analyzing**: AI analysis in progress
  - ✅ **Analyzed**: Complete with coaching insights
  - 🔴 **Failed**: Error occurred

---

## 🔧 Troubleshooting

### "Invalid API Key"
- **Solution**: Regenerate key in Fireflies and update in settings
- Check you copied the full key (no spaces)

### "No transcripts syncing"
- **Check**: Do you have calls recorded in Fireflies?
- **Check**: Is auto-sync enabled?
- **Check**: Try manual "Sync Now" button
- **Check**: Look at Fireflies date range (syncs last 30 days)

### "Transcripts syncing but not analyzing"
- **Check**: Is your methodology selected in Setup?
- **Check**: Database logs for analysis errors
- **Check**: Conversation_Analyses table for records

### "Duplicate transcripts"
- **Won't happen**: System tracks Fireflies IDs to prevent duplicates
- Each transcript syncs exactly once

---

## 🚀 Advanced Features

### Webhook Support (Future)
Instead of polling every 30 minutes, Fireflies can push new transcripts instantly:
- Set up webhook endpoint in Fireflies
- Point to your Supabase Edge Function
- Get real-time analysis (0 delay)

### Team-Wide Sync
- Manager's Fireflies API key syncs all team calls
- Each transcript assigned to correct team member
- Consolidated view for coaching

### Custom Analysis Triggers
- Only analyze calls with specific keywords
- Skip internal team meetings
- Different methodology per call type

---

## 💡 Best Practices

1. **Set Up Once**: Configure once, forget about it
2. **Regular Check-ins**: Review stats weekly to ensure syncing
3. **Manager Dashboard**: Check team's synced calls for coaching opportunities
4. **Notification Settings**: Enable notifications for new analyses
5. **API Key Security**: Never share your Fireflies API key

---

## 📞 Support

### Common Questions:

**Q: Does this work with Zoom/Teams/Google Meet?**
A: Yes! If Fireflies records it, we'll sync it.

**Q: What if I don't want certain calls analyzed?**
A: Use title filters or minimum duration to skip specific calls.

**Q: Can I sync old calls?**
A: Yes! Syncs last 30 days by default. Adjust date range in sync function.

**Q: Does this cost extra?**
A: No! Fireflies API is included in their paid plans.

**Q: How secure is my data?**
A: API key encrypted at rest. Transcripts stored in your Supabase (you control it).

---

## ✅ Setup Checklist

- [ ] Run `fireflies-integration-schema.sql` in Supabase
- [ ] Get Fireflies API key from app.fireflies.ai
- [ ] Open `fireflies-settings.html` and enter API key
- [ ] Test connection (should show success)
- [ ] Enable auto-sync
- [ ] Save settings
- [ ] (Optional) Deploy Edge Function for automatic sync
- [ ] Have a test call and verify it syncs within 30 minutes
- [ ] Check dashboard for auto-analyzed transcript

---

**Result**: Every sales call automatically analyzed with your methodology, with zero manual work! 🎉
