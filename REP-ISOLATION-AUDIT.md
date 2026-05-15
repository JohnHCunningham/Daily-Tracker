# Rep Isolation Security Audit

## Overview
Audit of role-based access control (RBAC) to ensure reps can only see their own data, while admins/managers can see all team data.

---

## ✅ FIXED: Calls Page Bug

### Issue
**File:** `/app/(app)/calls/page.tsx`

**Problem:**
- Line 32: Didn't select `email` from Users table
- Line 50: Used `user.email` (from auth) instead of `userData.email` (from Users table)

**Impact:**
- Potential inconsistency if auth email differs from Users table email
- Rep could potentially see calls from wrong email

**Fix Applied:**
```typescript
// BEFORE:
const { data: userData } = await supabase
  .from('Users')
  .select('account_id, role')  // ❌ Missing 'email'
  .eq('auth_id', user.id)
  .single()

if (userData.role === 'rep') {
  query = query.eq('rep_email', user.email)  // ❌ Wrong source
}

// AFTER:
const { data: userData } = await supabase
  .from('Users')
  .select('account_id, role, email')  // ✅ Includes 'email'
  .eq('auth_id', user.id)
  .single()

if (userData.role === 'rep') {
  query = query.eq('rep_email', userData.email)  // ✅ Correct source
}
```

---

## ✅ VERIFIED: Correct Rep Isolation Implementation

### 1. Coaching Page ✅
**File:** `/app/(app)/coaching/page.tsx`

```typescript
// Line 52: Correctly selects email
.select('account_id, role, email')

// Line 68: Correctly uses userData.email
if (userData.role === 'rep') {
  query = query.eq('rep_email', userData.email)
}
```

**Status:** ✅ Correct - No changes needed

---

### 2. Goals Page ✅
**File:** `/app/(app)/goals/page.tsx`

```typescript
// Line 68: Correctly selects email
.select('account_id, role, email')

// Line 89: Correctly uses userData.email
if (userData.role === 'rep') {
  query = query.eq('rep_email', userData.email)
}
```

**Status:** ✅ Correct - No changes needed

---

### 3. Call Detail API ✅
**File:** `/app/api/calls/[callId]/route.ts`

```typescript
// Line 18: Correctly selects email
.select('account_id, email, role')

// Lines 32-34: Correctly filters by rep
if (currentUser.role === 'rep') {
  query = query.eq('rep_email', currentUser.email)
}
```

**Status:** ✅ Correct - No changes needed

---

### 4. Dashboard Page ✅
**File:** `/app/(app)/dashboard/page.tsx`

**Rep-specific data filtering:**
- Commitments (line 244): `query.eq('rep_email', email)`
- Calls (line 520): `.eq('rep_email', email)`
- Coaching messages (line 568): `.eq('rep_email', email)`

**Status:** ✅ Correct - No changes needed

---

## Rep Isolation Pattern (Standard)

All pages should follow this pattern for consistent rep isolation:

```typescript
// 1. Get authenticated user
const { data: { user } } = await supabase.auth.getUser()
if (!user) return

// 2. Get user data from Users table (MUST include 'email')
const { data: userData } = await supabase
  .from('Users')
  .select('account_id, role, email')  // ✅ Include email
  .eq('auth_id', user.id)
  .single()

if (!userData) return

// 3. Build query with account filter
let query = supabase
  .from('TableName')
  .select('*')
  .eq('account_id', userData.account_id)

// 4. Add rep filter if user is a rep
if (userData.role === 'rep') {
  query = query.eq('rep_email', userData.email)  // ✅ Use userData.email
}

// 5. Execute query
const { data } = await query
```

---

## Security Checklist

### ✅ Account-Level Isolation
All queries MUST filter by `account_id` first:
```typescript
.eq('account_id', userData.account_id)
```

### ✅ Role-Based Filtering
Reps MUST see only their own data:
```typescript
if (userData.role === 'rep') {
  query = query.eq('rep_email', userData.email)
}
```

### ✅ Email Source Consistency
ALWAYS use `userData.email` from Users table, NOT `user.email` from auth:
```typescript
// ❌ WRONG:
query.eq('rep_email', user.email)

// ✅ CORRECT:
query.eq('rep_email', userData.email)
```

---

## Files Audited

| File | Status | Notes |
|------|--------|-------|
| `/app/(app)/calls/page.tsx` | ✅ FIXED | Updated to use userData.email |
| `/app/(app)/coaching/page.tsx` | ✅ CORRECT | Already using userData.email |
| `/app/(app)/goals/page.tsx` | ✅ CORRECT | Already using userData.email |
| `/app/(app)/dashboard/page.tsx` | ✅ CORRECT | Properly filters all rep data |
| `/app/api/calls/[callId]/route.ts` | ✅ CORRECT | API properly restricts access |
| `/app/(app)/team/page.tsx` | ✅ VERIFIED | Filters rep lists correctly |
| `/app/(app)/team/[memberId]/page.tsx` | ✅ VERIFIED | Team member detail access OK |
| `/app/(app)/calls/[callId]/page.tsx` | ✅ VERIFIED | Uses API route (already secure) |

---

## Database-Level Security (RLS)

**Supabase Row Level Security (RLS)** should also enforce isolation at the database level:

### Recommended RLS Policies:

```sql
-- Synced_Conversations: Reps see only their calls
CREATE POLICY "Reps see own calls"
ON "Synced_Conversations"
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT account_id FROM "Users" WHERE auth_id = auth.uid()
  )
  AND (
    -- Admins/Managers see all calls in their account
    (SELECT role FROM "Users" WHERE auth_id = auth.uid()) IN ('admin', 'manager')
    OR
    -- Reps see only their own calls
    rep_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid())
  )
);

-- Coaching_Messages: Reps see only their coaching
CREATE POLICY "Reps see own coaching"
ON "Coaching_Messages"
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT account_id FROM "Users" WHERE auth_id = auth.uid()
  )
  AND (
    (SELECT role FROM "Users" WHERE auth_id = auth.uid()) IN ('admin', 'manager')
    OR
    rep_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid())
  )
);

-- Goals: Reps see only their goals
CREATE POLICY "Reps see own goals"
ON "Goals"
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT account_id FROM "Users" WHERE auth_id = auth.uid()
  )
  AND (
    (SELECT role FROM "Users" WHERE auth_id = auth.uid()) IN ('admin', 'manager')
    OR
    rep_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid())
  )
);
```

**Note:** Check if RLS policies are already implemented in Supabase migrations.

---

## Summary

### Changes Made
1. ✅ Fixed `/app/(app)/calls/page.tsx` to use `userData.email` consistently

### No Changes Needed
- All other pages already implement rep isolation correctly
- API routes properly restrict access based on role
- Database queries consistently filter by account_id first, then rep_email for reps

### Recommendation
- Consider adding/verifying RLS policies at database level for defense-in-depth
- All future pages should follow the standard pattern documented above

---

**Status:** ✅ Rep isolation audit COMPLETE - All pages now secure
