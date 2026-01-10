-- ============================================
-- EMERGENCY LOGIN FIX FOR DEMO
-- Run this NOW in Supabase SQL Editor
-- ============================================

-- Step 1: Check if user exists
SELECT id, email, email_confirmed_at, encrypted_password
FROM auth.users
WHERE email = 'john@aiadvantagesolutions.ca';

-- Step 2: Force confirm email (if user exists)
UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'john@aiadvantagesolutions.ca';

-- Step 3: Create manager account if doesn't exist
DO $$
DECLARE
    user_exists BOOLEAN;
    user_account_exists BOOLEAN;
BEGIN
    -- Check if user has account
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = 'john@aiadvantagesolutions.ca'
    ) INTO user_exists;

    IF user_exists THEN
        -- Check if they have manager role
        SELECT EXISTS(
            SELECT 1 FROM "User_Roles" ur
            JOIN auth.users u ON ur.user_id = u.id
            WHERE u.email = 'john@aiadvantagesolutions.ca'
        ) INTO user_account_exists;

        IF NOT user_account_exists THEN
            -- Create manager account for them
            PERFORM create_account_for_user('john@aiadvantagesolutions.ca', 'AI Advantage Solutions Demo');
            RAISE NOTICE '✅ Manager account created!';
        ELSE
            RAISE NOTICE '✅ Manager account already exists';
        END IF;
    ELSE
        RAISE NOTICE '❌ User does not exist - need to sign up first';
    END IF;
END $$;

-- Step 4: Verify everything is set up
SELECT
    u.email,
    u.email_confirmed_at,
    ur.role,
    a.company_name
FROM auth.users u
LEFT JOIN "User_Roles" ur ON u.id = ur.user_id
LEFT JOIN "Accounts" a ON ur.account_id = a.id
WHERE u.email = 'john@aiadvantagesolutions.ca';

-- If you see role = 'manager', you're ready!
-- Try logging in now with your password
