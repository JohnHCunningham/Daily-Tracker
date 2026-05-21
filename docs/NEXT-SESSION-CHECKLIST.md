# Next Session Checklist — After Fathom Support Responds

## Pre-Session: Check Email

- [ ] Fathom support has responded with OAuth app management instructions
- [ ] You have access to the OAuth app settings page

---

## Session 1: Complete Fathom Integration (30 minutes)

### Step 1: Update Fathom OAuth App (5 min)
- [ ] Navigate to Fathom OAuth app management page (from support email)
- [ ] Verify redirect URIs are correct:
  - Production: `https://oneclickcoaching-xeso.vercel.app/api/integrations/fathom/oauth/callback`
  - Development: same as production (or leave blank)
- [ ] If credentials changed, update Vercel and Supabase (see FATHOM-OAUTH-BLOCKER.md)
- [ ] If credentials changed, redeploy: `vercel --prod --yes`

### Step 2: Test Fathom OAuth Flow (10 min)
- [ ] Open https://oneclickcoaching-xeso.vercel.app/login
- [ ] Log in with manager account
- [ ] Navigate to /integrations/fathom
- [ ] Click "Connect to Fathom"
- [ ] Authorize with Google SSO
- [ ] Verify "Connected" status appears
- [ ] Document the exact URL for OAuth app management in FATHOM-OAUTH-BLOCKER.md

### Step 3: Test Fathom Sync (15 min)
- [ ] From dashboard or integrations page, click "Sync Now" for Fathom
- [ ] Wait 30 seconds
- [ ] Refresh dashboard
- [ ] Verify Synced_Conversations rows appear with:
  - Call date
  - Transcript text
  - Summary (if available)
- [ ] Check Supabase logs for any errors
- [ ] Mark Fathom integration as ✅ in JOHN-DASHBOARD.md

---

## Session 2: HubSpot Integration & Core Smoke Tests (45 minutes)

### HubSpot OAuth & Sync (20 min)
- [ ] Navigate to /integrations/hubspot
- [ ] Click "Connect to HubSpot"
- [ ] Authorize with your HubSpot portal
- [ ] Verify "Connected" status
- [ ] Click "Sync Now"
- [ ] Verify Synced_Conversations rows appear from HubSpot activities
- [ ] Check owner mappings are correct

### Core Smoke Tests (25 min)
- [ ] **Auth:** Manager login → dashboard loads correctly
- [ ] **Invite:** Send rep invite from /team/invite
- [ ] **Email:** Verify invite email sent via Resend logs
- [ ] **Invite accept:** Use invite link in new browser/incognito
- [ ] **Tenant isolation:** Rep can only see own calls, not other reps
- [ ] **Notes:** Create/edit note, verify it saves and loads
- [ ] **Team detail:** Open team member detail, verify account scoped
- [ ] **Call detail:** Open call detail, verify account scoped

---

## Session 3: Billing & Final Smoke Tests (45 minutes)

### Billing Flow (25 min)
- [ ] Verify Stripe test keys are active (not live keys)
- [ ] From /settings, click "Manage Subscription" or "Upgrade"
- [ ] Click checkout button
- [ ] Verify redirects to Stripe with:
  - Correct per-rep pricing ($50/mo or $500/yr)
  - Correct quantity (team size)
- [ ] Complete test checkout with Stripe test card: 4242 4242 4242 4242
- [ ] Verify redirects back to app
- [ ] Check database: Account.subscription_status = 'active'
- [ ] Check database: Account.rep_count and max_team_members updated
- [ ] Test billing portal: click "Manage Subscription" again
- [ ] Verify Stripe customer portal loads

### Billing Gate (10 min)
- [ ] In database, manually set Account.subscription_status = 'past_due'
- [ ] Refresh app
- [ ] Verify billing gate blocks access to dashboard/calls/team
- [ ] Verify settings/billing page is still accessible
- [ ] Reset subscription_status = 'active'
- [ ] Verify app content accessible again

### Final Checks (10 min)
- [ ] Check Vercel function logs for errors
- [ ] Check Supabase Edge Function logs for errors
- [ ] Verify no console errors in browser
- [ ] Test logout and re-login
- [ ] Mark all smoke tests as complete in JOHN-DASHBOARD.md

---

## Session 4: Custom Domain Switch (30 minutes)

**Only do this after all smoke tests pass on Vercel URL**

### Update URLs (15 min)
- [ ] In Fathom OAuth app settings, update redirect URIs:
  - Production: `https://app.oneclickcoaching.com/api/integrations/fathom/oauth/callback`
- [ ] Update Vercel env:
  ```bash
  cd /Users/johncunningham/oneclickcoaching
  echo "y" | vercel env rm NEXT_PUBLIC_APP_URL production
  echo "https://app.oneclickcoaching.com" | vercel env add NEXT_PUBLIC_APP_URL production
  ```
- [ ] Redeploy: `vercel --prod --yes`
- [ ] Wait for deployment to complete

### Re-test OAuth on Custom Domain (15 min)
- [ ] Open https://app.oneclickcoaching.com/login
- [ ] Log in
- [ ] Disconnect Fathom integration (from /integrations/fathom)
- [ ] Re-connect Fathom (to test new redirect URI)
- [ ] Verify successful connection
- [ ] Test Sync Now
- [ ] Verify conversations sync correctly
- [ ] Update JOHN-DASHBOARD.md: Production URL is now app.oneclickcoaching.com

---

## Completion Criteria

All sessions complete when:
- ✅ Fathom OAuth + sync working
- ✅ HubSpot OAuth + sync working
- ✅ All smoke tests documented as passing
- ✅ Billing checkout + webhook verified
- ✅ Custom domain (app.oneclickcoaching.com) is primary URL
- ✅ No critical errors in logs

---

## If Something Breaks

1. Check browser console for errors
2. Check Vercel deployment logs: https://vercel.com/john-cunninghams-projects-7f2beb2e/oneclickcoaching-xeso
3. Check Supabase Edge Function logs: https://supabase.com/dashboard/project/qwqlsbccwnwrdpcaccjz/functions
4. Check recent deployments and roll back if needed: `vercel rollback`
5. Reference: `/docs/JOHN-DASHBOARD.md` for current status
6. Reference: `/docs/FATHOM-OAUTH-BLOCKER.md` for OAuth issues
7. Reference: `/docs/DEPLOYMENT-READINESS.md` for deployment sequence

---

**Created:** 2026-05-20  
**Total estimated time:** 2.5 hours across 4 sessions  
**Current blocker:** Fathom OAuth app management access
