-- ============================================
-- FIX SECURITY DEFINER VIEW WARNINGS
-- Converts problematic views to secure functions
-- ============================================

-- Drop the old views (these are causing security warnings)
DROP VIEW IF EXISTS "Conversion_Funnel";
DROP VIEW IF EXISTS "Revenue_Summary";
DROP VIEW IF EXISTS "Weekly_Performance";

-- ============================================
-- SECURE REPLACEMENT FUNCTIONS
-- These check admin permissions before returning data
-- ============================================

-- Weekly Performance (Admin Only)
CREATE OR REPLACE FUNCTION get_weekly_performance(admin_email TEXT)
RETURNS TABLE (
    week_start TIMESTAMP,
    total_dials BIGINT,
    total_conversations BIGINT,
    total_meetings BIGINT,
    conversation_rate NUMERIC,
    meeting_rate NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify admin access
    IF admin_email NOT IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com', 'john@oneclickcoaching.com') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Return aggregate data
    RETURN QUERY
    SELECT
        DATE_TRUNC('week', date)::TIMESTAMP as week_start,
        SUM(dials)::BIGINT as total_dials,
        SUM(conversations)::BIGINT as total_conversations,
        SUM(discovery_meetings)::BIGINT as total_meetings,
        ROUND(AVG(CASE WHEN dials > 0 THEN (conversations::DECIMAL / dials) * 100 ELSE 0 END), 2) as conversation_rate,
        ROUND(AVG(CASE WHEN conversations > 0 THEN (discovery_meetings::DECIMAL / conversations) * 100 ELSE 0 END), 2) as meeting_rate
    FROM "Daily_Tracker"
    GROUP BY week_start
    ORDER BY week_start DESC;
END;
$$;

-- Revenue Summary (Admin Only)
CREATE OR REPLACE FUNCTION get_revenue_summary(admin_email TEXT)
RETURNS TABLE (
    month TIMESTAMP,
    total_sales BIGINT,
    total_revenue NUMERIC,
    avg_sale_value NUMERIC,
    largest_sale NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify admin access
    IF admin_email NOT IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com', 'john@oneclickcoaching.com') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Return aggregate data
    RETURN QUERY
    SELECT
        DATE_TRUNC('month', date)::TIMESTAMP as month,
        COUNT(*)::BIGINT as total_sales,
        SUM(amount_cad) as total_revenue,
        AVG(amount_cad) as avg_sale_value,
        MAX(amount_cad) as largest_sale
    FROM "Sales"
    GROUP BY month
    ORDER BY month DESC;
END;
$$;

-- Conversion Funnel (Admin Only)
CREATE OR REPLACE FUNCTION get_conversion_funnel(admin_email TEXT)
RETURNS TABLE (
    total_dials BIGINT,
    total_conversations BIGINT,
    total_meetings BIGINT,
    total_sales BIGINT,
    total_revenue NUMERIC,
    dial_to_conversation_rate NUMERIC,
    conversation_to_meeting_rate NUMERIC,
    meeting_to_sale_rate NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify admin access
    IF admin_email NOT IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com', 'john@oneclickcoaching.com') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Return aggregate data
    RETURN QUERY
    SELECT
        SUM(dials)::BIGINT as total_dials,
        SUM(conversations)::BIGINT as total_conversations,
        SUM(discovery_meetings)::BIGINT as total_meetings,
        (SELECT COUNT(*)::BIGINT FROM "Sales") as total_sales,
        (SELECT SUM(amount_cad) FROM "Sales") as total_revenue,
        CASE
            WHEN SUM(dials) > 0 THEN ROUND((SUM(conversations)::DECIMAL / SUM(dials)) * 100, 2)
            ELSE 0
        END as dial_to_conversation_rate,
        CASE
            WHEN SUM(conversations) > 0 THEN ROUND((SUM(discovery_meetings)::DECIMAL / SUM(conversations)) * 100, 2)
            ELSE 0
        END as conversation_to_meeting_rate,
        CASE
            WHEN SUM(discovery_meetings) > 0 THEN ROUND(((SELECT COUNT(*)::DECIMAL FROM "Sales") / SUM(discovery_meetings)) * 100, 2)
            ELSE 0
        END as meeting_to_sale_rate
    FROM "Daily_Tracker";
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_weekly_performance(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_funnel(TEXT) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Security definer views successfully converted to secure functions!';
    RAISE NOTICE 'Use these functions instead:';
    RAISE NOTICE '  - get_weekly_performance(admin_email)';
    RAISE NOTICE '  - get_revenue_summary(admin_email)';
    RAISE NOTICE '  - get_conversion_funnel(admin_email)';
END $$;
