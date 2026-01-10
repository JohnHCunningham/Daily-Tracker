-- ============================================
-- MIGRATE EXISTING USER TO MANAGER
-- Run this AFTER running account-management-schema.sql
-- Replace YOUR_EMAIL_HERE with your actual email
-- ============================================

-- Example usage:
-- SELECT create_account_for_user('your@email.com', 'Your Company Name');

-- Replace 'YOUR_EMAIL_HERE' with your actual email address:
SELECT create_account_for_user('YOUR_EMAIL_HERE', 'AI Advantage Solutions Demo');

-- This will:
-- 1. Create an account for you
-- 2. Set you as the manager/owner
-- 3. Set up white label with your company name
