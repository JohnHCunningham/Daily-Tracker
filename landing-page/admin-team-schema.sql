-- =====================================================
-- MANAGER TEAM COACHING DASHBOARD - DATABASE SCHEMA
-- =====================================================
--
-- This schema supports the Manager Team Coaching Dashboard
-- which enables sales managers to:
-- 1. View team performance insights
-- 2. Leave coaching notes for team members
-- 3. Set and track goals
-- 4. Identify categorical methodology execution gaps
--
-- Created: 2025-12-25
-- =====================================================

-- =====================================================
-- TABLE: Manager_Notes
-- Purpose: Store coaching notes and feedback from managers
-- =====================================================

CREATE TABLE IF NOT EXISTS Manager_Notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('coaching', 'feedback', 'improvement', 'strength', 'concern', 'goal_discussion')),
  category TEXT, -- e.g., 'Upfront Contract', 'Pain Funnel', 'Talk Ratio', etc.
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  is_private BOOLEAN DEFAULT false, -- If true, user cannot see this note
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_manager_notes_user_id ON Manager_Notes(user_id);
CREATE INDEX IF NOT EXISTS idx_manager_notes_manager_id ON Manager_Notes(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_notes_created_at ON Manager_Notes(created_at DESC);

-- =====================================================
-- TABLE: User_Goals
-- Purpose: Track goals set for team members
-- =====================================================

CREATE TABLE IF NOT EXISTS User_Goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('methodology_execution', 'activity', 'conversion', 'revenue', 'skill_development', 'custom')),
  category TEXT, -- e.g., 'Upfront Contract', 'Pain Funnel', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_metric TEXT, -- e.g., '80% upfront contract usage'
  target_value NUMERIC,
  current_value NUMERIC,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'overdue')),
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON User_Goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_manager_id ON User_Goals(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON User_Goals(status);
CREATE INDEX IF NOT EXISTS idx_user_goals_target_date ON User_Goals(target_date);

-- =====================================================
-- TABLE: Team_Benchmarks (Materialized View)
-- Purpose: Pre-calculated team averages for comparison
-- Refreshed hourly via cron job
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS Team_Benchmarks AS
SELECT
  COUNT(DISTINCT user_id) as team_size,

  -- Sandler Methodology Benchmarks (from Conversation_Analyses)
  AVG(CASE WHEN upfront_contract_set THEN 1.0 ELSE 0.0 END) * 100 as avg_upfront_contract_rate,
  AVG(CASE WHEN pain_identified THEN 1.0 ELSE 0.0 END) * 100 as avg_pain_identification_rate,
  AVG(CASE WHEN budget_discussed THEN 1.0 ELSE 0.0 END) * 100 as avg_budget_discussion_rate,
  AVG(CASE WHEN decision_makers_identified THEN 1.0 ELSE 0.0 END) * 100 as avg_decision_makers_rate,

  -- Quality Scores
  AVG(pain_funnel_score) as avg_pain_funnel_score,
  AVG(budget_discussion_score) as avg_budget_discussion_score,
  AVG(decision_process_score) as avg_decision_process_score,
  AVG(bonding_rapport_score) as avg_bonding_rapport_score,
  AVG(overall_quality_score) as avg_overall_quality_score,

  -- Talk Ratio
  AVG(talk_percentage) as avg_talk_percentage,

  -- Negative Reverse Usage
  AVG(CASE WHEN negative_reverse_used THEN 1.0 ELSE 0.0 END) * 100 as avg_negative_reverse_rate,

  -- Activity Metrics (would need to join with other tables if they exist)
  COUNT(*) as total_conversations_analyzed,

  -- Timestamp
  NOW() as last_updated
FROM Conversation_Analyses
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_benchmarks_last_updated ON Team_Benchmarks(last_updated);

-- =====================================================
-- FUNCTION: Refresh Team Benchmarks
-- Purpose: Manually refresh the materialized view
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_team_benchmarks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY Team_Benchmarks;
END;
$$;

-- =====================================================
-- RLS POLICIES FOR MANAGER_NOTES
-- =====================================================

-- Enable RLS
ALTER TABLE Manager_Notes ENABLE ROW LEVEL SECURITY;

-- Users can see notes about them (unless marked private)
CREATE POLICY "Users can view their own notes (non-private)"
  ON Manager_Notes
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND is_private = false
  );

-- Managers (admin emails) can see and create all notes
CREATE POLICY "Admins can manage all notes"
  ON Manager_Notes
  FOR ALL
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca')
  );

-- =====================================================
-- RLS POLICIES FOR USER_GOALS
-- =====================================================

-- Enable RLS
ALTER TABLE User_Goals ENABLE ROW LEVEL SECURITY;

-- Users can see their own goals
CREATE POLICY "Users can view their own goals"
  ON User_Goals
  FOR SELECT
  USING (user_id = auth.uid());

-- Managers (admin emails) can manage all goals
CREATE POLICY "Admins can manage all goals"
  ON User_Goals
  FOR ALL
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca')
  );

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manager_notes_updated_at
  BEFORE UPDATE ON Manager_Notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON User_Goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT ON Manager_Notes TO authenticated;
GRANT SELECT ON User_Goals TO authenticated;

-- Grant full access to service role (for SECURITY DEFINER functions)
GRANT ALL ON Manager_Notes TO service_role;
GRANT ALL ON User_Goals TO service_role;
GRANT SELECT ON Team_Benchmarks TO authenticated;
GRANT SELECT ON Team_Benchmarks TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE Manager_Notes IS 'Coaching notes and feedback from managers to team members. Users can see non-private notes. Full transparency by default.';
COMMENT ON TABLE User_Goals IS 'Goals set by managers for team members. Visible to both managers and users.';
COMMENT ON MATERIALIZED VIEW Team_Benchmarks IS 'Pre-calculated team-wide benchmarks for performance comparison. Refreshed hourly.';
COMMENT ON FUNCTION refresh_team_benchmarks IS 'Manually refresh team benchmarks materialized view. Run hourly via cron.';

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Uncomment to insert sample data for testing:
/*
-- Sample manager note
INSERT INTO Manager_Notes (user_id, manager_id, note_type, category, subject, content, severity, is_private)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  (SELECT id FROM auth.users WHERE email = 'john@aiadvantagesolutions.ca'),
  'coaching',
  'Upfront Contract',
  'Need to improve upfront contract usage',
  'Noticed that upfront contracts are being skipped in 6 out of 10 calls. Let''s discuss strategies to make this a non-negotiable first step in every call.',
  'high',
  false
);

-- Sample goal
INSERT INTO User_Goals (user_id, manager_id, goal_type, category, title, description, target_metric, target_value, current_value, start_date, target_date, progress_percentage)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  (SELECT id FROM auth.users WHERE email = 'john@aiadvantagesolutions.ca'),
  'methodology_execution',
  'Upfront Contract',
  'Achieve 80% Upfront Contract Usage',
  'Set an upfront contract in at least 8 out of 10 sales calls by end of month',
  'upfront_contract_rate',
  80,
  40,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  25
);
*/
