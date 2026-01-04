# Manager Coaching Dashboard - Deployment & Testing Guide

## Overview

The Manager Team Coaching Dashboard has been successfully built with the following components:

### ✅ Completed Components

1. **Database Schema** - `Manager_Notes` and `User_Goals` tables with RLS policies
2. **SECURITY DEFINER Functions** - Admin access functions deployed to Supabase
3. **Team Overview Page** - `admin-team.html` (main view with insight cards)
4. **User Detail Page** - `admin-team-detail.html` (deep dive with coaching interface)
5. **User Dashboard Integration** - `index.html` updated to show manager feedback

---

## File Locations

### Created Files
- `/Users/johncunningham/Daily-Tracker/landing-page/admin-team.html` - Team overview (insight cards)
- `/Users/johncunningham/Daily-Tracker/landing-page/admin-team-detail.html` - User detail view
- `/Users/johncunningham/Daily-Tracker/landing-page/admin-team-schema.sql` - Database tables
- `/Users/johncunningham/Daily-Tracker/landing-page/admin-team-functions.sql` - SECURITY DEFINER functions
- `/Users/johncunningham/Daily-Tracker/landing-page/DATABASE-DEPLOYMENT-GUIDE.md` - Deployment steps

### Modified Files
- `/Users/johncunningham/Daily-Tracker/index.html` - Updated manager feedback functions

---

## Testing Checklist

### Phase 1: Database Verification (COMPLETED ✅)

- [x] Manager_Notes table created
- [x] User_Goals table created
- [x] RLS policies deployed
- [x] Triggers for updated_at deployed
- [x] Core SECURITY DEFINER functions deployed:
  - `is_admin()`
  - `create_manager_note()`
  - `create_user_goal()`
  - `update_goal_progress()`

### Phase 2: Access Testing

**Test Admin Authentication:**

1. Open `admin-team.html` in browser
2. Sign in with admin credentials:
   - `admin@aiadvantagesolutions.com` OR
   - `john@aiadvantagesolutions.ca`
3. Verify dashboard loads successfully

**Expected Result:** Team overview page displays with cards for each team member.

### Phase 3: Team Overview Testing

**Navigate to:** `admin-team.html`

**Test Points:**
1. **Card Display**
   - Each team member shown as a card
   - Performance score (0-10) displayed with color coding:
     - 🟢 Green = 7.5+ (High)
     - 🟡 Yellow = 5-7.5 (Medium)
     - 🔴 Red = <5 (Low)

2. **Top Priority Section**
   - Shows biggest methodology weakness (e.g., "Upfront Contract: Missing in 6 of 10 calls")
   - Displays coaching prompt
   - Severity indicator (🔴/🟡/🟢)

3. **Top Strength Section**
   - Shows strongest methodology execution area
   - Displays execution rate

4. **Quick Metrics**
   - Revenue with traffic light indicator
   - Activity (dials) with traffic light
   - Conversion rate with traffic light

5. **Click Behavior**
   - Clicking "View Details →" navigates to `admin-team-detail.html?user={userId}`

### Phase 4: User Detail Testing

**Navigate to:** `admin-team-detail.html?user={userId}` (by clicking a card)

**Test Points:**

1. **Methodology Execution Panel**
   - Shows Sandler execution breakdown:
     - Upfront Contract
     - Pain Funnel
     - Budget Discussion
     - Decision Process
     - Talk Ratio
   - Each metric shows:
     - Execution rate (%)
     - Progress bar with color coding
     - Call count (e.g., "6 of 10 calls")
     - Coaching note

2. **Activity Trend Chart**
   - Line chart showing dials, conversations, meetings over time
   - X-axis: dates (last 30 days)
   - Y-axis: counts
   - Legend with colored lines

3. **Conversion Funnel Chart**
   - Horizontal bar chart
   - Shows: Dials → Conversations → Meetings → Sales

4. **Add Coaching Note Form**
   - Note Type dropdown (Coaching, Feedback, Improvement, Strength, Concern, Goal Discussion)
   - Subject text input
   - Content textarea
   - Severity dropdown (Low, Medium, High)
   - Private checkbox (if checked, user won't see note)
   - Submit button

5. **Set Goal Form**
   - Goal Type dropdown
   - Goal Title input
   - Description textarea
   - Target Date picker
   - Submit button

6. **Coaching Notes History**
   - Displays all notes for this user
   - Newest first
   - Shows: type, subject, content, date
   - Private notes marked with 🔒

7. **Active Goals List**
   - Shows all active goals
   - Progress bar with percentage
   - Status badge (Active, Completed, Overdue)
   - Target date displayed

### Phase 5: Create Sample Data

**Test Creating a Manager Note:**

1. Navigate to user detail page
2. Fill out "Add Coaching Note" form:
   - Note Type: `Coaching`
   - Subject: `Improve Upfront Contract Execution`
   - Content: `I noticed you're setting upfront contracts in only 40% of calls. Let's work on making this the first step in every discovery call. What obstacles are preventing you from doing this consistently?`
   - Severity: `Medium`
   - Private: `Unchecked`
3. Click "Add Note"
4. **Expected:** Page reloads, note appears in history section

**Test Creating a Goal:**

1. Fill out "Set Goal" form:
   - Goal Type: `Methodology Execution`
   - Goal Title: `Increase Upfront Contract to 80%`
   - Description: `Set upfront contract in at least 8 out of 10 discovery calls by end of month`
   - Target Date: `[30 days from now]`
2. Click "Set Goal"
3. **Expected:** Page reloads, goal appears in Active Goals section

### Phase 6: User Dashboard Testing

**Test User Can See Manager Feedback:**

1. Open `/Users/johncunningham/Daily-Tracker/index.html`
2. Sign in as the user (NOT admin)
3. Scroll to "Manager Feedback & Goals" section
4. **Expected Results:**
   - Coaching notes visible (non-private only)
   - Notes show subject, content, category
   - Severity indicated by colored left border
   - Active goals displayed with progress bars
   - Goals show title, description, target date, progress %

**Test Privacy:**

1. As admin, create a private note (check "Keep Private" box)
2. As user, reload dashboard
3. **Expected:** Private note does NOT appear in user's view

---

## Deployment Steps

### Step 1: Upload HTML Files

**Option A: If using Vercel/Netlify for Daily-Tracker:**

```bash
cd /Users/johncunningham/Daily-Tracker
git add landing-page/admin-team.html
git add landing-page/admin-team-detail.html
git add index.html
git commit -m "Add manager coaching dashboard"
git push
```

**Option B: If hosting on custom server:**

- Upload `admin-team.html` to your web server
- Upload `admin-team-detail.html` to your web server
- Replace existing `index.html` with updated version

### Step 2: Update Admin Dashboard Links

**In `/Users/johncunningham/Daily-Tracker/admin.html`:**

The header already has a link to Team Dashboard:
```html
<a href="admin-team.html" class="btn-secondary">← Team Dashboard</a>
```

Verify this link exists on line 553. If not, add it.

### Step 3: Verify Supabase RLS Policies

**Check that RLS is enabled:**

1. Go to Supabase Dashboard → Authentication → Policies
2. Verify `Manager_Notes` has policies:
   - "Users can view their own notes (non-private)"
   - "Admins can manage all notes"
3. Verify `User_Goals` has policies:
   - "Users can view their own goals"
   - "Admins can manage all goals"

### Step 4: Test End-to-End Flow

**Complete User Journey:**

1. **As Manager:**
   - Sign in to `admin-team.html`
   - View team overview
   - Click user card → navigate to detail
   - Review methodology execution insights
   - Add coaching note
   - Set goal for user

2. **As User:**
   - Sign in to `index.html` (main dashboard)
   - Scroll to "Manager Feedback & Goals"
   - See coaching note
   - See active goal with progress

---

## Troubleshooting

### Issue: "Access Denied" when loading team data

**Cause:** User is not in admin whitelist

**Fix:** Add user email to `ADMIN_EMAILS` array in both:
- `admin-team.html` (line ~236)
- `admin-team-detail.html` (similar location)

```javascript
const ADMIN_EMAILS = [
    'admin@aiadvantagesolutions.com',
    'john@aiadvantagesolutions.ca'
    // Add more admin emails here
];
```

### Issue: "No team data available"

**Possible Causes:**
1. No users have activity data in `Daily_Tracker` table
2. No conversation analyses in `Conversation_Analyses` table
3. RLS policies blocking access

**Debug Steps:**
```sql
-- Check if there's activity data
SELECT user_id, COUNT(*)
FROM Daily_Tracker
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;

-- Check if there are conversation analyses
SELECT user_id, COUNT(*)
FROM Conversation_Analyses
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;
```

### Issue: Notes/Goals not appearing in user dashboard

**Check:**
1. User is signed in (check browser console for auth errors)
2. RLS policies allow user to see their own data
3. Notes are not marked as private (`is_private = false`)

**Debug:**
```sql
-- Check notes for specific user
SELECT * FROM Manager_Notes
WHERE user_id = 'USER_UUID_HERE'
ORDER BY created_at DESC;

-- Check goals for specific user
SELECT * FROM User_Goals
WHERE user_id = 'USER_UUID_HERE'
ORDER BY created_at DESC;
```

### Issue: Charts not rendering

**Check:**
1. Chart.js CDN is loading (check browser console)
2. Data is being fetched (check browser Network tab)
3. Canvas elements exist in DOM

**Fix:** Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

---

## Success Criteria

✅ **Deployment is successful when:**

1. Manager can access `admin-team.html` and see all team members
2. Each card shows top priority weakness and top strength
3. Clicking card navigates to detail page
4. Detail page shows methodology breakdown with colored progress bars
5. Manager can add notes and goals via forms
6. Notes and goals appear in history sections
7. User can see non-private notes in their `index.html` dashboard
8. User can see active goals with progress bars
9. Private notes are hidden from users

---

## Next Steps (Optional Enhancements)

### Enhancement 1: Email Notifications

When manager adds note/goal, send email notification to user.

**Implementation:**
- Add Supabase Edge Function trigger on `Manager_Notes` INSERT
- Use SendGrid/Resend API to send email

### Enhancement 2: Goal Progress Auto-Update

Automatically calculate goal progress based on actual metrics.

**Implementation:**
- Create scheduled function that runs daily
- Compare current metrics to goal targets
- Update `progress_percentage` in `User_Goals` table

### Enhancement 3: Team Benchmarks

Show how each user compares to team average.

**Implementation:**
- Create materialized view: `Team_Benchmarks`
- Refresh hourly with team averages
- Display comparison in detail view

### Enhancement 4: Export Reports

Allow manager to export PDF/CSV reports.

**Implementation:**
- Add "Export" button to team overview
- Generate PDF using jsPDF library
- Include all insights and metrics

---

## Support

**For issues:**
- Check Supabase logs: Dashboard → Database → Logs
- Check browser console for JavaScript errors
- Review RLS policies in Supabase
- Verify SECURITY DEFINER functions exist

**Common Questions:**

**Q: Can users add their own goals?**
A: Currently no - only managers can set goals. This ensures alignment with coaching strategy.

**Q: Can users see private notes?**
A: No - private notes are only visible to managers. RLS policy enforces this.

**Q: How do I add more admins?**
A: Add their email to `ADMIN_EMAILS` array in both HTML files.

**Q: What if a user has no conversation analyses?**
A: The methodology panel will show "No data available yet" with a prompt to start tracking.

---

## Conclusion

The Manager Coaching Dashboard is now fully implemented and ready for testing. Follow the testing checklist above to verify all functionality, then deploy to production using the deployment steps.

**Key Features Delivered:**
- 🎯 Quick insights first, detailed drill-down second
- 📊 Methodology-specific categorical insights (Sandler)
- 💬 Coaching prompts based on execution gaps
- 🔒 Full transparency (users see non-private feedback)
- 📈 Visual performance tracking with charts
- ✅ Goal setting and progress tracking

**Time to Production:** Ready to deploy now!
