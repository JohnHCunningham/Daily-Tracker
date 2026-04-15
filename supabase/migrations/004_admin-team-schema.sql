-- ============================================
-- Manager Team Coaching Dashboard - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- TABLE: Manager_Notes
-- Stores coaching notes from managers to users
-- ============================================
CREATE TABLE IF NOT EXISTS Manager_Notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Note content
    note_text TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general' NOT NULL,
    -- Types: 'strength', 'weakness', 'goal', 'general', 'praise', 'correction'

    -- Categorization (helps surface relevant notes)
    metric_category VARCHAR(50), -- 'activity', 'conversion', 'quality', 'consistency', 'methodology'
    related_metric VARCHAR(50),  -- 'dials', 'talk_ratio', 'pain_funnel', 'upfront_contract', etc.

    -- Visibility (always TRUE for transparency requirement)
    is_visible_to_user BOOLEAN DEFAULT TRUE NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_note_type CHECK (note_type IN (
      'strength', 'weakness', 'goal', 'general', 'praise', 'correction'
    ))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_manager_notes_user ON Manager_Notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manager_notes_manager ON Manager_Notes(manager_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manager_notes_category ON Manager_Notes(metric_category, note_type);

-- ============================================
-- TABLE: User_Goals
-- Tracks goals set by managers for users
-- ============================================
CREATE TABLE IF NOT EXISTS User_Goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    set_by_manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Goal definition
    metric_type VARCHAR(50) NOT NULL,
    -- 'dials', 'conversations', 'meetings', 'sales', 'revenue',
    -- 'conversion_rate', 'sandler_score', 'email_response_rate',
    -- 'upfront_contract_rate', 'pain_funnel_score', etc.
    target_value DECIMAL(10,2) NOT NULL CHECK (target_value > 0),

    -- Time period
    period VARCHAR(20) DEFAULT 'weekly' NOT NULL,
    -- 'daily', 'weekly', 'monthly', 'quarterly'
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    -- 'active', 'achieved', 'missed', 'abandoned'
    current_value DECIMAL(10,2) DEFAULT 0,
    last_calculated TIMESTAMPTZ,

    -- Additional context
    notes TEXT, -- Manager's explanation of why this goal
    reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_period CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'achieved', 'missed', 'abandoned'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON User_Goals(user_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON User_Goals(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_goals_metric ON User_Goals(metric_type, status);

-- ============================================
-- TRIGGER: Update timestamp on row update
-- ============================================
CREATE OR REPLACE FUNCTION update_manager_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_manager_notes_timestamp ON Manager_Notes;
CREATE TRIGGER update_manager_notes_timestamp
    BEFORE UPDATE ON Manager_Notes
    FOR EACH ROW
    EXECUTE FUNCTION update_manager_tables_timestamp();

DROP TRIGGER IF EXISTS update_user_goals_timestamp ON User_Goals;
CREATE TRIGGER update_user_goals_timestamp
    BEFORE UPDATE ON User_Goals
    FOR EACH ROW
    EXECUTE FUNCTION update_manager_tables_timestamp();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Manager_Notes RLS
ALTER TABLE Manager_Notes ENABLE ROW LEVEL SECURITY;

-- Managers can create notes
CREATE POLICY "Managers can create notes"
ON Manager_Notes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = manager_id AND
  auth.jwt()->>'email' IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com')
);

-- Managers can view their own notes
CREATE POLICY "Managers can view their notes"
ON Manager_Notes FOR SELECT TO authenticated
USING (manager_id = auth.uid());

-- Users can view notes about themselves (transparency)
CREATE POLICY "Users can view notes about themselves"
ON Manager_Notes FOR SELECT TO authenticated
USING (user_id = auth.uid() AND is_visible_to_user = TRUE);

-- Managers can update their notes
CREATE POLICY "Managers can update their notes"
ON Manager_Notes FOR UPDATE TO authenticated
USING (
  manager_id = auth.uid() AND
  auth.jwt()->>'email' IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com')
);

-- Managers can delete their notes
CREATE POLICY "Managers can delete their notes"
ON Manager_Notes FOR DELETE TO authenticated
USING (
  manager_id = auth.uid() AND
  auth.jwt()->>'email' IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com')
);

-- User_Goals RLS
ALTER TABLE User_Goals ENABLE ROW LEVEL SECURITY;

-- Managers can create goals
CREATE POLICY "Managers can create goals"
ON User_Goals FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = set_by_manager_id AND
  auth.jwt()->>'email' IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com')
);

-- Managers can view goals they set
CREATE POLICY "Managers can view goals they set"
ON User_Goals FOR SELECT TO authenticated
USING (set_by_manager_id = auth.uid());

-- Users can view their own goals
CREATE POLICY "Users can view their goals"
ON User_Goals FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Managers can update goals they set
CREATE POLICY "Managers can update goals"
ON User_Goals FOR UPDATE TO authenticated
USING (
  set_by_manager_id = auth.uid() AND
  auth.jwt()->>'email' IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com')
);

-- Managers can delete goals they set
CREATE POLICY "Managers can delete goals"
ON User_Goals FOR DELETE TO authenticated
USING (
  set_by_manager_id = auth.uid() AND
  auth.jwt()->>'email' IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com')
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Manager Team Coaching Dashboard - Schema Created!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - Manager_Notes (coaching feedback from managers to users)';
    RAISE NOTICE '  - User_Goals (performance goals set by managers)';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS Policies enabled:';
    RAISE NOTICE '  - Managers can create/view/edit/delete their own notes and goals';
    RAISE NOTICE '  - Users can view notes and goals about themselves (transparency)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Security: Only admins (john@oneclickcoaching.com, john@oneclickcoaching.com) can create notes/goals';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️  NEXT STEP: Run admin-team-functions.sql to create SECURITY DEFINER functions';
    RAISE NOTICE '';
END $$;
