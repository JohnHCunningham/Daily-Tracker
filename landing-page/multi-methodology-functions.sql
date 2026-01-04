-- ============================================
-- MULTI-METHODOLOGY ANALYSIS FUNCTIONS
-- ============================================

-- ============================================
-- MEDDIC ANALYSIS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION analyze_meddic_execution(
    target_user_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    component TEXT,
    execution_rate NUMERIC,
    calls_executed INTEGER,
    calls_analyzed INTEGER,
    severity TEXT,
    coaching_prompt TEXT,
    detail_note TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH meddic_stats AS (
        SELECT
            COUNT(*) as total_calls,
            SUM(CASE WHEN meddic_metrics_identified THEN 1 ELSE 0 END) as metrics_count,
            SUM(CASE WHEN meddic_economic_buyer_identified THEN 1 ELSE 0 END) as economic_buyer_count,
            SUM(CASE WHEN meddic_decision_criteria_mapped THEN 1 ELSE 0 END) as decision_criteria_count,
            SUM(CASE WHEN meddic_decision_process_defined THEN 1 ELSE 0 END) as decision_process_count,
            SUM(CASE WHEN meddic_pain_identified THEN 1 ELSE 0 END) as pain_count,
            SUM(CASE WHEN meddic_champion_secured THEN 1 ELSE 0 END) as champion_count
        FROM Conversation_Analyses
        WHERE user_id = target_user_id
        AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        AND methodology = 'MEDDIC'
    )
    SELECT
        'Metrics' as component,
        CASE WHEN total_calls > 0 THEN (metrics_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        metrics_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (metrics_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (metrics_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking MEDDIC conversations to build baseline'
            WHEN (metrics_count::NUMERIC / total_calls) < 0.5 THEN 'Quantifiable metrics missing in most calls. What''s the plan to identify business metrics early?'
            WHEN (metrics_count::NUMERIC / total_calls) < 0.7 THEN 'Metrics identification is inconsistent. How can we make this a discovery call requirement?'
            ELSE 'Strong metrics identification. Keep quantifying business impact.'
        END,
        'Identify and quantify business metrics that matter to the prospect'
    FROM meddic_stats

    UNION ALL

    SELECT
        'Economic Buyer' as component,
        CASE WHEN total_calls > 0 THEN (economic_buyer_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        economic_buyer_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (economic_buyer_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (economic_buyer_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking MEDDIC conversations to build baseline'
            WHEN (economic_buyer_count::NUMERIC / total_calls) < 0.5 THEN 'Economic buyer not identified in most deals. Are we engaging budget holders?'
            WHEN (economic_buyer_count::NUMERIC / total_calls) < 0.7 THEN 'Economic buyer identification needs improvement. How do we get to the money?'
            ELSE 'Excellent economic buyer engagement. Keep securing access to budget authority.'
        END,
        'Identify and engage the person with budget authority'
    FROM meddic_stats

    UNION ALL

    SELECT
        'Decision Criteria' as component,
        CASE WHEN total_calls > 0 THEN (decision_criteria_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        decision_criteria_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (decision_criteria_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (decision_criteria_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking MEDDIC conversations to build baseline'
            WHEN (decision_criteria_count::NUMERIC / total_calls) < 0.5 THEN 'Decision criteria not mapped in most calls. How will they evaluate solutions?'
            WHEN (decision_criteria_count::NUMERIC / total_calls) < 0.7 THEN 'Decision criteria mapping is inconsistent. What''s our discovery process?'
            ELSE 'Strong decision criteria mapping. Keep aligning solution to requirements.'
        END,
        'Map out how the prospect will evaluate and select vendors'
    FROM meddic_stats

    UNION ALL

    SELECT
        'Decision Process' as component,
        CASE WHEN total_calls > 0 THEN (decision_process_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        decision_process_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (decision_process_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (decision_process_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking MEDDIC conversations to build baseline'
            WHEN (decision_process_count::NUMERIC / total_calls) < 0.5 THEN 'Decision process undefined in most deals. When will they make a decision?'
            WHEN (decision_process_count::NUMERIC / total_calls) < 0.7 THEN 'Decision process clarity needs work. How can we map the buying journey?'
            ELSE 'Excellent decision process mapping. Keep defining timelines and stakeholders.'
        END,
        'Define the buying timeline, stakeholders, and approval process'
    FROM meddic_stats

    UNION ALL

    SELECT
        'Identify Pain' as component,
        CASE WHEN total_calls > 0 THEN (pain_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        pain_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (pain_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (pain_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking MEDDIC conversations to build baseline'
            WHEN (pain_count::NUMERIC / total_calls) < 0.5 THEN 'Business pain not identified in most calls. What problems are we solving?'
            WHEN (pain_count::NUMERIC / total_calls) < 0.7 THEN 'Pain identification is inconsistent. How do we uncover compelling events?'
            ELSE 'Strong pain identification. Keep connecting to business impact.'
        END,
        'Uncover the business problem and its impact on the organization'
    FROM meddic_stats

    UNION ALL

    SELECT
        'Champion' as component,
        CASE WHEN total_calls > 0 THEN (champion_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        champion_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (champion_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (champion_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking MEDDIC conversations to build baseline'
            WHEN (champion_count::NUMERIC / total_calls) < 0.5 THEN 'Champions not secured in most deals. Who is our internal advocate?'
            WHEN (champion_count::NUMERIC / total_calls) < 0.7 THEN 'Champion development needs work. How do we build internal allies?'
            ELSE 'Excellent champion development. Keep nurturing internal advocates.'
        END,
        'Develop an internal advocate who will sell for you when you''re not in the room'
    FROM meddic_stats;
END;
$$;

-- ============================================
-- CHALLENGER ANALYSIS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION analyze_challenger_execution(
    target_user_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    component TEXT,
    execution_rate NUMERIC,
    calls_executed INTEGER,
    calls_analyzed INTEGER,
    severity TEXT,
    coaching_prompt TEXT,
    detail_note TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH challenger_stats AS (
        SELECT
            COUNT(*) as total_calls,
            SUM(CASE WHEN challenger_teach_executed THEN 1 ELSE 0 END) as teach_count,
            SUM(CASE WHEN challenger_tailor_executed THEN 1 ELSE 0 END) as tailor_count,
            SUM(CASE WHEN challenger_control_executed THEN 1 ELSE 0 END) as control_count,
            SUM(CASE WHEN challenger_tension_created THEN 1 ELSE 0 END) as tension_count,
            SUM(CASE WHEN challenger_reframe_attempted THEN 1 ELSE 0 END) as reframe_count
        FROM Conversation_Analyses
        WHERE user_id = target_user_id
        AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        AND methodology = 'Challenger'
    )
    SELECT
        'Teach (Commercial Insight)' as component,
        CASE WHEN total_calls > 0 THEN (teach_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        teach_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (teach_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (teach_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Challenger conversations to build baseline'
            WHEN (teach_count::NUMERIC / total_calls) < 0.5 THEN 'Not teaching customers anything new. Where''s our commercial insight?'
            WHEN (teach_count::NUMERIC / total_calls) < 0.7 THEN 'Teaching moments are inconsistent. How can we lead with insight?'
            ELSE 'Strong insight delivery. Keep reframing how customers think.'
        END,
        'Share unique insights that challenge the prospect''s thinking and reframe their perspective'
    FROM challenger_stats

    UNION ALL

    SELECT
        'Tailor (Resonance)' as component,
        CASE WHEN total_calls > 0 THEN (tailor_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        tailor_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (tailor_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (tailor_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Challenger conversations to build baseline'
            WHEN (tailor_count::NUMERIC / total_calls) < 0.5 THEN 'Generic pitches dominate. Are we personalizing for stakeholder priorities?'
            WHEN (tailor_count::NUMERIC / total_calls) < 0.7 THEN 'Tailoring needs improvement. How do we customize for each stakeholder?'
            ELSE 'Excellent personalization. Keep connecting insights to individual priorities.'
        END,
        'Customize the message for different stakeholders based on their priorities and role'
    FROM challenger_stats

    UNION ALL

    SELECT
        'Take Control (Assertiveness)' as component,
        CASE WHEN total_calls > 0 THEN (control_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        control_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (control_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (control_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Challenger conversations to build baseline'
            WHEN (control_count::NUMERIC / total_calls) < 0.5 THEN 'Not taking control of conversations. Are we being too passive?'
            WHEN (control_count::NUMERIC / total_calls) < 0.7 THEN 'Assertiveness is inconsistent. When should we push back?'
            ELSE 'Strong control of the sale. Keep being assertive when needed.'
        END,
        'Be assertive about next steps, push back on objections, and maintain momentum'
    FROM challenger_stats

    UNION ALL

    SELECT
        'Constructive Tension' as component,
        CASE WHEN total_calls > 0 THEN (tension_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        tension_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (tension_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (tension_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Challenger conversations to build baseline'
            WHEN (tension_count::NUMERIC / total_calls) < 0.5 THEN 'Too comfortable. Where''s the constructive tension driving urgency?'
            WHEN (tension_count::NUMERIC / total_calls) < 0.7 THEN 'Tension creation needs work. How do we highlight cost of inaction?'
            ELSE 'Good tension creation. Keep creating urgency without being aggressive.'
        END,
        'Create productive discomfort that drives the prospect to take action'
    FROM challenger_stats;
END;
$$;

-- ============================================
-- SPIN ANALYSIS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION analyze_spin_execution(
    target_user_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    component TEXT,
    execution_rate NUMERIC,
    avg_question_count NUMERIC,
    calls_analyzed INTEGER,
    severity TEXT,
    coaching_prompt TEXT,
    detail_note TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH spin_stats AS (
        SELECT
            COUNT(*) as total_calls,
            SUM(CASE WHEN spin_situation_asked THEN 1 ELSE 0 END) as situation_count,
            SUM(CASE WHEN spin_problem_asked THEN 1 ELSE 0 END) as problem_count,
            SUM(CASE WHEN spin_implication_asked THEN 1 ELSE 0 END) as implication_count,
            SUM(CASE WHEN spin_needpayoff_asked THEN 1 ELSE 0 END) as needpayoff_count,
            ROUND(AVG(spin_situation_count), 1) as avg_situation_qs,
            ROUND(AVG(spin_problem_count), 1) as avg_problem_qs,
            ROUND(AVG(spin_implication_count), 1) as avg_implication_qs,
            ROUND(AVG(spin_needpayoff_count), 1) as avg_needpayoff_qs
        FROM Conversation_Analyses
        WHERE user_id = target_user_id
        AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        AND methodology = 'SPIN'
    )
    SELECT
        'Situation Questions' as component,
        CASE WHEN total_calls > 0 THEN (situation_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        COALESCE(avg_situation_qs, 0),
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN avg_situation_qs < 2 THEN 'medium'
            WHEN avg_situation_qs > 5 THEN 'high'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking SPIN conversations to build baseline'
            WHEN avg_situation_qs < 2 THEN 'Add 1-2 more situation questions to build context'
            WHEN avg_situation_qs > 5 THEN 'Too many situation questions. Move to problems faster!'
            ELSE 'Good balance of situation questions. Keep it brief and move to problems.'
        END,
        'Ask about current situation (2-3 questions) then MOVE ON to problems'
    FROM spin_stats

    UNION ALL

    SELECT
        'Problem Questions' as component,
        CASE WHEN total_calls > 0 THEN (problem_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        COALESCE(avg_problem_qs, 0),
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (problem_count::NUMERIC / total_calls) < 0.7 THEN 'high'
            WHEN avg_problem_qs < 3 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking SPIN conversations to build baseline'
            WHEN (problem_count::NUMERIC / total_calls) < 0.7 THEN 'Problem questions missing in most calls. What pain are we uncovering?'
            WHEN avg_problem_qs < 3 THEN 'Ask 2-3 more problem questions to uncover deeper issues'
            ELSE 'Strong problem identification. Keep uncovering difficulties and dissatisfactions.'
        END,
        'Uncover difficulties, dissatisfactions, and problems (3-5 questions minimum)'
    FROM spin_stats

    UNION ALL

    SELECT
        'Implication Questions' as component,
        CASE WHEN total_calls > 0 THEN (implication_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        COALESCE(avg_implication_qs, 0),
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (implication_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN avg_implication_qs < 2 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking SPIN conversations to build baseline'
            WHEN (implication_count::NUMERIC / total_calls) < 0.5 THEN 'CRITICAL: Implication questions missing in most calls. How do we create urgency?'
            WHEN avg_implication_qs < 2 THEN 'Add 1-2 more implication questions to build urgency'
            ELSE 'Excellent implication questioning. Keep making problems feel bigger and more urgent.'
        END,
        'Build urgency by exploring consequences and impact of problems (2-4 questions)'
    FROM spin_stats

    UNION ALL

    SELECT
        'Need-Payoff Questions' as component,
        CASE WHEN total_calls > 0 THEN (needpayoff_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        COALESCE(avg_needpayoff_qs, 0),
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (needpayoff_count::NUMERIC / total_calls) < 0.6 THEN 'high'
            WHEN avg_needpayoff_qs < 2 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking SPIN conversations to build baseline'
            WHEN (needpayoff_count::NUMERIC / total_calls) < 0.6 THEN 'Need-payoff questions missing. Let the customer sell themselves!'
            WHEN avg_needpayoff_qs < 2 THEN 'Ask 1-2 more need-payoff questions to build value'
            ELSE 'Strong need-payoff questioning. Keep letting customers articulate value.'
        END,
        'Get prospects to articulate value and benefits themselves (2-3 questions)'
    FROM spin_stats;
END;
$$;

-- ============================================
-- GAP SELLING ANALYSIS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION analyze_gap_selling_execution(
    target_user_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    component TEXT,
    execution_rate NUMERIC,
    calls_executed INTEGER,
    calls_analyzed INTEGER,
    severity TEXT,
    coaching_prompt TEXT,
    detail_note TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH gap_stats AS (
        SELECT
            COUNT(*) as total_calls,
            SUM(CASE WHEN gap_current_state_discovered THEN 1 ELSE 0 END) as current_state_count,
            SUM(CASE WHEN gap_future_state_defined THEN 1 ELSE 0 END) as future_state_count,
            SUM(CASE WHEN gap_identified THEN 1 ELSE 0 END) as gap_count,
            SUM(CASE WHEN gap_impact_quantified THEN 1 ELSE 0 END) as impact_count,
            SUM(CASE WHEN gap_root_cause_found THEN 1 ELSE 0 END) as root_cause_count
        FROM Conversation_Analyses
        WHERE user_id = target_user_id
        AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        AND methodology = 'Gap Selling'
    )
    SELECT
        'Current State Discovery' as component,
        CASE WHEN total_calls > 0 THEN (current_state_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        current_state_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (current_state_count::NUMERIC / total_calls) < 0.7 THEN 'high'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Gap Selling conversations to build baseline'
            WHEN (current_state_count::NUMERIC / total_calls) < 0.7 THEN 'Not fully understanding current state. What are we missing?'
            ELSE 'Strong current state discovery. Keep mapping where they are today.'
        END,
        'Deeply understand the prospect''s current situation, processes, and challenges'
    FROM gap_stats

    UNION ALL

    SELECT
        'Future State Vision' as component,
        CASE WHEN total_calls > 0 THEN (future_state_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        future_state_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (future_state_count::NUMERIC / total_calls) < 0.6 THEN 'high'
            WHEN (future_state_count::NUMERIC / total_calls) < 0.8 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Gap Selling conversations to build baseline'
            WHEN (future_state_count::NUMERIC / total_calls) < 0.6 THEN 'CRITICAL: Not defining future state. Where do they want to be?'
            WHEN (future_state_count::NUMERIC / total_calls) < 0.8 THEN 'Future state clarity needs work. Paint the picture of success.'
            ELSE 'Excellent future state definition. Keep building the vision.'
        END,
        'Help prospect articulate where they want to be and what success looks like'
    FROM gap_stats

    UNION ALL

    SELECT
        'Gap Identification' as component,
        CASE WHEN total_calls > 0 THEN (gap_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        gap_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (gap_count::NUMERIC / total_calls) < 0.6 THEN 'high'
            WHEN (gap_count::NUMERIC / total_calls) < 0.8 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Gap Selling conversations to build baseline'
            WHEN (gap_count::NUMERIC / total_calls) < 0.6 THEN 'CRITICAL: Gaps not being identified. What''s stopping them from future state?'
            WHEN (gap_count::NUMERIC / total_calls) < 0.8 THEN 'Gap identification is inconsistent. How do we clarify the distance?'
            ELSE 'Strong gap identification. Keep quantifying the distance to close.'
        END,
        'Clearly identify and quantify the gap between current and future state'
    FROM gap_stats

    UNION ALL

    SELECT
        'Impact Quantification' as component,
        CASE WHEN total_calls > 0 THEN (impact_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        impact_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (impact_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (impact_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Gap Selling conversations to build baseline'
            WHEN (impact_count::NUMERIC / total_calls) < 0.5 THEN 'Impact not quantified. What''s the cost of the gap?'
            WHEN (impact_count::NUMERIC / total_calls) < 0.7 THEN 'Need more impact quantification. Put a number on the problem.'
            ELSE 'Excellent impact quantification. Keep making gaps real with numbers.'
        END,
        'Quantify the business impact and cost of the gap (revenue, time, efficiency)'
    FROM gap_stats

    UNION ALL

    SELECT
        'Root Cause Analysis' as component,
        CASE WHEN total_calls > 0 THEN (root_cause_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        root_cause_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (root_cause_count::NUMERIC / total_calls) < 0.5 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Gap Selling conversations to build baseline'
            WHEN (root_cause_count::NUMERIC / total_calls) < 0.5 THEN 'Root cause analysis missing. Why does the gap exist?'
            ELSE 'Good root cause identification. Keep diagnosing the why behind gaps.'
        END,
        'Understand why the gap exists and what''s preventing them from closing it'
    FROM gap_stats;
END;
$$;

-- ============================================
-- VALUE SELLING ANALYSIS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION analyze_value_selling_execution(
    target_user_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    component TEXT,
    execution_rate NUMERIC,
    calls_executed INTEGER,
    calls_analyzed INTEGER,
    severity TEXT,
    coaching_prompt TEXT,
    detail_note TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH value_stats AS (
        SELECT
            COUNT(*) as total_calls,
            SUM(CASE WHEN value_business_discussed THEN 1 ELSE 0 END) as business_value_count,
            SUM(CASE WHEN value_business_quantified THEN 1 ELSE 0 END) as quantified_count,
            SUM(CASE WHEN value_personal_discussed THEN 1 ELSE 0 END) as personal_value_count,
            SUM(CASE WHEN value_roi_presented THEN 1 ELSE 0 END) as roi_count
        FROM Conversation_Analyses
        WHERE user_id = target_user_id
        AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        AND methodology = 'Value Selling'
    )
    SELECT
        'Business Value Discussion' as component,
        CASE WHEN total_calls > 0 THEN (business_value_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        business_value_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (business_value_count::NUMERIC / total_calls) < 0.7 THEN 'high'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Value Selling conversations to build baseline'
            WHEN (business_value_count::NUMERIC / total_calls) < 0.7 THEN 'Business value not discussed in most calls. What''s the organizational impact?'
            ELSE 'Strong business value focus. Keep connecting to company objectives.'
        END,
        'Connect solution to organizational goals, revenue impact, and strategic initiatives'
    FROM value_stats

    UNION ALL

    SELECT
        'Value Quantification' as component,
        CASE WHEN total_calls > 0 THEN (quantified_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        quantified_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (quantified_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (quantified_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Value Selling conversations to build baseline'
            WHEN (quantified_count::NUMERIC / total_calls) < 0.5 THEN 'CRITICAL: Value not quantified. Put numbers to the business case!'
            WHEN (quantified_count::NUMERIC / total_calls) < 0.7 THEN 'Quantification needs work. How do we measure success?'
            ELSE 'Excellent value quantification. Keep building data-driven business cases.'
        END,
        'Quantify the value with specific numbers ($ saved, % increased, hours recovered)'
    FROM value_stats

    UNION ALL

    SELECT
        'Personal Value Discussion' as component,
        CASE WHEN total_calls > 0 THEN (personal_value_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        personal_value_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (personal_value_count::NUMERIC / total_calls) < 0.5 THEN 'high'
            WHEN (personal_value_count::NUMERIC / total_calls) < 0.7 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Value Selling conversations to build baseline'
            WHEN (personal_value_count::NUMERIC / total_calls) < 0.5 THEN 'Personal value missing. What''s in it for THEM?'
            WHEN (personal_value_count::NUMERIC / total_calls) < 0.7 THEN 'Personal value needs emphasis. How does this help their career?'
            ELSE 'Strong personal value connection. Keep showing individual benefits.'
        END,
        'Connect to individual stakeholder wins (career, credibility, time, frustration reduction)'
    FROM value_stats

    UNION ALL

    SELECT
        'ROI Presentation' as component,
        CASE WHEN total_calls > 0 THEN (roi_count::NUMERIC / total_calls) * 100 ELSE 0 END,
        roi_count::INTEGER,
        total_calls::INTEGER,
        CASE
            WHEN total_calls = 0 THEN 'medium'
            WHEN (roi_count::NUMERIC / total_calls) < 0.4 THEN 'medium'
            ELSE 'low'
        END,
        CASE
            WHEN total_calls = 0 THEN 'Start tracking Value Selling conversations to build baseline'
            WHEN (roi_count::NUMERIC / total_calls) < 0.4 THEN 'ROI not presented in most calls. Build the business case!'
            ELSE 'Good ROI presentation. Keep showing payback period and value.'
        END,
        'Present clear ROI with payback period, total value, and implementation timeline'
    FROM value_stats;
END;
$$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Multi-Methodology Analysis Functions Created!';
    RAISE NOTICE '   📊 Functions Available:';
    RAISE NOTICE '      • analyze_meddic_execution()';
    RAISE NOTICE '      • analyze_challenger_execution()';
    RAISE NOTICE '      • analyze_spin_execution()';
    RAISE NOTICE '      • analyze_gap_selling_execution()';
    RAISE NOTICE '      • analyze_value_selling_execution()';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Dashboard can now analyze ANY methodology!';
END $$;
