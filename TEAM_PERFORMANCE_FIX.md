# Team Performance Dashboard - Fix Applied

## Problem Identified
The admin-team-performance.html page was trying to use `supabaseClient.auth.admin.listUsers()` which requires service role privileges (admin key), but the page only has access to the anon key.

## Solution Applied

### 1. Created Database Function
Created `supabase/functions/get-team-members.sql` with a SECURITY DEFINER function that:
- Safely queries auth.users table
- Returns only team members where manager_id matches the logged-in manager
- Bypasses RLS using SECURITY DEFINER (safe because it's filtered by manager_id)

### 2. Updated admin-team-performance.html
Changed from:
```javascript
const { data: { users }, error } = await supabaseClient.auth.admin.listUsers();
const teamMembers = users.filter(user => user.user_metadata?.manager_id === currentManagerId);
```

To:
```javascript
const { data: teamMembers, error } = await supabaseClient
    .rpc('get_team_members', { manager_user_id: currentManagerId });
```

## Deployment Steps

### Step 1: Run the SQL Function
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy the contents of `supabase/functions/get-team-members.sql`
5. Run the SQL
6. You should see success message: "✅ get_team_members function created!"

### Step 2: Verify Schema
Make sure you've run the team performance schema:
1. In Supabase SQL Editor, check if these tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('daily_activities', 'manager_feedback', 'user_goals');
   ```

2. If any tables are missing, run:
   - `supabase/migrations/001_team_performance_schema.sql`

### Step 3: Deploy to Vercel
The updated admin-team-performance.html file needs to be deployed:

```bash
git add admin-team-performance.html supabase/functions/get-team-members.sql TEAM_PERFORMANCE_FIX.md
git commit -m "Fix team performance dashboard - use database function instead of admin API"
git push origin main
```

Vercel will automatically deploy the changes.

### Step 4: Set Up Test Data

#### Create a Test Team Member
In Supabase SQL Editor, create a test user with your manager ID:

```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
-- Copy your ID

-- Then invite a test team member via Supabase Auth UI:
-- Dashboard → Authentication → Users → Invite User
-- Email: test@example.com
-- After they accept, update their manager_id:

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{manager_id}',
    '"YOUR-MANAGER-ID-HERE"'::jsonb
)
WHERE email = 'test@example.com';
```

#### Add Test Activity Data
```sql
-- Insert some test activities for the team member
INSERT INTO daily_activities (user_id, date, calls_made, emails_sent, meetings_booked, methodology_score)
VALUES
    ('TEAM-MEMBER-USER-ID', CURRENT_DATE, 25, 15, 3, 75),
    ('TEAM-MEMBER-USER-ID', CURRENT_DATE - INTERVAL '1 day', 30, 20, 4, 80),
    ('TEAM-MEMBER-USER-ID', CURRENT_DATE - INTERVAL '2 days', 20, 10, 2, 70);
```

### Step 5: Test the Dashboard

1. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
2. Navigate to: https://daily-tracker-vp21.vercel.app/admin-team-performance.html
3. You should see:
   - Team averages calculated
   - Radial charts for each team member
   - "One-Click Coaching" buttons
   - Metrics showing calls, emails, meetings, methodology score

### Step 6: Verify in Console

Open browser console (F12) and check:

```javascript
// Should show "function"
console.log('get_team_members available:', typeof supabaseClient.rpc);

// Test the function
const { data, error } = await supabaseClient.rpc('get_team_members', {
    manager_user_id: (await supabaseClient.auth.getUser()).data.user.id
});
console.log('Team members:', data);
console.log('Error:', error);
```

## Expected Behavior After Fix

### With NO team members:
- Page loads successfully
- Shows: "No team members found."
- No errors in console

### With team members but NO activity data:
- Radial charts appear (empty circles)
- Metrics show 0/day
- Team averages show "--"

### With team members AND activity data:
- Radial charts filled with color
- 4 concentric rings per chart
- Color-coded (green/aqua = good, red/pink = below average)
- Team averages calculated and displayed

## Troubleshooting

### Error: "function get_team_members does not exist"
- Run `supabase/functions/get-team-members.sql` in Supabase SQL Editor

### Error: "permission denied for table auth.users"
- The function is SECURITY DEFINER, so this shouldn't happen
- Verify the function was created with SECURITY DEFINER keyword

### No team members showing
- Check manager_id is set: `SELECT id, email, raw_user_meta_data->>'manager_id' as manager_id FROM auth.users;`
- Verify you're logged in as the manager

### Radial charts not appearing
- Check browser console for JavaScript errors
- Verify canvas element exists: `document.querySelectorAll('canvas').length`
- Check if data is being returned: Look at network tab for RPC call

## Security Notes

The `get_team_members` function is SECURITY DEFINER but safe because:
1. It only returns users where manager_id matches the caller
2. It doesn't return sensitive auth fields (password hash, etc.)
3. It's filtered by the provided manager_user_id parameter
4. Only authenticated users can call it

This is the standard pattern for multi-tenant apps where managers need to see their team.
