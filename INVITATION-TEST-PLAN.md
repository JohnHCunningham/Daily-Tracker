# Team Invitation Testing - Step-by-Step Guide

## ✅ Environment Check

**Configured:**
- ✅ `RESEND_API_KEY` - Email sending works
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Database connection
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Auth works

**Missing (Non-Critical for Basic Testing):**
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - Only needed for new user signups via invite
- ⚠️ `NEXT_PUBLIC_APP_URL` - Falls back to request origin (should work)

**Impact:**
- Existing user accepts will work fine
- New user signups may need service role key (check if it's in Vercel env)

---

## 🧪 Test Scenario 1: Send Invitation (5 minutes)

### Step 1: Start Dev Server
```bash
cd /Users/johncunningham/oneclickcoaching/web
npm run dev
```

### Step 2: Sign In as Admin
1. Go to http://localhost:3000
2. Sign in with your admin account
3. Navigate to **Team** page

### Step 3: Send Test Invite
1. Click **"Invite Team Member"** button
2. Enter email: **[your-test-email@example.com]**
3. Select role: **Rep**
4. Click **"Send Invitation"**

### Expected Results:
✅ Success message appears
✅ Invitation appears in "Pending Invitations" list
✅ Shows email, role, expiration date
✅ "Copy Invite Link" button visible

### Step 4: Check Email
1. Check inbox at the email you invited
2. Look for email from "One Click Coaching"
3. Verify email contains:
   - Inviter name
   - Role (Rep)
   - "Accept invitation" button/link
   - Expiration date

**If Email Not Received:**
- Check spam folder
- Check Resend dashboard: https://resend.com/emails
- Look in browser console for any errors
- Check server logs for email send status

---

## 🧪 Test Scenario 2A: Accept Invite (Existing User)

**Prerequisites:** You have an existing account on a different team/account

### Step 1: Get Invite Link
From "Pending Invitations" list, click **"Copy Invite Link"**

### Step 2: Open Invite Link
1. Open invite link in browser (or click email link)
2. Should see accept-invite page

### Expected Page Content:
- Inviter name shown
- Role shown (e.g., "Rep")
- Company/team name
- Password field (for existing users)
- "Join Team" button

### Step 3: Enter Password
1. Enter your existing account password
2. Click "Join Team"

### Expected Results:
✅ Confetti animation 🎉
✅ Redirected to /dashboard
✅ You're now part of the new team
✅ Your role is "Rep"
✅ You see the new account's data (not your old account)

### Verification:
1. Check sidebar - should show new team name
2. Go to Team page - should see yourself listed as Rep
3. Check Invitations table in Supabase - status should be "accepted"

---

## 🧪 Test Scenario 2B: Accept Invite (New User)

**Prerequisites:** Use an email that doesn't have an account yet

### Step 1: Get Invite Link
From "Pending Invitations" list, click **"Copy Invite Link"**

### Step 2: Open Invite Link
1. Open invite link in **incognito/private browser**
2. Should see accept-invite page

### Expected Page Content:
- Inviter name shown
- Role shown
- Password field (to create new account)
- "Create Account & Join" button

### Step 3: Create Account
1. Enter a new password (8+ characters)
2. Click "Create Account & Join"

### Expected Results:
✅ Account created
✅ Confetti animation 🎉
✅ Redirected to /dashboard
✅ Signed in automatically
✅ Part of the inviting team
✅ Role assigned correctly

### Verification:
1. Check Users table in Supabase:
   - New user row exists
   - `account_id` matches inviter's account
   - `role` matches invitation role
   - `email` matches invitation email
2. Check Invitations table:
   - Status = "accepted"
3. Dashboard shows inviting team's data

---

## 🧪 Test Scenario 3: Edge Cases

### Test 3A: Expired Invitation
1. In Supabase, manually update an invitation:
   ```sql
   UPDATE "Invitations"
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE email = 'test@example.com';
   ```
2. Try to accept the invite

**Expected:** Error message: "Invalid or expired invitation"

### Test 3B: Already Accepted
1. Accept an invitation successfully
2. Try to use the same invite link again

**Expected:** Error message: "Invitation is not pending" or "Invalid invitation"

### Test 3C: Revoked Invitation
1. Send an invitation
2. Click "Revoke" button on pending invitation
3. Try to accept the revoked invite

**Expected:** Error message: "Invalid invitation"

### Test 3D: Wrong Email
1. Send invite to email A
2. Try to sign up with email B using invite link

**Expected:** Error message: "Invitation email does not match"

### Test 3E: Rep Tries to Invite
1. Sign in as a Rep
2. Try to access Team page
3. Try to send invitation

**Expected:**
- Team page either restricted or invite form hidden
- API returns 403 Forbidden if attempted

---

## 🧪 Test Scenario 4: Rep Slot Validation

**Prerequisites:** Account has limited rep slots (based on Stripe subscription)

### Step 1: Check Current Slots
1. Go to Settings → Billing
2. Note: Rep count (e.g., "3 / 5 reps")

### Step 2: Fill Slots
1. Invite reps until slots are full
2. Try to invite one more rep

**Expected:**
- Error message: "No rep slots available"
- Redirected to billing page
- Cannot create invitation

---

## 📊 Testing Checklist

### Basic Flow
- [ ] Admin can access Team page
- [ ] Send invitation form works
- [ ] Invitation appears in pending list
- [ ] Email sent successfully
- [ ] Email content correct (inviter, role, link)
- [ ] Copy invite link works
- [ ] Accept page loads correctly
- [ ] Existing user can accept
- [ ] New user can create account & accept
- [ ] Confetti shows on success
- [ ] Redirects to dashboard
- [ ] Role assigned correctly
- [ ] Account isolation works

### Security
- [ ] Rep cannot send invitations
- [ ] Manager in Account A cannot send for Account B
- [ ] Email must match invitation
- [ ] Expired invites rejected
- [ ] Already-accepted invites rejected
- [ ] Revoked invites rejected
- [ ] Tokens are secure (64 hex chars)

### Edge Cases
- [ ] Rep slot validation works
- [ ] Concurrent acceptance handling
- [ ] Invalid token handling
- [ ] Missing password handling
- [ ] Email deliverability (Gmail, Outlook)

---

## 🐛 Common Issues & Solutions

### Issue: Email Not Received
**Check:**
1. Resend dashboard for delivery status
2. Spam folder
3. RESEND_API_KEY is valid
4. Domain verification in Resend

**Solution:**
- Verify Resend API key
- Check Resend domain settings
- Use Resend's test mode

### Issue: "Invitation acceptance requires admin credentials"
**Cause:** `SUPABASE_SERVICE_ROLE_KEY` missing

**Solution:**
Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Get from: Supabase Dashboard → Settings → API → service_role key

### Issue: Accept page shows 404
**Cause:** Route not found or build issue

**Solution:**
```bash
# Restart dev server
npm run dev

# Or rebuild
npm run build
```

### Issue: "Invalid or expired invitation"
**Check:**
1. Invitation status in Supabase (should be 'pending')
2. Expiration date (default 7 days)
3. Token matches URL

**Solution:**
- Create new invitation if expired
- Check Invitations table for status

### Issue: User added but wrong role
**Check:**
1. Invitation.role field
2. Users.role after acceptance
3. RLS policies on Users table

**Solution:**
- Verify invitation created with correct role
- Check `accept_invitation()` function logic

---

## 🔍 Debugging Tools

### Check Invitation in Database
```sql
SELECT
  id,
  email,
  role,
  status,
  expires_at,
  token
FROM "Invitations"
WHERE email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 5;
```

### Check User Creation
```sql
SELECT
  id,
  email,
  role,
  account_id,
  created_at
FROM "Users"
WHERE email = 'test@example.com';
```

### Check API Logs
```bash
# Dev server logs
# Look for:
# - "Invite email would be sent:" (no Resend key)
# - "Resend invite failed:" (email error)
# - 200 response = success
```

---

## ✅ Success Criteria

**Test passes if:**
1. ✅ Admin can send invitations
2. ✅ Email received with correct content
3. ✅ Accept link works
4. ✅ New user can create account
5. ✅ Existing user can join team
6. ✅ Role assigned correctly
7. ✅ Account isolation maintained
8. ✅ Expired/invalid invites rejected
9. ✅ Rep slot validation works
10. ✅ Security checks pass

---

## 🎯 Next Steps After Testing

**If all tests pass:**
- ✅ Mark #1 (Team Invitations) as production-ready
- Move to #2 (1-on-1 Notes)

**If issues found:**
- Document specific errors
- Check relevant code sections
- Fix and re-test
- Consider adding automated tests
