# Next.js Vercel Deployment Checklist

## Before You Deploy

### 1. Local Testing
- [ ] Run `npm run build` locally - build must succeed with no errors
- [ ] Run `npm start` to test production build locally
- [ ] Test all pages and features in production mode
- [ ] Check browser console for errors

### 2. Environment Variables
- [ ] Create `.env.local` with all required API keys
- [ ] Add `.env.local` to `.gitignore` (never commit secrets!)
- [ ] Create `.env.example` with placeholder values for documentation
- [ ] List all required environment variables:
  - `OPENAI_API_KEY` (for AI chatbot)
  - Add others as needed

### 3. Git Repository
- [ ] All changes committed to Git
- [ ] Pushed to GitHub/GitLab
- [ ] Working on the correct branch (usually `main`)
- [ ] No uncommitted changes that would break the build

---

## Vercel Project Setup (CRITICAL SETTINGS)

### 1. Create Project
- [ ] Go to https://vercel.com/new
- [ ] Select your Git repository
- [ ] Click **"Import"**

### 2. Configure Build Settings (THIS IS WHERE THINGS GO WRONG!)

#### ⚠️ CRITICAL: Framework Preset
- [ ] **Framework Preset**: Select **"Next.js"** from dropdown
  - ❌ **NOT** "Other"
  - ❌ **NOT** blank
  - ✅ **MUST BE** "Next.js"
  - **If this is wrong, you'll get 404 errors!**

#### Root Directory (if Next.js app is in subdirectory)
- [ ] Click **"Edit"** next to Root Directory
- [ ] Enter subdirectory name: `landing-page` (or your folder name)
- [ ] Leave blank ONLY if Next.js is at repo root
- [ ] **If wrong, Vercel builds the wrong folder!**

#### Build & Development Settings (Usually Auto-Detected)
- [ ] **Build Command**: `npm run build` (or leave blank for auto-detect)
- [ ] **Output Directory**: Leave blank (Next.js default)
- [ ] **Install Command**: `npm install` (or leave blank for auto-detect)

#### Environment Variables
- [ ] Click **"Add Environment Variable"**
- [ ] Add each variable:
  - **Key**: `OPENAI_API_KEY`
  - **Value**: Your actual API key (paste it)
  - **Environments**: Check ALL THREE boxes:
    - ✅ Production
    - ✅ Preview
    - ✅ Development
- [ ] **NEVER** add duplicate environment variables!
- [ ] **Save** after adding each variable

### 3. Deploy
- [ ] Click **"Deploy"**
- [ ] Wait for build to complete (usually 1-2 minutes)
- [ ] Check build logs for errors

---

## Post-Deployment Verification

### 1. Check Deployment Status
- [ ] Deployment shows **"Ready"** with green checkmark
- [ ] Build time is reasonable (30-60 seconds for Next.js, NOT 3 seconds)
- [ ] No errors in build logs

### 2. Test the Live Site
- [ ] Click **"Visit"** button on deployment
- [ ] Verify landing page loads correctly
- [ ] Test all pages (not just homepage)
- [ ] Open browser console - check for errors
- [ ] Test all interactive features (chatbot, forms, etc.)

### 3. Verify Chatbot (if applicable)
- [ ] Chatbot button appears in bottom right corner
- [ ] Click chatbot - it opens
- [ ] Send a test message - AI responds (not error message)
- [ ] Check n8n webhook receives lead data (if applicable)

---

## Common Issues & Fixes

### Issue: Getting 404 errors on all pages
**Cause**: Framework Preset is NOT set to "Next.js"

**Fix**:
1. Go to **Settings** → **General**
2. Scroll to **"Build & Development Settings"**
3. Click **"Edit"** next to Framework Preset
4. Select **"Next.js"**
5. Click **"Save"**
6. Go to **Deployments** → **Redeploy**

---

### Issue: Chatbot shows error "I'm having trouble connecting"
**Cause**: `OPENAI_API_KEY` not set or set incorrectly

**Fix**:
1. Go to **Settings** → **Environment Variables**
2. Check if `OPENAI_API_KEY` exists
3. If missing, add it (see Environment Variables section above)
4. If exists, make sure **Production** is checked
5. Delete any duplicate entries (only ONE `OPENAI_API_KEY` should exist)
6. **Redeploy** after changing environment variables

---

### Issue: Build succeeds but wrong content shows
**Cause**: Root Directory is set incorrectly

**Fix**:
1. Go to **Settings** → **General**
2. Scroll to **"Root Directory"**
3. If Next.js is in subdirectory: Enter folder name (e.g., `landing-page`)
4. If Next.js is at repo root: Leave blank
5. Click **"Save"**
6. **Redeploy**

---

### Issue: Build takes only 3-5 seconds
**Cause**: Vercel is deploying static files, not building Next.js

**Fix**: Check Framework Preset and Root Directory (see above issues)

---

## Environment Variables Reference

### Required for SalesAI.Coach Landing Page:
- `OPENAI_API_KEY` - From https://platform.openai.com/api-keys

### How to Add:
1. **Settings** → **Environment Variables**
2. Click **"Add"**
3. **Key**: `OPENAI_API_KEY`
4. **Value**: `sk-proj-...` (your actual key)
5. **Environments**: Check **Production**, **Preview**, **Development**
6. Click **"Save"**
7. **Redeploy** (environment variables require redeploy to take effect!)

### Important:
- ❌ Never commit `.env.local` to Git
- ❌ Never have duplicate environment variables
- ✅ Always check all three environments (Production, Preview, Development)
- ✅ Always redeploy after changing environment variables

---

## Redeploying After Changes

### When to Redeploy:
- After changing environment variables
- After changing build settings (Framework Preset, Root Directory)
- After Git push (usually auto-deploys, but you can manually trigger)

### How to Redeploy:
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **⋯** (three dots)
4. Click **"Redeploy"**
5. Wait for deployment to complete
6. Click **"Visit"** to test

---

## Quick Troubleshooting Checklist

If something isn't working:

1. **Hard refresh browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
2. **Check Vercel deployment status**: Should say "Ready"
3. **Check Framework Preset**: Must be "Next.js"
4. **Check Root Directory**: Correct folder name if using subdirectory
5. **Check environment variables**: All set for Production
6. **Check build logs**: Look for errors
7. **Check browser console**: Look for runtime errors
8. **Try incognito window**: Rules out browser cache issues

---

## Success Criteria

You know the deployment is correct when:

✅ Deployment status shows "Ready"
✅ Build time is 30-60 seconds (not 3 seconds)
✅ Build logs show Next.js compilation
✅ Visiting site shows correct landing page
✅ No 404 errors
✅ Browser console has no errors
✅ Chatbot appears and responds
✅ All pages and features work

---

## Notes

- **Framework Preset = "Next.js"** is the #1 most important setting
- Always set environment variables for ALL environments (Production, Preview, Development)
- Always redeploy after changing settings or environment variables
- Keep only ONE of each environment variable (no duplicates)
- If using a subdirectory, set Root Directory correctly

---

Last updated: December 2024
