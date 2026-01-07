# Vercel Deployment Debug Steps

## Step 1: Check Vercel Dashboard

Go to: https://vercel.com/dashboard

1. Click on your "Daily-Tracker" project
2. Go to "Deployments" tab
3. Look at the most recent deployment
4. **Check the commit hash** - Does it match `d88e2f3`?
5. **Check the deployment time** - Is it recent (today)?

## Step 2: Check Which Files Vercel Deployed

In your latest deployment on Vercel:
1. Click "View Deployment"
2. Click "Source" tab
3. Look for these files:
   - `index.html` - Should be 188K in size, modified today
   - `landing-page/index.html` - Should have pricing section
   - `admin-team-performance.html` - Should have radial charts

## Step 3: Verify the Actual Content

Open your browser console (F12) and run:

```javascript
// Check if tabs exist
console.log('Tabs:', document.querySelectorAll('.tab-btn').length);
// Should show: 6

// Check if tab navigation function exists
console.log('Switch function:', typeof switchTab);
// Should show: "function"
```

## Step 4: Clear All Caches

1. **Browser Cache**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Vercel Edge Cache**: 
   - Go to Vercel project settings
   - Click "Caching" → "Purge Cache"
3. **DNS Cache**: 
   ```bash
   # Mac
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```

## Step 5: Check Root Directory Setting

In Vercel dashboard:
1. Go to Project Settings
2. Click "Git"
3. **Root Directory** should be: `.` (current directory)
4. **Framework Preset** should be: "Other" or blank

## Step 6: Force Redeploy

In Vercel dashboard:
1. Go to "Deployments"
2. Find the latest deployment
3. Click "..." menu → "Redeploy"
4. Check "Use existing Build Cache" should be **UNCHECKED**
5. Click "Redeploy"

## Step 7: Check if You're Looking at Right URL

Make sure you're NOT looking at:
- ❌ `https://daily-tracker-vp21.vercel.app/landing-page/` (this is just the marketing page)
- ❌ Old preview deployments

Should be looking at:
- ✅ `https://daily-tracker-vp21.vercel.app/` (rep dashboard with tabs)
- ✅ `https://daily-tracker-vp21.vercel.app/landing-page/` (pricing page)
- ✅ `https://daily-tracker-vp21.vercel.app/admin-team-performance.html` (manager dashboard)

## What You Should See:

### At Root (/)
- Tab navigation bar with 6 tabs
- Default tab: "Today" (active)
- Setup tab on the right with gold background

### At /landing-page/
- Hero: "Your Reps Aren't Following Your Sales Methodology"
- Science section: 4 study cards
- Pricing section: Monthly/Annual toggle

### At /admin-team-performance.html
- Radial performance charts
- "Generate Coaching" buttons

## Still Not Working?

Run this command to see what files are actually in your repo:

```bash
git ls-tree -r HEAD --name-only | grep -E "(index.html|admin-team-performance.html|landing-page)"
```

Expected output:
```
admin-team-performance.html
index.html
landing-page/index.html
```

If you don't see these, something is wrong with your git repo.
