# Manager Team Coaching Dashboard - Database Deployment Guide

## Overview

This guide walks you through deploying the database schema and functions needed for the Manager Team Coaching Dashboard to your Supabase project.

---

## Prerequisites

- ✅ Supabase project created
- ✅ Access to Supabase SQL Editor
- ✅ `Conversation_Analyses` table already exists with Sandler methodology fields
- ✅ Admin email is `john@aiadvantagesolutions.ca`

---

## Deployment Steps

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your **Daily Tracker** project
3. Navigate to **SQL Editor** (left sidebar, database icon)
4. Click **New Query**

---

### Step 2: Deploy Schema (Tables, Views, Policies)

1. Open `admin-team-schema.sql` file
2. **Copy the entire contents**
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

**What this creates:**
- ✅ `Manager_Notes` table - Coaching notes from managers
- ✅ `User_Goals` table - Goals set for team members
- ✅ `Team_Benchmarks` materialized view - Pre-calculated team averages
- ✅ RLS policies - Security rules for data access
- ✅ Triggers - Auto-update timestamps
- ✅ Indexes - Fast queries

**Expected output:**
```
Success. No rows returned
```

If you see any errors, read them carefully - they might indicate missing dependencies (like `Conversation_Analyses` table not existing).

---

### Step 3: Deploy Functions (SECURITY DEFINER)

1. Open `admin-team-functions.sql` file
2. **Copy the entire contents**
3. Create a **new query** in Supabase SQL Editor
4. Paste into the editor
5. Click **Run**

**What this creates:**
- ✅ `is_admin()` - Check if user is admin
- ✅ `get_team_overview()` - Get all users with insights
- ✅ `get_user_categorical_insights()` - Deep methodology analysis
- ✅ `get_user_detail_metrics()` - Time-series performance data
- ✅ `get_team_benchmarks()` - Team averages
- ✅ `create_manager_note()` - Add coaching notes
- ✅ `create_user_goal()` - Set goals for users
- ✅ `update_goal_progress()` - Track goal progress

**Expected output:**
```
Success. No rows returned
```

---

### Step 4: Verify Deployment

Run these test queries to verify everything works:

#### Test 1: Check if you're recognized as admin
```sql
SELECT is_admin();
```
**Expected:** `true` (if logged in as john@aiadvantagesolutions.ca)

#### Test 2: Get team overview
```sql
SELECT * FROM get_team_overview(30);
```
**Expected:** Returns rows for each user with insights (or empty if no conversation data yet)

#### Test 3: Check team benchmarks
```sql
SELECT * FROM get_team_benchmarks();
```
**Expected:** Returns one row with team-wide averages

#### Test 4: List tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('Manager_Notes', 'User_Goals');
```
**Expected:** Both tables listed

---

### Step 5: Refresh Team Benchmarks (Optional)

The `Team_Benchmarks` materialized view needs to be refreshed periodically. Run manually:

```sql
SELECT refresh_team_benchmarks();
```

**Set up automatic refresh (recommended):**

1. Go to **Database** → **Extensions** in Supabase
2. Enable `pg_cron` extension
3. Create a cron job to refresh hourly:

```sql
SELECT cron.schedule(
  'refresh-team-benchmarks',
  '0 * * * *', -- Every hour
  'SELECT refresh_team_benchmarks();'
);
```

---

## Security Verification

### Test RLS Policies

#### As Admin (john@aiadvantagesolutions.ca):
```sql
-- Should see all notes (including private)
SELECT * FROM Manager_Notes;

-- Should see all goals
SELECT * FROM User_Goals;
```

#### As Regular User:
```sql
-- Should only see their own non-private notes
SELECT * FROM Manager_Notes;

-- Should only see their own goals
SELECT * FROM User_Goals;
```

#### Test SECURITY DEFINER Functions:
```sql
-- As admin: Should work
SELECT * FROM get_team_overview(30);

-- As regular user: Should fail with "Access denied"
SELECT * FROM get_team_overview(30);
```

---

## Sample Data (Optional - For Testing)

If you want to test the dashboard with sample data:

```sql
-- Insert a sample coaching note
INSERT INTO Manager_Notes (
  user_id,
  manager_id,
  note_type,
  category,
  subject,
  content,
  severity,
  is_private
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test-user@example.com'),
  (SELECT id FROM auth.users WHERE email = 'john@aiadvantagesolutions.ca'),
  'coaching',
  'Upfront Contract',
  'Need to improve upfront contract usage',
  'Noticed that upfront contracts are being skipped in 6 out of 10 calls. Let''s discuss strategies to make this a non-negotiable first step in every call.',
  'high',
  false
);

-- Insert a sample goal
INSERT INTO User_Goals (
  user_id,
  manager_id,
  goal_type,
  category,
  title,
  description,
  target_metric,
  target_value,
  current_value,
  start_date,
  target_date,
  progress_percentage
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test-user@example.com'),
  (SELECT id FROM auth.users WHERE email = 'john@aiadvantagesolutions.ca'),
  'methodology_execution',
  'Upfront Contract',
  'Achieve 80% Upfront Contract Usage',
  'Set an upfront contract in at least 8 out of 10 sales calls by end of month',
  'upfront_contract_rate',
  80,
  40,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  50
);
```

---

## Troubleshooting

### Error: "relation Conversation_Analyses does not exist"

**Problem:** The Conversation_Analyses table hasn't been created yet.

**Solution:** Create the Conversation_Analyses table first. This table should have fields like:
- `user_id UUID`
- `date DATE`
- `upfront_contract_set BOOLEAN`
- `pain_identified BOOLEAN`
- `budget_discussed BOOLEAN`
- `decision_makers_identified BOOLEAN`
- `pain_funnel_score NUMERIC`
- `budget_discussion_score NUMERIC`
- `decision_process_score NUMERIC`
- `bonding_rapport_score NUMERIC`
- `overall_quality_score NUMERIC`
- `talk_percentage NUMERIC`
- `negative_reverse_used BOOLEAN`

### Error: "permission denied for schema public"

**Problem:** Your user doesn't have permission to create tables.

**Solution:** Make sure you're running SQL as the project owner in Supabase dashboard.

### Error: "function auth.uid() does not exist"

**Problem:** You're running SQL outside of an authenticated context.

**Solution:** This error only appears when testing locally. In production with Supabase Auth, `auth.uid()` will work correctly.

### Materialized view not refreshing

**Problem:** Team_Benchmarks shows old data.

**Solution:** Run `SELECT refresh_team_benchmarks();` manually or set up the cron job.

---

## Next Steps After Deployment

Once the database is deployed:

1. ✅ **Test the functions** - Verify you can call `get_team_overview()` successfully
2. ✅ **Create the frontend** - Build `admin-team.html` and `admin-team-detail.html`
3. ✅ **Integrate with existing dashboard** - Add manager feedback section to user dashboard
4. ✅ **Set up cron job** - Auto-refresh Team_Benchmarks hourly
5. ✅ **Add sample data** - Test with real conversation analyses

---

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Conversation_Analyses (existing)                            │
├─────────────────────────────────────────────────────────────┤
│ • user_id                                                   │
│ • upfront_contract_set, pain_identified, etc.              │
│ • Analyzed by get_user_categorical_insights()              │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ feeds data to
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Team_Benchmarks (materialized view)                         │
├─────────────────────────────────────────────────────────────┤
│ • Pre-calculated team averages                              │
│ • Refreshed hourly                                          │
│ • Used for comparison in charts                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Manager_Notes (new)                                          │
├─────────────────────────────────────────────────────────────┤
│ • Coaching notes from managers                               │
│ • Visible to users (unless marked private)                   │
│ • Categorized by methodology element                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User_Goals (new)                                             │
├─────────────────────────────────────────────────────────────┤
│ • Goals set by managers                                      │
│ • Progress tracking                                          │
│ • Auto-calculated completion percentage                      │
└─────────────────────────────────────────────────────────────┘
```

---

## API Usage Examples (for Frontend)

Once deployed, you can call these functions from your frontend:

```javascript
// Get team overview
const { data: teamOverview } = await supabase
  .rpc('get_team_overview', { days_back: 30 })

// Get user insights
const { data: insights } = await supabase
  .rpc('get_user_categorical_insights', {
    target_user_id: userId,
    days_back: 30
  })

// Get detail metrics for charts
const { data: metrics } = await supabase
  .rpc('get_user_detail_metrics', {
    target_user_id: userId,
    days_back: 30
  })

// Create a coaching note
const { data: noteId } = await supabase
  .rpc('create_manager_note', {
    target_user_id: userId,
    note_type: 'coaching',
    category: 'Upfront Contract',
    subject: 'Improve upfront contract usage',
    content: 'Focus on setting expectations at start of every call',
    severity: 'high',
    is_private: false
  })

// Create a goal
const { data: goalId } = await supabase
  .rpc('create_user_goal', {
    target_user_id: userId,
    goal_type: 'methodology_execution',
    category: 'Upfront Contract',
    title: 'Achieve 80% Upfront Contract Usage',
    description: 'Set upfront contract in 8/10 calls',
    target_metric: 'upfront_contract_rate',
    target_value: 80,
    target_date: '2025-01-31'
  })

// Update goal progress
await supabase
  .rpc('update_goal_progress', {
    goal_id: goalId,
    new_current_value: 65 // Current execution rate
  })
```

---

## Cost Considerations

- **Storage:** ~1KB per note, ~500B per goal
- **Compute:** Functions are SECURITY DEFINER (run as owner, not user)
- **Materialized View:** Refreshing takes ~50-100ms for 1000 conversations
- **Cron Jobs:** Free on Supabase (up to 1M executions/month)

**Estimated cost for 10 users with 100 calls/month each:**
- Storage: <1MB
- Compute: Negligible
- Total: **$0** (within Supabase free tier)

---

## Support

If you encounter issues during deployment:

1. Check the **Supabase Logs** (Dashboard → Logs)
2. Verify your admin email matches `john@aiadvantagesolutions.ca`
3. Ensure `Conversation_Analyses` table exists with required fields
4. Test each function individually with the verification queries above

Ready to proceed with frontend development once database is deployed! 🚀
