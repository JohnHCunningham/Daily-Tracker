# Security Setup Guide

This guide will help you complete the security hardening of your Daily Tracker application.

## What Was Fixed

### ✅ 1. Removed Insecure API Key Reference
**Problem:** The application was trying to call the Claude API directly from the browser with an undefined `ANTHROPIC_API_KEY` variable.

**Solution:** Removed the legacy direct API call code. The app now **only** uses the secure Supabase Edge Function for conversation analysis.

**Files changed:** `index.html`

### ✅ 2. Replaced Client-Side Admin Authentication
**Problem:** The admin dashboard used a client-side password hash that could be easily bypassed via browser console.

**Solution:** Implemented proper Supabase Auth with email/password authentication and admin whitelist.

**Files changed:** `admin.html`

## What You Need to Do

### 🔴 1. Enable Supabase Authentication

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `daily-tracker`
3. Navigate to **Authentication** → **Providers**
4. Ensure **Email** provider is enabled
5. Configure email templates if desired

### 🔴 2. Create Admin User Account

Run these commands in your Supabase SQL Editor:

```sql
-- Create an admin user (replace with your email/password)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@aiadvantagesolutions.com', -- YOUR EMAIL HERE
  crypt('YourSecurePassword123!', gen_salt('bf')), -- YOUR PASSWORD HERE
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

**OR** use the Supabase Dashboard:
- Go to **Authentication** → **Users**
- Click **Add user**
- Choose **Create new user**
- Enter email and password

### 🔴 3. Update Admin Whitelist

Edit `/Users/johncunningham/Daily-Tracker/admin.html` and update the admin emails:

```javascript
const ADMIN_EMAILS = [
    'admin@aiadvantagesolutions.com',
    'john@aiadvantagesolutions.com',
    'your-email@example.com' // Add your email here
];
```

**IMPORTANT:** For production, move this whitelist to:
- A Supabase database table (`admin_users`)
- Environment variables
- Supabase Edge Function

### 🔴 4. Enable Row Level Security (RLS)

1. Open Supabase SQL Editor
2. Run the script: `/Users/johncunningham/Daily-Tracker/enable-rls.sql`
3. Verify RLS is enabled by running the verification query at the end of the script

**Why RLS matters:**
- Prevents unauthorized database access
- Enforces data access rules at the database level
- Protects against SQL injection and direct API abuse

### 🔴 5. Test Authentication

**For the main app (index.html):**
1. The app currently allows unauthenticated access for demo purposes
2. To require authentication, you'll need to add auth checks (future enhancement)

**For the admin dashboard (admin.html):**
1. Open `https://your-app.vercel.app/admin.html`
2. Try logging in with your admin email and password
3. Verify the dashboard loads correctly
4. Try logging in with a non-admin email (should be rejected)
5. Test logout functionality

### 🟡 6. Add HTML Sanitization (Recommended)

To prevent XSS attacks, add a sanitization library:

**Option 1: Use DOMPurify (recommended)**

Add to both `index.html` and `admin.html` in the `<head>` section:

```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

Then sanitize all user inputs before rendering:

```javascript
// Before:
element.innerHTML = userInput;

// After:
element.innerHTML = DOMPurify.sanitize(userInput);
```

**Option 2: Use textContent instead of innerHTML**

Where possible, use:
```javascript
element.textContent = userInput; // Safe - escapes HTML
```

## Security Checklist

- [ ] Supabase Auth enabled
- [ ] Admin user created
- [ ] Admin whitelist updated
- [ ] RLS enabled on all tables
- [ ] RLS policies tested
- [ ] Admin login tested
- [ ] Admin logout tested
- [ ] Non-admin access denied
- [ ] HTML sanitization added
- [ ] Edge Function deployed
- [ ] No hardcoded secrets in code

## Additional Recommendations

### 1. Environment Variables
Move sensitive config to environment variables:
```bash
# On Vercel
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
ADMIN_EMAILS=admin@example.com,john@example.com
```

### 2. Rate Limiting
Add rate limiting to prevent abuse:
- Use Supabase Edge Function middleware
- Or use Vercel Edge Middleware
- Or use Supabase API rate limits

### 3. Audit Logging
Track admin actions:
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  action TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Two-Factor Authentication
Enable 2FA for admin accounts:
- Go to Supabase Dashboard
- Authentication → Providers
- Enable Phone provider
- Implement 2FA flow

### 5. Session Management
Configure session timeouts in Supabase:
- Go to Authentication → Settings
- Set JWT expiry time
- Configure refresh token rotation

## Troubleshooting

### "Invalid login credentials"
- Verify the user exists in Supabase Auth
- Check the password is correct
- Ensure email is confirmed

### "Unauthorized: Not an admin account"
- Verify the email is in the `ADMIN_EMAILS` array
- Check for typos in email addresses
- Case-sensitive email matching

### "RLS policy violation"
- Ensure RLS policies are created
- Check user is authenticated
- Verify policy conditions match user context

### "Edge Function error"
- Ensure `analyze-conversation` Edge Function is deployed
- Check Edge Function has `ANTHROPIC_API_KEY` secret set
- Verify Edge Function logs in Supabase Dashboard

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Auth Guide: https://supabase.com/docs/guides/auth
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security

## Next Steps: MVP Features

After completing security setup, you can proceed with:
1. **Stripe Integration** - Add subscription payments
2. **User Roles** - Implement user, admin, super-admin roles
3. **CMS for Services** - Allow users to manage their offerings
4. **ICP Builder** - Ideal Customer Profile management
5. **White-Label Customization** - Custom branding per client
