-- ============================================
-- MULTI-METHODOLOGY CONVERSATION ANALYSIS SCHEMA
-- Supports: Sandler, MEDDIC, Challenger, SPIN, Gap Selling, Value Selling
-- ============================================

-- Add methodology tracking and additional fields to existing table
ALTER TABLE "Conversation_Analyses"
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS methodology VARCHAR(50) DEFAULT 'Sandler' CHECK (
    methodology IN ('Sandler', 'MEDDIC', 'Challenger', 'SPIN', 'Gap Selling', 'Value Selling', 'Custom')
);

-- ============================================
-- MEDDIC FIELDS
-- ============================================
ALTER TABLE "Conversation_Analyses"
-- Metrics
ADD COLUMN IF NOT EXISTS meddic_metrics_identified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meddic_metrics_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS meddic_metrics_notes TEXT,

-- Economic Buyer
ADD COLUMN IF NOT EXISTS meddic_economic_buyer_identified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meddic_economic_buyer_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS meddic_economic_buyer_name VARCHAR(255),

-- Decision Criteria
ADD COLUMN IF NOT EXISTS meddic_decision_criteria_mapped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meddic_decision_criteria_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS meddic_decision_criteria_notes TEXT,

-- Decision Process
ADD COLUMN IF NOT EXISTS meddic_decision_process_defined BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meddic_decision_process_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS meddic_decision_timeline VARCHAR(100),

-- Identify Pain
ADD COLUMN IF NOT EXISTS meddic_pain_identified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meddic_pain_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS meddic_pain_description TEXT,

-- Champion
ADD COLUMN IF NOT EXISTS meddic_champion_secured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS meddic_champion_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS meddic_champion_name VARCHAR(255),

-- Overall MEDDIC Score
ADD COLUMN IF NOT EXISTS overall_meddic_score DECIMAL(3, 1);

-- ============================================
-- CHALLENGER FIELDS
-- ============================================
ALTER TABLE "Conversation_Analyses"
-- Teach (Teach for Differentiation)
ADD COLUMN IF NOT EXISTS challenger_teach_executed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS challenger_teach_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS challenger_insight_shared TEXT,
ADD COLUMN IF NOT EXISTS challenger_reframe_attempted BOOLEAN DEFAULT FALSE,

-- Tailor (Tailor for Resonance)
ADD COLUMN IF NOT EXISTS challenger_tailor_executed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS challenger_tailor_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS challenger_personalization_notes TEXT,

-- Take Control (Take Control of Sale)
ADD COLUMN IF NOT EXISTS challenger_control_executed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS challenger_control_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS challenger_pushback_handled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS challenger_next_steps_clear BOOLEAN DEFAULT FALSE,

-- Constructive Tension
ADD COLUMN IF NOT EXISTS challenger_tension_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS challenger_tension_score DECIMAL(3, 1),

-- Overall Challenger Score
ADD COLUMN IF NOT EXISTS overall_challenger_score DECIMAL(3, 1);

-- ============================================
-- SPIN FIELDS
-- ============================================
ALTER TABLE "Conversation_Analyses"
-- Situation Questions
ADD COLUMN IF NOT EXISTS spin_situation_asked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spin_situation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spin_situation_score DECIMAL(3, 1),

-- Problem Questions
ADD COLUMN IF NOT EXISTS spin_problem_asked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spin_problem_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spin_problem_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS spin_problem_identified TEXT,

-- Implication Questions
ADD COLUMN IF NOT EXISTS spin_implication_asked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spin_implication_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spin_implication_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS spin_implication_explored TEXT,

-- Need-Payoff Questions
ADD COLUMN IF NOT EXISTS spin_needpayoff_asked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spin_needpayoff_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spin_needpayoff_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS spin_value_articulated TEXT,

-- Overall SPIN Score
ADD COLUMN IF NOT EXISTS overall_spin_score DECIMAL(3, 1);

-- ============================================
-- GAP SELLING FIELDS
-- ============================================
ALTER TABLE "Conversation_Analyses"
-- Current State Discovery
ADD COLUMN IF NOT EXISTS gap_current_state_discovered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gap_current_state_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS gap_current_state_description TEXT,

-- Future State Vision
ADD COLUMN IF NOT EXISTS gap_future_state_defined BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gap_future_state_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS gap_future_state_description TEXT,

-- Gap Identification
ADD COLUMN IF NOT EXISTS gap_identified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gap_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS gap_description TEXT,
ADD COLUMN IF NOT EXISTS gap_impact_quantified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gap_impact_value VARCHAR(100),

-- Root Cause Analysis
ADD COLUMN IF NOT EXISTS gap_root_cause_found BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gap_root_cause_description TEXT,

-- Overall Gap Selling Score
ADD COLUMN IF NOT EXISTS overall_gap_score DECIMAL(3, 1);

-- ============================================
-- VALUE SELLING FIELDS
-- ============================================
ALTER TABLE "Conversation_Analyses"
-- Business Value
ADD COLUMN IF NOT EXISTS value_business_discussed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS value_business_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS value_business_quantified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS value_business_amount VARCHAR(100),
ADD COLUMN IF NOT EXISTS value_business_description TEXT,

-- Personal Value
ADD COLUMN IF NOT EXISTS value_personal_discussed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS value_personal_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS value_personal_description TEXT,

-- ROI Presentation
ADD COLUMN IF NOT EXISTS value_roi_presented BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS value_roi_score DECIMAL(3, 1),
ADD COLUMN IF NOT EXISTS value_roi_timeframe VARCHAR(100),

-- Overall Value Selling Score
ADD COLUMN IF NOT EXISTS overall_value_score DECIMAL(3, 1);

-- ============================================
-- INDEXES FOR NEW FIELDS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conversation_methodology ON "Conversation_Analyses"(methodology);
CREATE INDEX IF NOT EXISTS idx_conversation_user_id ON "Conversation_Analyses"(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_user_date ON "Conversation_Analyses"(user_id, date DESC);

-- ============================================
-- UPDATED VIEW: Multi-Methodology Performance
-- ============================================
CREATE OR REPLACE VIEW "Methodology_Performance_Summary" AS
SELECT
    user_id,
    methodology,
    DATE_TRUNC('week', date) as week,
    COUNT(*) as conversations_analyzed,

    -- Sandler Metrics
    ROUND(AVG(overall_sandler_score), 1) as avg_sandler_score,
    ROUND(AVG(upfront_contract_score), 1) as avg_upfront_contract,
    ROUND(AVG(pain_funnel_score), 1) as avg_pain_funnel,
    SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END) as upfront_contracts_set,

    -- MEDDIC Metrics
    ROUND(AVG(overall_meddic_score), 1) as avg_meddic_score,
    SUM(CASE WHEN meddic_metrics_identified THEN 1 ELSE 0 END) as metrics_identified_count,
    SUM(CASE WHEN meddic_champion_secured THEN 1 ELSE 0 END) as champions_secured_count,

    -- Challenger Metrics
    ROUND(AVG(overall_challenger_score), 1) as avg_challenger_score,
    SUM(CASE WHEN challenger_teach_executed THEN 1 ELSE 0 END) as teach_executed_count,
    SUM(CASE WHEN challenger_control_executed THEN 1 ELSE 0 END) as control_executed_count,

    -- SPIN Metrics
    ROUND(AVG(overall_spin_score), 1) as avg_spin_score,
    ROUND(AVG(spin_implication_count), 0) as avg_implication_questions,

    -- Gap Selling Metrics
    ROUND(AVG(overall_gap_score), 1) as avg_gap_score,
    SUM(CASE WHEN gap_identified THEN 1 ELSE 0 END) as gaps_identified_count,

    -- Value Selling Metrics
    ROUND(AVG(overall_value_score), 1) as avg_value_score,
    SUM(CASE WHEN value_roi_presented THEN 1 ELSE 0 END) as roi_presented_count

FROM "Conversation_Analyses"
WHERE user_id IS NOT NULL
GROUP BY user_id, methodology, week
ORDER BY user_id, week DESC;

-- ============================================
-- FUNCTION: Get User's Primary Methodology
-- ============================================
CREATE OR REPLACE FUNCTION get_user_methodology(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_methodology TEXT;
BEGIN
    -- Try to get from user metadata first
    SELECT raw_user_meta_data->>'methodology'
    INTO user_methodology
    FROM auth.users
    WHERE id = target_user_id;

    -- If not set, get most used methodology from conversations
    IF user_methodology IS NULL THEN
        SELECT methodology
        INTO user_methodology
        FROM Conversation_Analyses
        WHERE user_id = target_user_id
        GROUP BY methodology
        ORDER BY COUNT(*) DESC
        LIMIT 1;
    END IF;

    -- Default to Sandler if still null
    RETURN COALESCE(user_methodology, 'Sandler');
END;
$$;

-- ============================================
-- RLS POLICIES FOR NEW FIELDS
-- ============================================

-- Users can view their own analyses
ALTER TABLE "Conversation_Analyses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation analyses"
    ON "Conversation_Analyses"
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation analyses"
    ON "Conversation_Analyses"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation analyses"
    ON "Conversation_Analyses"
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all conversation analyses"
    ON "Conversation_Analyses"
    FOR SELECT
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid())
        IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca')
    );

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Multi-Methodology Schema Updated!';
    RAISE NOTICE '   📊 Supported Methodologies:';
    RAISE NOTICE '      • Sandler (existing + enhanced)';
    RAISE NOTICE '      • MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion)';
    RAISE NOTICE '      • Challenger (Teach, Tailor, Take Control)';
    RAISE NOTICE '      • SPIN (Situation, Problem, Implication, Need-Payoff)';
    RAISE NOTICE '      • Gap Selling (Current State, Future State, Gap, Impact)';
    RAISE NOTICE '      • Value Selling (Business Value, Personal Value, ROI)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Dashboard will now dynamically display methodology-specific insights!';
END $$;
