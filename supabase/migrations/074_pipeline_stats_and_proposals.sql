-- Migration 074: Add proposals goal type + get_pipeline_stats() function
-- Adds 'proposals' to the Goals goal_type constraint and creates
-- an RPC function for aggregating pipeline metrics.

-- 1. Expand Goals check constraint to include 'proposals'
ALTER TABLE "Goals" DROP CONSTRAINT IF EXISTS "Goals_goal_type_check";
ALTER TABLE "Goals" ADD CONSTRAINT "Goals_goal_type_check"
  CHECK (goal_type IN ('contacts', 'discovery_calls', 'sales', 'quota', 'sandler_score', 'proposals'));

-- 2. Pipeline stats function
CREATE OR REPLACE FUNCTION get_pipeline_stats(
  p_account_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_rep_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  rep_email TEXT,
  stage TEXT,
  actual_count NUMERIC,
  target NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY

  -- Calls: Synced_Activities (type=call) + Synced_Conversations (channel=phone)
  SELECT
    reps.email AS rep_email,
    'calls'::TEXT AS stage,
    (
      COALESCE((
        SELECT COUNT(*)::NUMERIC
        FROM "Synced_Activities" sa
        WHERE sa.account_id = p_account_id
          AND sa.activity_type = 'call'
          AND sa.activity_date >= p_start_date
          AND sa.activity_date <= p_end_date
          AND (p_rep_email IS NULL OR sa.rep_email = reps.email)
          AND sa.rep_email = reps.email
      ), 0)
      +
      COALESCE((
        SELECT COUNT(*)::NUMERIC
        FROM "Synced_Conversations" sc
        WHERE sc.account_id = p_account_id
          AND sc.channel = 'phone'
          AND sc.call_date >= p_start_date
          AND sc.call_date <= p_end_date
          AND (p_rep_email IS NULL OR sc.rep_email = reps.email)
          AND sc.rep_email = reps.email
      ), 0)
    ) AS actual_count,
    COALESCE((
      SELECT SUM(g.target_value)
      FROM "Goals" g
      WHERE g.account_id = p_account_id
        AND g.goal_type = 'contacts'
        AND g.period_start <= p_end_date
        AND g.period_end >= p_start_date
        AND (g.rep_email = reps.email OR g.rep_email IS NULL)
    ), 0) AS target

  FROM "Users" reps
  WHERE reps.account_id = p_account_id
    AND reps.role = 'rep'
    AND (p_rep_email IS NULL OR reps.email = p_rep_email)

  UNION ALL

  -- Discovery Meetings: Synced_Activities (type=meeting) + Synced_Conversations (channel=video_call)
  SELECT
    reps.email AS rep_email,
    'discovery'::TEXT AS stage,
    (
      COALESCE((
        SELECT COUNT(*)::NUMERIC
        FROM "Synced_Activities" sa
        WHERE sa.account_id = p_account_id
          AND sa.activity_type = 'meeting'
          AND sa.activity_date >= p_start_date
          AND sa.activity_date <= p_end_date
          AND sa.rep_email = reps.email
      ), 0)
      +
      COALESCE((
        SELECT COUNT(*)::NUMERIC
        FROM "Synced_Conversations" sc
        WHERE sc.account_id = p_account_id
          AND sc.channel = 'video_call'
          AND sc.call_date >= p_start_date
          AND sc.call_date <= p_end_date
          AND sc.rep_email = reps.email
      ), 0)
    ) AS actual_count,
    COALESCE((
      SELECT SUM(g.target_value)
      FROM "Goals" g
      WHERE g.account_id = p_account_id
        AND g.goal_type = 'discovery_calls'
        AND g.period_start <= p_end_date
        AND g.period_end >= p_start_date
        AND (g.rep_email = reps.email OR g.rep_email IS NULL)
    ), 0) AS target

  FROM "Users" reps
  WHERE reps.account_id = p_account_id
    AND reps.role = 'rep'
    AND (p_rep_email IS NULL OR reps.email = p_rep_email)

  UNION ALL

  -- Proposals: from Goals where goal_type = 'proposals'
  SELECT
    reps.email AS rep_email,
    'proposals'::TEXT AS stage,
    COALESCE((
      SELECT SUM(g.current_value)
      FROM "Goals" g
      WHERE g.account_id = p_account_id
        AND g.goal_type = 'proposals'
        AND g.period_start <= p_end_date
        AND g.period_end >= p_start_date
        AND (g.rep_email = reps.email OR g.rep_email IS NULL)
    ), 0) AS actual_count,
    COALESCE((
      SELECT SUM(g.target_value)
      FROM "Goals" g
      WHERE g.account_id = p_account_id
        AND g.goal_type = 'proposals'
        AND g.period_start <= p_end_date
        AND g.period_end >= p_start_date
        AND (g.rep_email = reps.email OR g.rep_email IS NULL)
    ), 0) AS target

  FROM "Users" reps
  WHERE reps.account_id = p_account_id
    AND reps.role = 'rep'
    AND (p_rep_email IS NULL OR reps.email = p_rep_email)

  UNION ALL

  -- Sales: from Goals where goal_type = 'sales'
  SELECT
    reps.email AS rep_email,
    'sales'::TEXT AS stage,
    COALESCE((
      SELECT SUM(g.current_value)
      FROM "Goals" g
      WHERE g.account_id = p_account_id
        AND g.goal_type = 'sales'
        AND g.period_start <= p_end_date
        AND g.period_end >= p_start_date
        AND (g.rep_email = reps.email OR g.rep_email IS NULL)
    ), 0) AS actual_count,
    COALESCE((
      SELECT SUM(g.target_value)
      FROM "Goals" g
      WHERE g.account_id = p_account_id
        AND g.goal_type = 'sales'
        AND g.period_start <= p_end_date
        AND g.period_end >= p_start_date
        AND (g.rep_email = reps.email OR g.rep_email IS NULL)
    ), 0) AS target

  FROM "Users" reps
  WHERE reps.account_id = p_account_id
    AND reps.role = 'rep'
    AND (p_rep_email IS NULL OR reps.email = p_rep_email);

END;
$$;

COMMENT ON FUNCTION get_pipeline_stats(UUID, DATE, DATE, TEXT) IS
  'Aggregates pipeline metrics (calls, discovery, proposals, sales) per rep with targets from Goals';

SELECT 'Migration 074 complete: proposals goal type + get_pipeline_stats()' AS status;
