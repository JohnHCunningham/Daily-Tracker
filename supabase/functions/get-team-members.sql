-- ============================================
-- FUNCTION: get_team_members
-- Returns list of team members for a manager
-- ============================================
CREATE OR REPLACE FUNCTION get_team_members(manager_user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Return all users where manager_id matches the provided manager_user_id
    RETURN QUERY
    SELECT
        au.id,
        au.email,
        (au.raw_user_meta_data->>'first_name')::TEXT,
        (au.raw_user_meta_data->>'last_name')::TEXT,
        au.created_at
    FROM auth.users au
    WHERE au.raw_user_meta_data->>'manager_id' = manager_user_id::text
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_team_members(UUID) TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ get_team_members function created!';
    RAISE NOTICE '';
    RAISE NOTICE 'Usage:';
    RAISE NOTICE '  SELECT * FROM get_team_members(''<manager-uuid>'');';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️  NEXT STEP: Run this in Supabase SQL Editor';
    RAISE NOTICE '';
END $$;
