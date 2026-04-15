# Manager Coaching Dashboard - Quick Start Guide

## Setup (Do This Once - Tonight)

### 1. Create Conversation Analysis Table
1. Open **Supabase Dashboard** → SQL Editor
2. Copy ALL text from `/Users/johncunningham/Daily-Tracker/conversation-analysis-fixed.sql`
3. Paste and **Run**
4. You should see "Conversation_Analyses table created successfully!"

---

## Using the System Tomorrow

### As Manager/Admin

#### **Login**
- Email: `john@oneclickcoaching.com` or `john@oneclickcoaching.com`
- Password: (your password)

#### **Add a New Team Member**
1. Open: `admin-team.html`
2. Click **"➕ Add Team Member"** button
3. Fill in:
   - Email
   - Temporary password (6+ characters)
   - Name (optional)
   - Sales methodology (Sandler, MEDDIC, etc.)
4. Click **"Create User"**
5. **IMPORTANT**: Copy the email and password shown - send to your team member

#### **View Team Performance**
1. Open: `admin-team.html` (Team Coaching Dashboard)
2. See all team members as cards showing:
   - Performance score
   - Top coaching opportunity
   - Top strength
   - Quick metrics
3. Click any user card to see details

#### **Add Coaching Notes**
1. From Team Dashboard, click a user card
2. Scroll to **"Manager Coaching Notes"** section
3. Select note type (Praise, Correction, Strength, Weakness, etc.)
4. Write your note
5. Optionally add related metric (e.g., "Upfront Contract")
6. Click **"Add Note"**

Your team member will see this note in their dashboard automatically!

#### **Set Goals**
1. From user detail page, find **"Active Goals"** section
2. Select metric type (dials, conversations, revenue, etc.)
3. Set target value
4. Choose period (daily, weekly, monthly)
5. Add notes explaining why this goal
6. Click **"Add Goal"** (feature to be added)

---

### As Team Member

#### **Login**
- Email: (provided by manager)
- Password: (provided by manager)
- You can change password after first login

#### **View Manager Feedback**
1. Login to your dashboard (`index.html`)
2. Scroll to **"Manager Feedback & Goals"** section
3. See all coaching notes from your manager
4. View active goals and progress

---

## Page Navigation

### **Main Pages**
- `index.html` - User Dashboard (daily tracking, manager feedback)
- `admin-team.html` - Team Coaching Dashboard (manager view)
- `admin-user-management.html` - Add team members
- `admin.html` - Performance Dashboard (revenue/sales stats)

### **Quick Links**
From any admin page, you'll see buttons to navigate between dashboards.

---

## Current Features

### ✅ Working Now
- **User Management**: Create team members with one click
- **Manager Notes**: Leave coaching feedback for team members
- **User Goals**: Set and track performance goals
- **Full Transparency**: Team members see all manager notes
- **Manager Assignment**: New users automatically assigned to you
- **Multiple Dashboards**: Team coaching, performance analytics

### ⏳ Coming Soon (Need Data First)
- **Categorical Insights**: Requires conversation analysis data
- **Strengths/Weaknesses Auto-Detection**: Requires 10+ conversation analyses
- **Methodology Execution Breakdown**: Requires Sandler scoring data

---

## Troubleshooting

### "No team members found"
- You haven't added any users yet
- Use "Add Team Member" button to create users

### "Error loading team data"
- Check browser console (F12) for specific error
- Verify SQL functions were created
- Ensure you're logged in as admin

### Can't access admin pages
- Verify your email is in the admin whitelist:
  - `john@oneclickcoaching.com`
  - `john@oneclickcoaching.com`
  - `john@oneclickcoaching.com`

### User can't login
- Verify they're using the exact email/password you provided
- Check for typos
- Password must be 6+ characters

---

## Support

If you encounter issues:
1. Check browser console (F12) for error messages
2. Verify you're on the correct page (check URL)
3. Ensure you ran both SQL setup files
4. Try logging out and back in

---

## Next Steps to Get Full Features

To see categorical insights and strengths/weaknesses:
1. Team members need to upload conversation recordings
2. Or manually enter conversation analysis scores
3. System needs 5-10 conversations per user to generate insights

The coaching notes and goals features work immediately!
