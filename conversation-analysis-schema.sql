-- Conversation Analysis for Sandler Coaching
-- Add this to your existing Supabase database

-- ============================================
-- TABLE: Conversation_Analyses
-- Stores analyzed sales conversations with Sandler coaching
-- ============================================
CREATE TABLE IF NOT EXISTS "Conversation_Analyses" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Conversation Details
    conversation_title VARCHAR(255) NOT NULL,
    conversation_type VARCHAR(50) DEFAULT 'discovery', -- 'cold_call', 'discovery', 'demo', 'close', 'follow_up'
    duration_minutes INTEGER,
    prospect_name VARCHAR(255),
    transcript TEXT NOT NULL,

    -- Audio File Info (if uploaded)
    audio_file_url TEXT,
    audio_file_name VARCHAR(255),

    -- Sandler Scoring (1-10)
    overall_sandler_score DECIMAL(3, 1) CHECK (overall_sandler_score >= 0 AND overall_sandler_score <= 10),
    upfront_contract_score DECIMAL(3, 1),
    pain_funnel_score DECIMAL(3, 1),
    budget_discussion_score DECIMAL(3, 1),
    decision_process_score DECIMAL(3, 1),
    bonding_rapport_score DECIMAL(3, 1),
    talk_listen_ratio_score DECIMAL(3, 1),

    -- Analysis Results
    what_went_well TEXT[], -- Array of positive findings
    areas_to_improve TEXT[], -- Array of improvement areas
    specific_recommendations TEXT[], -- Actionable advice

    -- Metrics
    talk_percentage INTEGER, -- Percentage of time you talked (target: 30%)
    question_count INTEGER, -- Number of questions asked
    pain_identified BOOLEAN DEFAULT FALSE,
    budget_discussed BOOLEAN DEFAULT FALSE,
    decision_makers_identified BOOLEAN DEFAULT FALSE,
    upfront_contract_set BOOLEAN DEFAULT FALSE,
    negative_reverse_used BOOLEAN DEFAULT FALSE,

    -- AI Analysis
    full_analysis_json JSONB, -- Complete analysis from AI
    analyzed_by VARCHAR(50) DEFAULT 'claude-sonnet', -- Which AI model
    analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Tags for organization
    tags TEXT[]
);

-- ============================================
-- TABLE: Conversation_Improvement_Trends
-- Track improvement over time
-- ============================================
CREATE TABLE IF NOT EXISTS "Conversation_Improvement_Trends" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_start_date DATE NOT NULL,

    -- Average scores for the week
    avg_overall_score DECIMAL(3, 1),
    avg_upfront_contract DECIMAL(3, 1),
    avg_pain_funnel DECIMAL(3, 1),
    avg_budget_discussion DECIMAL(3, 1),
    avg_decision_process DECIMAL(3, 1),
    avg_bonding_rapport DECIMAL(3, 1),
    avg_talk_ratio DECIMAL(3, 1),

    -- Conversation count
    conversations_analyzed INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conversation_date ON "Conversation_Analyses"(date DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_score ON "Conversation_Analyses"(overall_sandler_score DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_type ON "Conversation_Analyses"(conversation_type);

-- ============================================
-- TRIGGER: Update timestamp
-- ============================================
DROP TRIGGER IF EXISTS update_conversation_analyses_updated_at ON "Conversation_Analyses";
CREATE TRIGGER update_conversation_analyses_updated_at
    BEFORE UPDATE ON "Conversation_Analyses"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEW: Recent Conversation Performance
-- ============================================
CREATE OR REPLACE VIEW "Recent_Conversation_Performance" AS
SELECT
    DATE_TRUNC('week', date) as week,
    COUNT(*) as conversations_analyzed,
    ROUND(AVG(overall_sandler_score), 1) as avg_sandler_score,
    ROUND(AVG(upfront_contract_score), 1) as avg_upfront_contract,
    ROUND(AVG(pain_funnel_score), 1) as avg_pain_funnel,
    ROUND(AVG(budget_discussion_score), 1) as avg_budget,
    ROUND(AVG(talk_percentage), 0) as avg_talk_percentage,
    SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END) as upfront_contracts_set,
    SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END) as pain_identified_count,
    SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END) as budget_discussed_count
FROM "Conversation_Analyses"
GROUP BY week
ORDER BY week DESC;

-- ============================================
-- VIEW: Best and Worst Calls
-- ============================================
CREATE OR REPLACE VIEW "Conversation_Highlights" AS
SELECT
    id,
    date,
    conversation_title,
    conversation_type,
    overall_sandler_score,
    CASE
        WHEN overall_sandler_score >= 8 THEN 'excellent'
        WHEN overall_sandler_score >= 6 THEN 'good'
        WHEN overall_sandler_score >= 4 THEN 'needs_work'
        ELSE 'poor'
    END as performance_category,
    what_went_well,
    areas_to_improve
FROM "Conversation_Analyses"
ORDER BY overall_sandler_score DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Conversation Analysis tables created!';
    RAISE NOTICE '   - Conversation_Analyses (main storage)';
    RAISE NOTICE '   - Conversation_Improvement_Trends (weekly tracking)';
    RAISE NOTICE '   - Recent_Conversation_Performance (view)';
    RAISE NOTICE '   - Conversation_Highlights (view)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ready to analyze sales conversations with Sandler methodology!';
END $$;
