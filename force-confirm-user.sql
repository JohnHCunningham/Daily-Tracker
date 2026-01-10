-- ============================================
-- FORCE CONFIRM USER AND RESET PASSWORD
-- Use this if you can't log in due to email confirmation
-- ============================================

-- Step 1: Check if user exists
SELECT
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users
WHERE email = 'john@aiadvantagesolutions.ca';

-- Step 2: Force confirm email (if NULL above)
UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'john@aiadvantagesolutions.ca';

-- Step 3: Verify it worked
SELECT
    email,
    email_confirmed_at,
    confirmed_at
FROM auth.users
WHERE email = 'john@aiadvantagesolutions.ca';

-- Now try logging in again!
-- If still having issues, check Supabase Dashboard → Authentication → Users
