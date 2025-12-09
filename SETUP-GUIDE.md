# AI Advantage Solutions Success Chart - Setup Guide

Complete setup instructions for your enhanced sales performance dashboard with AI coaching.

---

## 🎯 What You're Getting

✅ **Supabase Database** - Scalable PostgreSQL backend
✅ **Real-time Analytics** - Live conversion funnel and revenue tracking
✅ **Beautiful Charts** - Weekly performance visualizations
✅ **AI Performance Coach** - RAG-powered insights and suggestions
✅ **Revenue Tracking** - Sales and project completion monitoring

---

## 📋 Prerequisites

- Web browser (Chrome, Firefox, Safari, or Edge)
- [Supabase account](https://supabase.com) (free tier available)
- Basic text editor (VS Code recommended)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** (or sign in if you have an account)
3. Create a new project:
   - **Organization**: Select or create one
   - **Project Name**: `ai-advantage-success-chart` (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you (e.g., `East US`)
   - Click **"Create new project"**
4. Wait 2-3 minutes for project to initialize

---

### Step 2: Create Database Tables

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase-schema.sql` from this folder
4. **Copy ALL the contents** of that file
5. **Paste into the SQL Editor** in Supabase
6. Click **"Run"** (bottom right)
7. You should see: ✅ **"Success. No rows returned"**

This creates 5 tables:
- `daily_stats` - Daily activity metrics
- `sales` - Individual sales records
- `projects` - Project tracking
- `weekly_goals` - Weekly targets
- `coaching_insights` - AI coaching data

---

### Step 3: Get Your Supabase Credentials

1. In Supabase, click **"Settings"** (gear icon) in left sidebar
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **Copy these:**
   - **Project URL** (starts with `https://`)
   - **Anon public key** (long string starting with `eyJ...`)

4. Keep these in a safe place - you'll need them in the next step

---

### Step 4: Configure the Dashboard

1. Open `success-chart.html` in your text editor (VS Code, Notepad++, etc.)
2. Find this section near the top of the JavaScript code (around line 361):

```javascript
// REPLACE THESE WITH YOUR SUPABASE PROJECT DETAILS
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace the placeholder text with your actual credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

4. **Save the file** (Ctrl+S or Cmd+S)

---

### Step 5: Open Your Dashboard

1. **Double-click** `success-chart.html` to open in your browser
2. You should see the **AI Advantage Solutions Success Chart** dashboard
3. If you see ⚠️ error about Supabase credentials, double-check Step 4

---

## 📊 How to Use the Dashboard

### Daily Workflow

#### 1. **Track Daily Activity**
- Enter your **# of Dials**
- Enter **# of Conversations** (people you spoke with)
- Enter **# of Discovery Meetings** booked
- Click **"Save Today's Stats"**

#### 2. **Record Sales**
- Enter **Sale Amount** in CAD (e.g., 5000.00)
- Enter **Client Name** (optional)
- Select **Service Type** from dropdown
- Click **"Record Sale"**

#### 3. **Review Performance**
- **Conversion Funnel** shows your sales pipeline effectiveness
- **Revenue Overview** displays total sales and average values
- **Weekly Performance Chart** visualizes trends over time

#### 4. **Get AI Coaching**
- Click **"Refresh Insights"** in the AI Coach section
- Read personalized suggestions based on your data
- Insights include:
  - Call volume recommendations
  - Conversion rate analysis
  - Meeting booking tips
  - Consistency tracking
  - Revenue performance

---

## 🎨 Dashboard Features

### Conversion Funnel
Visualizes your sales process:
- 📞 **Dials** → Total outreach attempts
- 💬 **Conversations** → Percentage of dials that connected
- 🤝 **Discovery Meetings** → Percentage that booked meetings
- 💰 **Sales Closed** → Percentage that converted to sales

### Weekly Performance Chart
Line graph showing 8 weeks of:
- Dials (teal line)
- Conversations (gold line)
- Meetings (pink line)

### AI Performance Coach
RAG-powered insights that analyze:
- Your activity patterns
- Conversion rates vs. benchmarks
- Consistency trends
- Revenue performance
- Personalized improvement suggestions

---

## 🔧 Advanced Features

### Setting Weekly Goals

1. Go to Supabase → **"Table Editor"**
2. Open **`weekly_goals`** table
3. Click **"Insert row"**
4. Set:
   - `week_start_date`: Start of week (e.g., 2025-12-09)
   - `target_dials`: Goal (e.g., 50)
   - `target_conversations`: Goal (e.g., 15)
   - `target_meetings`: Goal (e.g., 5)
   - `target_sales`: Goal (e.g., 2)
   - `target_revenue_cad`: Goal (e.g., 5000.00)
5. Click **"Save"**

### Viewing Raw Data

Access your data directly in Supabase:
1. Go to **"Table Editor"** in Supabase
2. Select any table to view/edit data
3. Export to CSV using **"Export"** button

### Project Tracking

Add projects to track completions:
1. Go to **`projects`** table in Supabase
2. Click **"Insert row"**
3. Fill in:
   - `project_name`: Name of project
   - `client_name`: Client
   - `start_date`: When it started
   - `expected_completion_date`: Target date
   - `completion_date`: Leave blank until done
   - `revenue_cad`: Project value
   - `status`: `in_progress`, `completed`, or `cancelled`

---

## 🔐 Security Best Practices

### Protect Your Data

1. **Never share your Supabase credentials publicly**
2. The `ANON_KEY` is safe for client-side code (read/write only)
3. For team use, enable Row Level Security (RLS):

```sql
-- In Supabase SQL Editor, run:
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

4. Add authentication using [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## 📱 Mobile Access

The dashboard is fully responsive:
- Works on phones and tablets
- Save as bookmark for quick access
- Consider using Chrome's "Add to Home Screen" for app-like experience

---

## 🆘 Troubleshooting

### Problem: "Please configure Supabase credentials" error
**Solution:**
- Check that you replaced `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY`
- Make sure credentials are in quotes: `'https://...'`
- No extra spaces or line breaks

### Problem: "Failed to save stats" error
**Solution:**
- Verify you ran the SQL schema in Step 2
- Check Supabase project is active (not paused)
- Open browser Console (F12) to see detailed errors

### Problem: Charts not displaying
**Solution:**
- Make sure you have data in the database
- Chart.js requires internet connection (loads from CDN)
- Try refreshing the page

### Problem: No coaching insights
**Solution:**
- Log at least 7 days of activity first
- Click "Refresh Insights" button
- Insights are generated based on patterns in your data

---

## 📊 Analytics & Reports

### Weekly Review Process

Every Monday:
1. Check **Weekly Performance Chart** for trends
2. Review **Conversion Funnel** rates
3. Read **AI Coaching Insights** for focus areas
4. Set new goals in **`weekly_goals`** table

### Monthly Analysis

Export data from Supabase:
1. Go to each table
2. Click **"Export"** → **"CSV"**
3. Analyze in Excel/Google Sheets
4. Compare month-over-month growth

---

## 🚀 Optional Enhancements

### N8N Integration (Automation)

Want automated reports and notifications?

1. Create free [n8n.io](https://n8n.io) account
2. Use Supabase webhook to trigger workflows:
   - Daily activity reminders
   - Weekly summary emails
   - Slack notifications for new sales
   - CRM sync (Salesforce, HubSpot)

### Custom Service Types

Edit the service dropdown in `success-chart.html`:

```html
<select id="input-service">
    <option value="">Select service...</option>
    <option value="Your Service 1">Your Service 1</option>
    <option value="Your Service 2">Your Service 2</option>
    <!-- Add more options -->
</select>
```

### Team Mode

For multiple users:
1. Enable Supabase Authentication
2. Add `user_id` column to all tables
3. Implement Row Level Security policies
4. See [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

---

## 📚 Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Chart.js Documentation**: https://www.chartjs.org/docs/
- **AI Advantage Solutions**: https://aiadvantagesolutions.ca

---

## 💡 Pro Tips

1. **Log daily** - Consistency is key for accurate AI insights
2. **Review weekly trends** - Don't just focus on today's numbers
3. **Act on coaching** - The AI suggestions are based on top performer patterns
4. **Set realistic goals** - Use the `weekly_goals` table to track progress
5. **Celebrate wins** - The dashboard highlights your achievements!

---

## 📞 Need Help?

If you run into issues:
1. Check the Troubleshooting section above
2. Review Supabase project logs
3. Open browser Console (F12) for error messages
4. Contact: john@aiadvantagesolutions.ca

---

**Built for AI Advantage Solutions**
Version 1.0 - December 2025
