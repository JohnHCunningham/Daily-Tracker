# Activity Attribution Bug - CRITICAL

**Date:** May 21, 2026  
**Status:** IN PROGRESS - Core issue identified, fix blocked

## The Problem

Activities sync from HubSpot but don't show up in rep dashboards. **Root cause: Email mismatch in attribution chain.**

## What We Found

### The Chain
1. HubSpot activities have owner ID (87481425, 92427440)
2. Owner mapping table maps HubSpot owner → OCC user
3. Activities stored in `Synced_Activities` with `rep_email` field
4. Dashboard queries filter by `rep_email`

### The Bug
- HubSpot owners have email `john@aiadvantagesolutions.ca` and `john@oneclickcoaching.com`
- These map to admin user `john+veso@oneclickcoaching.com` (user ID: 1c7ffd5c-7804-4e43-a296-f70ab434c161)
- Activities stored with `rep_email = "john@aiadvantagesolutions.ca"` (HubSpot email, not OCC email)
- Test rep `john+abc-rep@oneclickcoaching.com` (Harry Smith) gets zero activities
- Dashboard queries for rep email find nothing

### What We Fixed
1. ✅ Updated `hubspot-sync` Edge Function (deployed 2:55 PM UTC)
   - Added `occUserEmail` to OwnerMapping interface
   - Changed line 344 to use `occUserEmail` instead of `providerEmail`
   - Function fetches OCC user email from Users table during mapping

2. ✅ Created debug endpoints
   - `/api/debug/activities` - shows attribution status
   - `/api/debug/remap-owner` - manual mapping update
   - `/api/debug/fix-attribution` - comprehensive fix

### What's Blocked
The mapping update endpoints run but **don't persist**:
- Console shows `success: true`
- Database query shows mappings unchanged (still point to admin)
- Possible causes:
  - RLS policies blocking updates
  - Transaction rollback
  - Supabase client permissions
  - Silent failures in Edge Function

## Current State

### Database
```
Integration_User_Mappings:
- provider_user_id: 87481425 → occ_user_id: 1c7ffd5c-7804-4e43-a296-f70ab434c161 (admin)
- provider_user_id: 92427440 → occ_user_id: 1c7ffd5c-7804-4e43-a296-f70ab434c161 (admin)

Synced_Activities:
- All activities have rep_email: john@aiadvantagesolutions.ca (wrong)
- Should have: john+abc-rep@oneclickcoaching.com

Users:
- john+veso@oneclickcoaching.com (admin, ID: 1c7ffd5c-7804-4e43-a296-f70ab434c161)
- john+abc-rep@oneclickcoaching.com (rep, "Harry Smith") ← SHOULD GET ACTIVITIES
```

### Test Commands
```javascript
// Check current state
fetch('/api/debug/activities').then(r => r.json()).then(console.log)

// Try to fix (currently not persisting)
fetch('/api/debug/fix-attribution', { method: 'POST' }).then(r => r.json()).then(console.log)
```

## Next Steps (Fresh Session)

1. **Check RLS policies** on `Integration_User_Mappings` table
   - Does admin role have UPDATE permission?
   - Are there constraints blocking the update?

2. **Manual database fix** (if API blocked)
   - Get rep user ID: `SELECT id FROM "Users" WHERE email = 'john+abc-rep@oneclickcoaching.com'`
   - Update mappings directly in Supabase dashboard SQL editor
   - Delete old activities
   - Re-sync

3. **Verify HubSpot sync function** actually uses new code
   - Add console.log to see occUserEmail value
   - Check Supabase function logs after sync
   - Verify it's not using cached old code

4. **Long-term fix: Manual mapping UI**
   - Build admin interface to assign HubSpot owners → OCC users
   - Store overrides that persist across syncs
   - Surface in onboarding flow

## Why This Matters

**Critical for product:** Managers can't see rep activity, reps don't get credit. No visibility = no coaching = no product value.

**Required for onboarding:** Step 3 of manager onboarding is "See your reps' activities" - currently broken.

## Files Changed
- `supabase/functions/hubspot-sync/index.ts` - attribution logic
- `web/app/api/debug/activities/route.ts` - diagnostic endpoint
- `web/app/api/debug/remap-owner/route.ts` - manual mapping
- `web/app/api/debug/fix-attribution/route.ts` - comprehensive fix

## Commits
- 060abe2: CRITICAL FIX: Use OCC user email not HubSpot email
- 72cd59e: Add temporary remap endpoint
- 738b0d3: Add comprehensive fix-attribution endpoint
