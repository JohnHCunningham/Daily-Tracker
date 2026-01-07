# Debug Team Performance Dashboard

## Step 1: Clear Cache & Open Page

1. **Clear browser cache** (Cmd+Shift+R)
2. **Open team performance page:**
   ```
   https://daily-tracker-vp21.vercel.app/admin-team-performance.html
   ```

## Step 2: Check JavaScript Console

1. Open browser console (F12 or Cmd+Option+I)
2. Look for RED errors
3. Common errors:
   - "supabaseClient is not defined"
   - "Cannot read property of undefined"
   - CORS errors

## Step 3: What You Should See (Even Without Data)

**With NO team members:**
- Page title: "Team Performance Dashboard"
- Message: "No team members found" or similar
- Empty state (no radial charts yet)

**With team members but NO activity data:**
- Radial charts appear (circles)
- Charts are empty (0% filled)
- "Generate Coaching" buttons visible

**With team members AND activity data:**
- Radial charts filled with color
- 4 rings per chart (calls, emails, meetings, methodology)
- Color-coded (green = above average, red = below)

## Step 4: Check Supabase Connection

In browser console, run:
```javascript
// Check if Supabase is connected
console.log('Supabase client:', typeof supabaseClient);
// Should show: "object"

// Check if user is logged in
supabaseClient.auth.getUser().then(({data}) => {
  console.log('Logged in as:', data.user?.email);
});
```

## Step 5: Check Database for Team Members

You need data in the database for charts to appear.

**Required data:**
1. Team members in auth.users table
2. Manager hierarchy (users.raw_user_meta_data->>'manager_id')
3. Activity data in daily_activities table

**To add test data:**

Run this in Supabase SQL Editor:
```sql
-- Check if you have any team members
SELECT id, email, raw_user_meta_data->>'manager_id' as manager_id
FROM auth.users;

-- Check if you have any activity data
SELECT COUNT(*) FROM daily_activities;
```

## Step 6: If Page is Completely Blank

1. **Check URL is correct:**
   ```
   https://daily-tracker-vp21.vercel.app/admin-team-performance.html
   ```
   NOT:
   - /admin.html ❌
   - /admin-team.html ❌

2. **Check file exists on Vercel:**
   - Go to Vercel dashboard
   - Click latest deployment
   - Click "Source" tab
   - Look for "admin-team-performance.html"

3. **Try accessing directly:**
   - Right-click on page → View Page Source
   - Search for "radial-chart"
   - Should find CSS class and canvas elements

## Common Issues

### Issue 1: "Page not found" (404)
**Cause:** File not deployed to Vercel
**Fix:** Redeploy from Vercel dashboard

### Issue 2: Page loads but no charts
**Cause:** No team members in database
**Fix:** Add team members via /admin-user-management.html

### Issue 3: JavaScript errors in console
**Cause:** Supabase not configured or connection error
**Fix:** Check SUPABASE_URL and SUPABASE_ANON_KEY in page source

### Issue 4: Charts exist but are empty circles
**Cause:** No activity data in daily_activities table
**Fix:** Reps need to log activities in rep dashboard

## Quick Test

To see if the page is working at all, open console and run:

```javascript
// Force create a dummy chart
const canvas = document.createElement('canvas');
canvas.width = 200;
canvas.height = 200;
canvas.style.border = '1px solid white';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
ctx.beginPath();
ctx.arc(100, 100, 50, 0, 2 * Math.PI);
ctx.strokeStyle = '#10C3B0';
ctx.lineWidth = 10;
ctx.stroke();

console.log('If you see a circle above, canvas is working!');
```

## What to Report Back

Please tell me:
1. ✅ or ❌ Page loads (not 404)
2. ✅ or ❌ See page title "Team Performance Dashboard"
3. ✅ or ❌ JavaScript errors in console (copy them)
4. ✅ or ❌ See "Generate Coaching" buttons
5. ✅ or ❌ See any circles/charts
6. Number of team members in your database
7. Any activity data logged

This will help me figure out exactly what's wrong!
