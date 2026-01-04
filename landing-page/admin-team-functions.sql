-- =====================================================
-- MANAGER TEAM COACHING DASHBOARD - SECURITY DEFINER FUNCTIONS
-- =====================================================
--
-- These functions allow admin users to access all team data
-- while respecting RLS policies for regular users.
--
-- Admin emails: admin@aiadvantagesolutions.com, john@aiadvantagesolutions.ca
--
-- Created: 2025-12-25
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Check if current user is admin
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca');
END;
$$;

-- =====================================================
-- FUNCTION: get_team_overview
-- Purpose: Get all users with their top priority weakness and strength
-- Returns: Array of user summary objects
-- =====================================================

CREATE OR REPLACE FUNCTION get_team_overview(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  methodology TEXT,
  overall_score NUMERIC,
  total_calls INTEGER,
  top_priority_weakness JSONB,
  top_strength JSONB,
  quick_metrics JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  WITH user_insights AS (
    SELECT
      ca.user_id,
      u.raw_user_meta_data->>'name' as user_name,
      u.email as user_email,
      u.raw_user_meta_data->>'methodology' as methodology,

      -- Overall metrics
      AVG(ca.overall_quality_score) as avg_quality_score,
      COUNT(*) as call_count,

      -- Sandler methodology execution rates
      AVG(CASE WHEN ca.upfront_contract_set THEN 1.0 ELSE 0.0 END) * 100 as upfront_contract_rate,
      AVG(CASE WHEN ca.pain_identified THEN 1.0 ELSE 0.0 END) * 100 as pain_rate,
      AVG(CASE WHEN ca.budget_discussed THEN 1.0 ELSE 0.0 END) * 100 as budget_rate,
      AVG(CASE WHEN ca.decision_makers_identified THEN 1.0 ELSE 0.0 END) * 100 as decision_rate,
      AVG(ca.pain_funnel_score) as pain_score,
      AVG(ca.bonding_rapport_score) as rapport_score,
      AVG(ca.talk_percentage) as talk_ratio

    FROM Conversation_Analyses ca
    JOIN auth.users u ON ca.user_id = u.id
    WHERE ca.date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY ca.user_id, u.raw_user_meta_data, u.email
  )
  SELECT
    ui.user_id,
    ui.user_name,
    ui.user_email,
    ui.methodology,
    ROUND(ui.avg_quality_score, 1) as overall_score,
    ui.call_count::INTEGER,

    -- Top Priority Weakness (lowest execution rate)
    (
      SELECT jsonb_build_object(
        'category', category,
        'metric_name', metric_name,
        'execution_rate', ROUND(rate, 0),
        'severity', CASE
          WHEN rate < 50 THEN 'high'
          WHEN rate < 70 THEN 'medium'
          ELSE 'low'
        END,
        'coaching_prompt', prompt
      )
      FROM (
        SELECT
          'Methodology Execution' as category,
          'Upfront Contract' as metric_name,
          ui.upfront_contract_rate as rate,
          CASE
            WHEN ui.upfront_contract_rate < 50 THEN 'Upfront contracts are being skipped in most calls. What''s the plan to ensure every call starts with an upfront contract?'
            WHEN ui.upfront_contract_rate < 70 THEN 'Upfront contract usage is inconsistent. How can we make this a non-negotiable first step?'
            ELSE 'Strong upfront contract execution. Keep reinforcing this habit.'
          END as prompt
        UNION ALL
        SELECT
          'Methodology Execution',
          'Pain Funnel',
          ui.pain_rate,
          CASE
            WHEN ui.pain_rate < 50 THEN 'Pain identification is weak. Need to focus on asking deeper questions about problems and impact.'
            WHEN ui.pain_rate < 70 THEN 'Pain identification is inconsistent. Practice the pain funnel: Problem → Impact → Urgency.'
            ELSE 'Strong pain identification. Excellent job uncovering customer challenges.'
          END
        UNION ALL
        SELECT
          'Methodology Execution',
          'Budget Discussion',
          ui.budget_rate,
          CASE
            WHEN ui.budget_rate < 50 THEN 'Budget discussions are being avoided. What''s causing the hesitation to talk about money?'
            WHEN ui.budget_rate < 70 THEN 'Budget discussion needs improvement. Practice early qualification: "Do you have budget allocated?"'
            ELSE 'Strong budget qualification. Keep having early money conversations.'
          END
        UNION ALL
        SELECT
          'Methodology Execution',
          'Decision Process',
          ui.decision_rate,
          CASE
            WHEN ui.decision_rate < 50 THEN 'Decision makers are not being identified. Who else needs to be involved in these deals?'
            WHEN ui.decision_rate < 70 THEN 'Decision process identification is inconsistent. Always ask: "Who else is involved in this decision?"'
            ELSE 'Strong decision process mapping. Keep identifying all stakeholders early.'
          END
        UNION ALL
        SELECT
          'Talk Ratio',
          'Listening vs Talking',
          ui.talk_ratio,
          CASE
            WHEN ui.talk_ratio > 50 THEN 'Talking too much (' || ROUND(ui.talk_ratio, 0) || '%). Target is 30%. Focus on asking questions and active listening.'
            WHEN ui.talk_ratio > 35 THEN 'Talk ratio is slightly high (' || ROUND(ui.talk_ratio, 0) || '%). Aim for 30% talking, 70% listening.'
            ELSE 'Great talk ratio (' || ROUND(ui.talk_ratio, 0) || '%). Strong active listening skills.'
          END
      ) weaknesses
      ORDER BY rate ASC
      LIMIT 1
    ) as top_priority_weakness,

    -- Top Strength (highest execution rate)
    (
      SELECT jsonb_build_object(
        'category', category,
        'metric_name', metric_name,
        'execution_rate', ROUND(rate, 0),
        'message', message
      )
      FROM (
        SELECT
          'Methodology Execution' as category,
          'Upfront Contract' as metric_name,
          ui.upfront_contract_rate as rate,
          'Strong upfront contract execution in ' || ROUND(ui.upfront_contract_rate, 0) || '% of calls' as message
        UNION ALL
        SELECT
          'Methodology Execution',
          'Pain Funnel',
          ui.pain_rate,
          'Excellent pain identification in ' || ROUND(ui.pain_rate, 0) || '% of calls'
        UNION ALL
        SELECT
          'Methodology Execution',
          'Budget Discussion',
          ui.budget_rate,
          'Strong budget qualification in ' || ROUND(ui.budget_rate, 0) || '% of calls'
        UNION ALL
        SELECT
          'Methodology Execution',
          'Decision Process',
          ui.decision_rate,
          'Excellent decision process mapping in ' || ROUND(ui.decision_rate, 0) || '% of calls'
        UNION ALL
        SELECT
          'Quality Score',
          'Bonding & Rapport',
          ui.rapport_score,
          'Excellent rapport building (avg score: ' || ROUND(ui.rapport_score, 1) || '/10)'
      ) strengths
      WHERE rate >= 70  -- Only show actual strengths
      ORDER BY rate DESC
      LIMIT 1
    ) as top_strength,

    -- Quick Metrics
    jsonb_build_object(
      'calls_analyzed', ui.call_count,
      'avg_quality_score', ROUND(ui.avg_quality_score, 1),
      'avg_talk_ratio', ROUND(ui.talk_ratio, 0)
    ) as quick_metrics

  FROM user_insights ui
  ORDER BY ui.avg_quality_score DESC;
END;
$$;

-- =====================================================
-- FUNCTION: get_user_categorical_insights
-- Purpose: Deep analysis of methodology execution patterns
-- Returns: Categorical breakdown of strengths/weaknesses
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_categorical_insights(
  target_user_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  category TEXT,
  metric_name TEXT,
  execution_rate NUMERIC,
  calls_analyzed INTEGER,
  calls_executed INTEGER,
  severity TEXT,
  coaching_prompt TEXT,
  avg_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_methodology TEXT;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get user's methodology
  SELECT raw_user_meta_data->>'methodology' INTO user_methodology
  FROM auth.users WHERE id = target_user_id;

  -- Analyze based on methodology (currently supports Sandler)
  IF user_methodology = 'Sandler' OR user_methodology IS NULL THEN
    RETURN QUERY
    WITH metrics AS (
      SELECT
        COUNT(*) as total_calls,

        -- Upfront Contract
        SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END) as upfront_contract_count,
        AVG(CASE WHEN upfront_contract_set THEN 1.0 ELSE 0.0 END) * 100 as upfront_contract_rate,

        -- Pain Funnel
        SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END) as pain_count,
        AVG(CASE WHEN pain_identified THEN 1.0 ELSE 0.0 END) * 100 as pain_rate,
        AVG(pain_funnel_score) as pain_score,

        -- Budget Discussion
        SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END) as budget_count,
        AVG(CASE WHEN budget_discussed THEN 1.0 ELSE 0.0 END) * 100 as budget_rate,
        AVG(budget_discussion_score) as budget_score,

        -- Decision Process
        SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END) as decision_count,
        AVG(CASE WHEN decision_makers_identified THEN 1.0 ELSE 0.0 END) * 100 as decision_rate,
        AVG(decision_process_score) as decision_score,

        -- Bonding & Rapport
        AVG(bonding_rapport_score) as rapport_score,

        -- Talk Ratio
        AVG(talk_percentage) as talk_ratio,

        -- Negative Reverse
        SUM(CASE WHEN negative_reverse_used THEN 1 ELSE 0 END) as negative_reverse_count,
        AVG(CASE WHEN negative_reverse_used THEN 1.0 ELSE 0.0 END) * 100 as negative_reverse_rate

      FROM Conversation_Analyses
      WHERE user_id = target_user_id
        AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    )
    SELECT
      'Methodology Execution'::TEXT,
      'Upfront Contract'::TEXT,
      ROUND(m.upfront_contract_rate, 1),
      m.total_calls::INTEGER,
      m.upfront_contract_count::INTEGER,
      CASE
        WHEN m.upfront_contract_rate < 50 THEN 'high'
        WHEN m.upfront_contract_rate < 70 THEN 'medium'
        ELSE 'low'
      END::TEXT,
      CASE
        WHEN m.upfront_contract_rate < 50 THEN 'Upfront contracts are being skipped in most calls. What''s the plan to ensure every call starts with an upfront contract?'
        WHEN m.upfront_contract_rate < 70 THEN 'Upfront contract usage is inconsistent. How can we make this a non-negotiable first step?'
        ELSE 'Strong upfront contract execution. Keep reinforcing this habit.'
      END::TEXT,
      NULL::NUMERIC
    FROM metrics m

    UNION ALL

    SELECT
      'Methodology Execution'::TEXT,
      'Pain Funnel'::TEXT,
      ROUND(m.pain_rate, 1),
      m.total_calls::INTEGER,
      m.pain_count::INTEGER,
      CASE
        WHEN m.pain_rate < 50 THEN 'high'
        WHEN m.pain_rate < 70 THEN 'medium'
        ELSE 'low'
      END::TEXT,
      CASE
        WHEN m.pain_rate < 50 THEN 'Pain identification is weak. Need to focus on asking deeper questions about problems and impact.'
        WHEN m.pain_rate < 70 THEN 'Pain identification is inconsistent. Practice the pain funnel: Problem → Impact → Urgency.'
        ELSE 'Strong pain identification. Excellent job uncovering customer challenges.'
      END::TEXT,
      ROUND(m.pain_score, 1)
    FROM metrics m

    UNION ALL

    SELECT
      'Methodology Execution'::TEXT,
      'Budget Discussion'::TEXT,
      ROUND(m.budget_rate, 1),
      m.total_calls::INTEGER,
      m.budget_count::INTEGER,
      CASE
        WHEN m.budget_rate < 50 THEN 'high'
        WHEN m.budget_rate < 70 THEN 'medium'
        ELSE 'low'
      END::TEXT,
      CASE
        WHEN m.budget_rate < 50 THEN 'Budget discussions are being avoided. What''s causing the hesitation to talk about money?'
        WHEN m.budget_rate < 70 THEN 'Budget discussion needs improvement. Practice early qualification: "Do you have budget allocated?"'
        ELSE 'Strong budget qualification. Keep having early money conversations.'
      END::TEXT,
      ROUND(m.budget_score, 1)
    FROM metrics m

    UNION ALL

    SELECT
      'Methodology Execution'::TEXT,
      'Decision Process'::TEXT,
      ROUND(m.decision_rate, 1),
      m.total_calls::INTEGER,
      m.decision_count::INTEGER,
      CASE
        WHEN m.decision_rate < 50 THEN 'high'
        WHEN m.decision_rate < 70 THEN 'medium'
        ELSE 'low'
      END::TEXT,
      CASE
        WHEN m.decision_rate < 50 THEN 'Decision makers are not being identified. Who else needs to be involved in these deals?'
        WHEN m.decision_rate < 70 THEN 'Decision process identification is inconsistent. Always ask: "Who else is involved in this decision?"'
        ELSE 'Strong decision process mapping. Keep identifying all stakeholders early.'
      END::TEXT,
      ROUND(m.decision_score, 1)
    FROM metrics m

    UNION ALL

    SELECT
      'Quality Score'::TEXT,
      'Bonding & Rapport'::TEXT,
      ROUND(m.rapport_score * 10, 1), -- Convert to percentage
      m.total_calls::INTEGER,
      NULL::INTEGER,
      CASE
        WHEN m.rapport_score < 5 THEN 'high'
        WHEN m.rapport_score < 7 THEN 'medium'
        ELSE 'low'
      END::TEXT,
      CASE
        WHEN m.rapport_score < 5 THEN 'Rapport building needs significant improvement. Focus on building trust and connection early.'
        WHEN m.rapport_score < 7 THEN 'Rapport building is inconsistent. Practice active listening and finding common ground.'
        ELSE 'Excellent rapport building skills. Keep creating strong connections with prospects.'
      END::TEXT,
      ROUND(m.rapport_score, 1)
    FROM metrics m

    UNION ALL

    SELECT
      'Talk Ratio'::TEXT,
      'Listening vs Talking'::TEXT,
      ROUND(m.talk_ratio, 1),
      m.total_calls::INTEGER,
      NULL::INTEGER,
      CASE
        WHEN m.talk_ratio > 50 THEN 'high'
        WHEN m.talk_ratio > 35 THEN 'medium'
        ELSE 'low'
      END::TEXT,
      CASE
        WHEN m.talk_ratio > 50 THEN 'Talking too much (' || ROUND(m.talk_ratio, 0) || '%). Target is 30%. Focus on asking questions and active listening.'
        WHEN m.talk_ratio > 35 THEN 'Talk ratio is slightly high (' || ROUND(m.talk_ratio, 0) || '%). Aim for 30% talking, 70% listening.'
        ELSE 'Great talk ratio (' || ROUND(m.talk_ratio, 0) || '%). Strong active listening skills.'
      END::TEXT,
      ROUND(m.talk_ratio, 1)
    FROM metrics m

    UNION ALL

    SELECT
      'Advanced Technique'::TEXT,
      'Negative Reverse'::TEXT,
      ROUND(m.negative_reverse_rate, 1),
      m.total_calls::INTEGER,
      m.negative_reverse_count::INTEGER,
      CASE
        WHEN m.negative_reverse_rate < 30 THEN 'medium'
        WHEN m.negative_reverse_rate < 50 THEN 'low'
        ELSE 'low'
      END::TEXT,
      CASE
        WHEN m.negative_reverse_rate < 30 THEN 'Negative reverse technique is underutilized. This is a powerful tool for uncovering objections early.'
        WHEN m.negative_reverse_rate < 50 THEN 'Negative reverse usage is moderate. Look for more opportunities to use this technique.'
        ELSE 'Excellent use of negative reverse. Great job uncovering hidden objections.'
      END::TEXT,
      NULL::NUMERIC
    FROM metrics m;

  ELSE
    -- Future: Add support for other methodologies (MEDDIC, Challenger, etc.)
    RAISE EXCEPTION 'Methodology % not yet supported', user_methodology;
  END IF;
END;
$$;

-- =====================================================
-- FUNCTION: get_user_detail_metrics
-- Purpose: Full performance data for charts and detailed view
-- Returns: Time-series data, conversion metrics, activity stats
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_detail_metrics(
  target_user_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  calls_count INTEGER,
  avg_quality_score NUMERIC,
  avg_talk_ratio NUMERIC,
  upfront_contract_rate NUMERIC,
  pain_identification_rate NUMERIC,
  budget_discussion_rate NUMERIC,
  decision_makers_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    ca.date::DATE,
    COUNT(*)::INTEGER as calls_count,
    ROUND(AVG(ca.overall_quality_score), 1) as avg_quality_score,
    ROUND(AVG(ca.talk_percentage), 1) as avg_talk_ratio,
    ROUND(AVG(CASE WHEN ca.upfront_contract_set THEN 1.0 ELSE 0.0 END) * 100, 1) as upfront_contract_rate,
    ROUND(AVG(CASE WHEN ca.pain_identified THEN 1.0 ELSE 0.0 END) * 100, 1) as pain_identification_rate,
    ROUND(AVG(CASE WHEN ca.budget_discussed THEN 1.0 ELSE 0.0 END) * 100, 1) as budget_discussion_rate,
    ROUND(AVG(CASE WHEN ca.decision_makers_identified THEN 1.0 ELSE 0.0 END) * 100, 1) as decision_makers_rate
  FROM Conversation_Analyses ca
  WHERE ca.user_id = target_user_id
    AND ca.date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY ca.date::DATE
  ORDER BY ca.date::DATE ASC;
END;
$$;

-- =====================================================
-- FUNCTION: get_team_benchmarks
-- Purpose: Get team-wide averages for comparison
-- Returns: Current team benchmark data
-- =====================================================

CREATE OR REPLACE FUNCTION get_team_benchmarks()
RETURNS TABLE (
  team_size BIGINT,
  avg_upfront_contract_rate NUMERIC,
  avg_pain_identification_rate NUMERIC,
  avg_budget_discussion_rate NUMERIC,
  avg_decision_makers_rate NUMERIC,
  avg_pain_funnel_score NUMERIC,
  avg_budget_discussion_score NUMERIC,
  avg_decision_process_score NUMERIC,
  avg_bonding_rapport_score NUMERIC,
  avg_overall_quality_score NUMERIC,
  avg_talk_percentage NUMERIC,
  avg_negative_reverse_rate NUMERIC,
  total_conversations_analyzed BIGINT,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT * FROM Team_Benchmarks;
END;
$$;

-- =====================================================
-- FUNCTION: create_manager_note
-- Purpose: Create a coaching note for a user
-- =====================================================

CREATE OR REPLACE FUNCTION create_manager_note(
  target_user_id UUID,
  note_type TEXT,
  category TEXT,
  subject TEXT,
  content TEXT,
  severity TEXT DEFAULT 'medium',
  is_private BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_note_id UUID;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  INSERT INTO Manager_Notes (
    user_id,
    manager_id,
    note_type,
    category,
    subject,
    content,
    severity,
    is_private
  ) VALUES (
    target_user_id,
    auth.uid(),
    note_type,
    category,
    subject,
    content,
    severity,
    is_private
  )
  RETURNING id INTO new_note_id;

  RETURN new_note_id;
END;
$$;

-- =====================================================
-- FUNCTION: create_user_goal
-- Purpose: Create a goal for a user
-- =====================================================

CREATE OR REPLACE FUNCTION create_user_goal(
  target_user_id UUID,
  goal_type TEXT,
  category TEXT,
  title TEXT,
  description TEXT,
  target_metric TEXT,
  target_value NUMERIC,
  target_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_goal_id UUID;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  INSERT INTO User_Goals (
    user_id,
    manager_id,
    goal_type,
    category,
    title,
    description,
    target_metric,
    target_value,
    current_value,
    start_date,
    target_date,
    status,
    progress_percentage
  ) VALUES (
    target_user_id,
    auth.uid(),
    goal_type,
    category,
    title,
    description,
    target_metric,
    target_value,
    0, -- current_value starts at 0
    CURRENT_DATE,
    target_date,
    'active',
    0 -- progress_percentage starts at 0
  )
  RETURNING id INTO new_goal_id;

  RETURN new_goal_id;
END;
$$;

-- =====================================================
-- FUNCTION: update_goal_progress
-- Purpose: Update current value and progress percentage of a goal
-- =====================================================

CREATE OR REPLACE FUNCTION update_goal_progress(
  goal_id UUID,
  new_current_value NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  goal_target_value NUMERIC;
  new_progress NUMERIC;
  new_status TEXT;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get target value
  SELECT target_value INTO goal_target_value
  FROM User_Goals
  WHERE id = goal_id;

  -- Calculate progress percentage
  IF goal_target_value > 0 THEN
    new_progress := LEAST(100, (new_current_value / goal_target_value) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Determine status
  IF new_progress >= 100 THEN
    new_status := 'completed';
  ELSIF CURRENT_DATE > (SELECT target_date FROM User_Goals WHERE id = goal_id) THEN
    new_status := 'overdue';
  ELSE
    new_status := 'active';
  END IF;

  -- Update goal
  UPDATE User_Goals
  SET
    current_value = new_current_value,
    progress_percentage = new_progress,
    status = new_status
  WHERE id = goal_id;
END;
$$;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_overview TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_categorical_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_detail_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_benchmarks TO authenticated;
GRANT EXECUTE ON FUNCTION create_manager_note TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_goal TO authenticated;
GRANT EXECUTE ON FUNCTION update_goal_progress TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION is_admin IS 'Check if current user is an admin (john@aiadvantagesolutions.ca or admin@aiadvantagesolutions.com)';
COMMENT ON FUNCTION get_team_overview IS 'Get all users with top priority weakness and strength. Admin only.';
COMMENT ON FUNCTION get_user_categorical_insights IS 'Deep analysis of methodology execution patterns for a specific user. Admin only.';
COMMENT ON FUNCTION get_user_detail_metrics IS 'Time-series performance data for charts. Admin only.';
COMMENT ON FUNCTION get_team_benchmarks IS 'Get team-wide benchmark averages for comparison. Admin only.';
COMMENT ON FUNCTION create_manager_note IS 'Create a coaching note for a user. Admin only.';
COMMENT ON FUNCTION create_user_goal IS 'Create a goal for a user. Admin only.';
COMMENT ON FUNCTION update_goal_progress IS 'Update goal progress and status. Admin only.';
