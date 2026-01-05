-- ============================================
-- Add Role Field to Users
-- ============================================

-- Set admin role for admin users
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb
)
WHERE email IN (
    'admin@aiadvantagesolutions.com',
    'admin@aiadvantagesolutions.ca',
    'john@aiadvantagesolutions.com',
    'john@aiadvantagesolutions.ca'
);

-- Set rep role for all other users (team members)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"rep"'::jsonb
)
WHERE email NOT IN (
    'admin@aiadvantagesolutions.com',
    'admin@aiadvantagesolutions.ca',
    'john@aiadvantagesolutions.com',
    'john@aiadvantagesolutions.ca'
)
AND raw_user_meta_data->>'role' IS NULL;

-- Verify roles were set
SELECT
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'manager_id' as manager_id
FROM auth.users
ORDER BY
    CASE
        WHEN raw_user_meta_data->>'role' = 'admin' THEN 1
        ELSE 2
    END,
    email;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ User roles have been set!';
    RAISE NOTICE '';
    RAISE NOTICE 'Admins: admin@aiadvantagesolutions.com, admin@aiadvantagesolutions.ca, john@aiadvantagesolutions.com, john@aiadvantagesolutions.ca';
    RAISE NOTICE 'All other users: rep';
    RAISE NOTICE '';
END $$;
