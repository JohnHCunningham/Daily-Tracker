# Data Migration & Persistence Plan

## Problem
localStorage is domain-specific. When URLs change (preview → production), setup data appears "lost".

## Current Data Stored in localStorage
1. `icp` - Ideal Customer Profile
2. `salesScripts` - Sales scripts for different stages
3. `activityGoals` - Daily activity targets
4. `selectedMethodology` - Sales methodology choice
5. `monthlyQuota` - Revenue quota
6. `currentTab` - Last visited tab
7. `setupVisible` - Setup section visibility

## Solutions

### Short-term (Manual)
Use browser console to export/import data between URLs (see VERCEL_DEBUG.md)

### Medium-term (Add Export/Import UI)
Add buttons in Setup tab:
- 🔽 "Export Settings" → Downloads JSON file
- 🔼 "Import Settings" → Upload JSON file
- Allows users to manually backup/restore

### Long-term (Supabase Sync) ⭐ RECOMMENDED
Store all setup data in Supabase `user_metadata` or new `user_settings` table:

**Benefits:**
- Data persists across devices
- Survives domain changes
- Automatic backup
- Can be restored if localStorage clears

**Implementation:**
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  icp JSONB,
  sales_scripts JSONB,
  activity_goals JSONB,
  methodology TEXT,
  monthly_quota INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sync Strategy:**
- Save to BOTH localStorage (fast) AND Supabase (persistent)
- On page load: Load from Supabase → Populate localStorage
- On save: Save to localStorage → Debounced save to Supabase

## Priority
HIGH - Users should never lose setup data due to URL changes

## Next Steps
1. Add Supabase user_settings table
2. Update save functions to dual-write (localStorage + Supabase)
3. Update load functions to prefer Supabase, fallback to localStorage
4. Add "Last synced" indicator in UI
