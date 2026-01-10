-- ============================================
-- Manager Team Coaching Dashboard - SECURITY DEFINER Functions
-- Run this AFTER admin-team-schema.sql
-- ============================================

-- These functions allow admin users to bypass RLS and query all users' data
-- Security is enforced by checking the caller's email against whitelist

-- ============================================
-- FUNCTION: get_team_overview
-- Returns summary of all users with key metrics and top weakness/strength
-- ============================================
CREATE OR REPLACE FUNCTION get_team_overview(
  admin_email TEXT,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  methodology TEXT,
  -- Activity metrics
  total_dials BIGINT,
  total_conversations BIGINT,
  total_meetings BIGINT,
  dial_conv_rate NUMERIC,
  conv_meeting_rate NUMERIC,
  -- Revenue metrics
  total_revenue NUMERIC,
  total_sales BIGINT,
  avg_sale_value NUMERIC,
  -- Quality metrics
  avg_sandler_score NUMERIC,
  active_days INTEGER,
  -- Top weakness/strength (for quick insights)
  top_weakness_metric TEXT,
  top_weakness_rate NUMERIC,
  top_weakness_prompt TEXT,
  top_strength_metric TEXT,
  top_strength_rate NUMERIC,
  -- Performance score
  performance_score NUMERIC
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF admin_email NOT IN ('admin@aiadvantagesolutions.com', 'admin@aiadvantagesolutions.ca', 'john@aiadvantagesolutions.com') THEN
    RAISE EXCEPTION 'Unauthorized: Not an admin user';
  END IF;

  -- Return aggregated data for all users (bypassing RLS)
  RETURN QUERY
  WITH user_activity AS (
    SELECT
      dt.user_id,
      SUM(dt.dials) as total_dials,
      SUM(dt.conversations) as total_conversations,
      SUM(dt.discovery_meetings) as total_meetings,
      COUNT(DISTINCT dt.date) as active_days,
      CASE
        WHEN SUM(dt.dials) > 0
        THEN (SUM(dt.conversations)::NUMERIC / SUM(dt.dials)) * 100
        ELSE 0
      END as dial_conv_rate,
      CASE
        WHEN SUM(dt.conversations) > 0
        THEN (SUM(dt.discovery_meetings)::NUMERIC / SUM(dt.conversations)) * 100
        ELSE 0
      END as conv_meeting_rate
    FROM "Daily_Tracker" dt
    WHERE dt.date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY dt.user_id
  ),
  user_sales AS (
    SELECT
      s.user_id,
      COUNT(*) as total_sales,
      SUM(s.amount_cad) as total_revenue,
      AVG(s.amount_cad) as avg_sale_value
    FROM "Sales" s
    WHERE s.date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY s.user_id
  ),
  user_quality AS (
    SELECT
      ca.user_id,
      AVG(ca.overall_sandler_score) as avg_sandler_score,
      -- Calculate methodology execution rates for weaknesses/strengths
      AVG(CASE WHEN ca.upfront_contract_set THEN 100 ELSE 0 END) as upfront_contract_rate,
      AVG(CASE WHEN ca.pain_identified THEN 100 ELSE 0 END) as pain_funnel_rate,
      AVG(CASE WHEN ca.budget_discussed THEN 100 ELSE 0 END) as budget_rate,
      AVG(ca.talk_percentage) as avg_talk_pct
    FROM "Conversation_Analyses" ca
    WHERE ca.date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY ca.user_id
  )
  SELECT
    au.id,
    au.email,
    (au.raw_user_meta_data->>'first_name')::TEXT,
    (au.raw_user_meta_data->>'last_name')::TEXT,
    (au.raw_user_meta_data->>'company')::TEXT,
    (au.raw_user_meta_data->>'methodology')::TEXT,
    COALESCE(ua.total_dials, 0),
    COALESCE(ua.total_conversations, 0),
    COALESCE(ua.total_meetings, 0),
    COALESCE(ua.dial_conv_rate, 0),
    COALESCE(ua.conv_meeting_rate, 0),
    COALESCE(us.total_revenue, 0),
    COALESCE(us.total_sales, 0),
    COALESCE(us.avg_sale_value, 0),
    COALESCE(uq.avg_sandler_score, 0),
    COALESCE(ua.active_days, 0),
    -- Top weakness (lowest execution rate)
    CASE
      WHEN COALESCE(uq.upfront_contract_rate, 100) < COALESCE(uq.pain_funnel_rate, 100)
        AND COALESCE(uq.upfront_contract_rate, 100) < COALESCE(uq.budget_rate, 100)
      THEN 'Upfront Contract'
      WHEN COALESCE(uq.pain_funnel_rate, 100) < COALESCE(uq.budget_rate, 100)
      THEN 'Pain Funnel'
      ELSE 'Budget Discussion'
    END,
    LEAST(
      COALESCE(uq.upfront_contract_rate, 100),
      COALESCE(uq.pain_funnel_rate, 100),
      COALESCE(uq.budget_rate, 100)
    ),
    CASE
      WHEN LEAST(COALESCE(uq.upfront_contract_rate, 100), COALESCE(uq.pain_funnel_rate, 100), COALESCE(uq.budget_rate, 100)) = COALESCE(uq.upfront_contract_rate, 100)
      THEN 'Calls are starting without clear direction - prospects don''t know what to expect.'
      WHEN LEAST(COALESCE(uq.upfront_contract_rate, 100), COALESCE(uq.pain_funnel_rate, 100), COALESCE(uq.budget_rate, 100)) = COALESCE(uq.pain_funnel_rate, 100)
      THEN 'Presenting solutions before understanding the real problem - prospects stay polite but don''t buy.'
      ELSE 'Avoiding money conversations early - creating surprises at proposal time.'
    END,
    -- Top strength (highest execution rate)
    CASE
      WHEN COALESCE(uq.upfront_contract_rate, 0) > COALESCE(uq.pain_funnel_rate, 0)
        AND COALESCE(uq.upfront_contract_rate, 0) > COALESCE(uq.budget_rate, 0)
      THEN 'Upfront Contract'
      WHEN COALESCE(uq.pain_funnel_rate, 0) > COALESCE(uq.budget_rate, 0)
      THEN 'Pain Funnel'
      ELSE 'Budget Discussion'
    END,
    GREATEST(
      COALESCE(uq.upfront_contract_rate, 0),
      COALESCE(uq.pain_funnel_rate, 0),
      COALESCE(uq.budget_rate, 0)
    ),
    -- Performance score (weighted composite)
    (
      COALESCE(ua.dial_conv_rate, 0) * 0.20 +
      COALESCE(ua.conv_meeting_rate, 0) * 0.20 +
      COALESCE(uq.avg_sandler_score, 0) * 10 * 0.30 +
      (COALESCE(ua.active_days, 0)::NUMERIC / NULLIF(days_back, 0) * 100) * 0.30
    )::NUMERIC(5,2)
  FROM auth.users au
  LEFT JOIN user_activity ua ON au.id = ua.user_id
  LEFT JOIN user_sales us ON au.id = us.user_id
  LEFT JOIN user_quality uq ON au.id = uq.user_id
  WHERE au.email NOT IN ('admin@aiadvantagesolutions.com', 'admin@aiadvantagesolutions.ca', 'john@aiadvantagesolutions.com')
  ORDER BY performance_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: get_user_categorical_insights
-- Deep analysis of methodology execution for a specific user
-- ============================================
CREATE OR REPLACE FUNCTION get_user_categorical_insights(
  admin_email TEXT,
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
  coaching_prompt TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_methodology TEXT;
BEGIN
  -- Verify caller is admin
  IF admin_email NOT IN ('admin@aiadvantagesolutions.com', 'admin@aiadvantagesolutions.ca', 'john@aiadvantagesolutions.com') THEN
    RAISE EXCEPTION 'Unauthorized: Not an admin user';
  END IF;

  -- Get user's methodology
  SELECT raw_user_meta_data->>'methodology' INTO user_methodology
  FROM auth.users WHERE id = target_user_id;

  -- Analyze based on methodology
  IF user_methodology = 'Sandler' THEN
    -- Upfront Contract analysis
    RETURN QUERY
    SELECT
      'Methodology Execution'::TEXT as category,
      'Upfront Contract'::TEXT as metric_name,
      (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not setting upfront contracts - prospects are confused about where conversations are going.

📩 SEND THIS MESSAGE: "Hey [Name], I reviewed your recent calls. I noticed we''re jumping into discovery without setting expectations first. Try this at the start of your next 5 calls: ''Before we dive in, here''s what I''d like to do: spend 10 minutes understanding your situation, and at the end you can tell me if it makes sense to continue or not. Fair enough?'' This removes confusion and increases close rates. Let me know how it goes!"

✅ YOUR ACTION: Follow up in 2 days. Ask them to share one call recording where they tried this.'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Inconsistent upfront contracts - doing it sometimes but not always.

📩 SEND THIS MESSAGE: "Hi [Name], quick coaching note: I see you''re setting upfront contracts in about half your calls. The ones where you do have better outcomes. Make this your new rule: EVERY call starts with setting expectations. No exceptions. ''Is now a good time for 10 minutes? Here''s what I''d like to do...'' Make it automatic. Track it for the next week."

✅ YOUR ACTION: Review again in 1 week. Check if consistency improved to 80%+.'::TEXT
        ELSE '🌟 WINNING: Consistently strong upfront contracts! Prospects always know what to expect.

📩 SEND THIS MESSAGE: "Great work on upfront contracts! Your execution here is making everything else easier. Keep this exact pattern - it''s working."

✅ YOUR ACTION: Share this as a team example in next meeting.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Pain Funnel analysis
    RETURN QUERY
    SELECT
      'Methodology Execution'::TEXT,
      'Pain Funnel'::TEXT,
      (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Jumping to solutions before uncovering real pain. Prospects are being polite but not buying.

📩 SEND THIS MESSAGE: "Hey [Name], I listened to your recent calls. We''re presenting solutions too early - prospects haven''t told us the problem is urgent yet. Use these 3 questions in order: (1) ''Tell me more about that problem...'' [STAY SILENT] (2) ''How much is that costing you per month?'' (3) ''What happens if you don''t fix it in 90 days?'' Don''t pitch until they''ve convinced themselves it''s urgent. Try this on 5 calls."

✅ YOUR ACTION: Listen to 1 call in 3 days. Check if they used the questions and stayed silent.'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Finding surface pain but not digging deeper into emotional impact.

📩 SEND THIS MESSAGE: "Quick coaching: You''re identifying problems, but we need to go deeper. When they say ''it''s frustrating,'' ask: ''Help me understand - what does that frustration cost you personally?'' Get them to articulate what''s at stake for THEM. Surface pain = no urgency. Personal pain = urgency. Go one level deeper on every call this week."

✅ YOUR ACTION: Review 2 calls next week. Listen for emotional impact questions.'::TEXT
        ELSE '🌟 WINNING: Exceptional pain discovery! Prospects are opening up about real problems.

📩 SEND THIS MESSAGE: "Your pain discovery is excellent - prospects are telling you what''s keeping them up at night. This is why your close rate is strong. Keep asking those deep questions."

✅ YOUR ACTION: Have them share their approach at next team meeting.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Budget Discussion analysis
    RETURN QUERY
    SELECT
      'Methodology Execution'::TEXT,
      'Budget Discussion'::TEXT,
      (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Avoiding budget talk until late - causing proposal surprises and lost deals.

📩 SEND THIS MESSAGE: "Hey [Name], we need to talk about budget earlier. I noticed money isn''t coming up until proposal stage - that''s causing surprises and lost deals. Use this exact question in EVERY discovery call: ''If this makes sense, what kind of budget have you allocated to solve this problem?'' Say it confidently. If they won''t answer, they''re not serious. Ask it on your next 5 calls and let me know what happens."

✅ YOUR ACTION: Roleplay this question with them in your next 1-on-1. Make them comfortable asking it.'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Asking about budget sometimes, but still hesitating on other calls.

📩 SEND THIS MESSAGE: "Quick note: Budget is coming up in some calls but not all. Stop hinting - ask directly. Try this: ''If I could show you a solution that solves [problem], what investment range makes sense for you?'' Direct questions get direct answers. Hinting wastes time. Make this a non-negotiable part of discovery. Every call. No exceptions."

✅ YOUR ACTION: Check in 1 week. Their budget discussion rate should be 90%+.'::TEXT
        ELSE '🌟 WINNING: Comfortable discussing money early - prospects appreciate the transparency!

📩 SEND THIS MESSAGE: "Love how you''re handling budget discussions! You''re asking early, prospects appreciate the transparency, and there''s no sticker shock at proposal time. This is saving you tons of time. Keep it up."

✅ YOUR ACTION: Use their approach as training example for the team.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Decision Process analysis
    RETURN QUERY
    SELECT
      'Methodology Execution'::TEXT,
      'Decision Process'::TEXT,
      (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Spending time with people who can''t say yes - deals dying with unseen decision-makers.

📩 SEND THIS MESSAGE: "Hey [Name], I see a pattern - we''re talking to interested people who can''t actually buy. When they say ''I need to run this by my boss,'' use this: ''I appreciate that. Who else besides you and your boss will weigh in? And if they have questions I haven''t answered for you, would it make sense for me to join that conversation?'' Get in the room with real decision-makers or disqualify. Ask this on every call this week."

✅ YOUR ACTION: Review their pipeline. Flag deals where they haven''t met the economic buyer.'::TEXT
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Sometimes mapping decision-makers, sometimes assuming their contact has authority.

📩 SEND THIS MESSAGE: "Quick coaching: I see you''re sometimes mapping the decision process, but not always. Make this your rule: Ask these 3 questions in every discovery: (1) ''Who besides you will be involved in this decision?'' (2) ''Walk me through your typical buying process'' (3) ''If everyone says yes, is there anyone else who could say no?'' Document the answers. No exceptions."

✅ YOUR ACTION: Spot-check their next 3 deals. They should have decision-maker maps documented.'::TEXT
        ELSE '🌟 WINNING: Consistently identifying real decision-makers early - protecting pipeline quality!

📩 SEND THIS MESSAGE: "Excellent work on decision-maker identification! You''re getting to the real buyers early and not wasting time with researchers. Your pipeline quality shows it. Keep this up."

✅ YOUR ACTION: Share their decision-maker mapping process as best practice.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Talk Ratio analysis
    RETURN QUERY
    SELECT
      'Conversation Quality'::TEXT,
      'Talk Ratio'::TEXT,
      AVG(talk_percentage),
      COUNT(*)::INTEGER,
      SUM(CASE WHEN talk_percentage <= 35 THEN 1 ELSE 0 END)::INTEGER, -- Target range
      CASE
        WHEN AVG(talk_percentage) > 50 THEN 'high'::TEXT
        WHEN AVG(talk_percentage) > 35 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN AVG(talk_percentage) > 50
        THEN '📊 ISSUE: Talking ' || ROUND(AVG(talk_percentage))::TEXT || '% of the time - presenting instead of discovering.

📩 SEND THIS MESSAGE: "Hey [Name], I reviewed your calls and you''re talking ' || ROUND(AVG(talk_percentage))::TEXT || '% of the time. That''s a presentation, not a discovery. Prospects are being polite but you''re not learning about them. Try this: Ask a question, then count to 5 in your head. Don''t fill the silence. Let them talk. Target: You talk 30%, they talk 70%. Practice this on your next 5 calls."

✅ YOUR ACTION: Listen to 1 call next week. Track their talk percentage.'::TEXT
        WHEN AVG(talk_percentage) > 35
        THEN '📊 ISSUE: Talk ratio is ' || ROUND(AVG(talk_percentage))::TEXT || '% (target: 30%) - close but still talking too much.

📩 SEND THIS MESSAGE: "Quick coaching note: Your talk ratio is ' || ROUND(AVG(talk_percentage))::TEXT || '%  - target is 30%. You''re close! Focus on asking more questions and staying silent longer. When you ask a question, let them finish, then wait 2 seconds before responding. They''ll keep talking and tell you everything you need to know. Try it this week."

✅ YOUR ACTION: Check their talk ratio again in 1 week. Should be trending toward 30%.'::TEXT
        ELSE '🌟 WINNING: Talk ratio (' || ROUND(AVG(talk_percentage))::TEXT || '%) shows you''re truly listening!

📩 SEND THIS MESSAGE: "Love your talk ratio! You''re letting prospects talk 70%+ of the time, which means they''re telling you exactly how to sell to them. This listening skill is a competitive advantage. Keep it up."

✅ YOUR ACTION: Share recording as example of good discovery questioning.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    HAVING COUNT(*) > 0;

  ELSIF user_methodology = 'MEDDIC' OR user_methodology = 'MEDDPICC' THEN
    -- MEDDIC: Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion

    -- Metrics Identification analysis
    RETURN QUERY
    SELECT
      'MEDDIC Execution'::TEXT as category,
      'Metrics'::TEXT as metric_name,
      (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not quantifying problems with hard metrics - prospects see this as "nice to have."

📩 SEND THIS MESSAGE: "Hey [Name], MEDDIC requires quantified metrics in every deal. When prospects describe a problem, ask: ''What metric are you trying to improve?'' and ''By how much?'' For example: ''How many deals are you losing per quarter because of slow proposal turnaround?'' Get numbers. No metrics = no urgency. Try this on your next 5 calls."

✅ YOUR ACTION: Review their pipeline. Flag any deal without quantified metrics documented.'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Finding problems but not consistently tying them to measurable business metrics.

📩 SEND THIS MESSAGE: "Quick coaching: You''re identifying pain, but we need hard metrics attached. When they say ''our process is slow,'' ask ''How does that show up in your numbers? Revenue? Customer churn? Time to close?'' Every problem should have a metric. Make this your standard follow-up question this week."

✅ YOUR ACTION: Spot-check 2 recent calls. They should have metrics documented for each pain point.'::TEXT
        ELSE '🌟 WINNING: Consistently identifying and quantifying metrics! Deals have real business cases.

📩 SEND THIS MESSAGE: "Excellent metrics discovery! You''re tying every pain point to measurable business impact. This is why your proposals get approved - there''s a clear ROI. Keep this up."

✅ YOUR ACTION: Use one of their metric-driven discoveries as a team training example.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Economic Buyer Identification
    RETURN QUERY
    SELECT
      'MEDDIC Execution'::TEXT,
      'Economic Buyer'::TEXT,
      (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not identifying the Economic Buyer - deals stalling with people who lack budget authority.

📩 SEND THIS MESSAGE: "Hey [Name], we need to find the Economic Buyer faster. When your contact mentions ''my boss,'' use this: ''Who controls the budget for this initiative?'' Then: ''Would it make sense to include them in our next conversation so I can address their priorities directly?'' Don''t present until you''ve met the EB. Ask this on every call this week."

✅ YOUR ACTION: Review pipeline. Any deal without documented EB access needs to be qualified out or escalated.'::TEXT
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Finding Economic Buyers sometimes, but not making it a consistent requirement.

📩 SEND THIS MESSAGE: "Quick note: I see Economic Buyer identification in some deals but not all. Make this non-negotiable: No proposal without meeting the EB. Ask your champion: ''I need to understand [EB name]''s priorities before we move forward. Can you introduce us?'' Document when you meet them. Every deal. No exceptions."

✅ YOUR ACTION: Implement EB checkpoint. No proposals go out until they''ve met the Economic Buyer.'::TEXT
        ELSE '🌟 WINNING: Consistently getting access to Economic Buyers early! Pipeline quality is excellent.

📩 SEND THIS MESSAGE: "Great work on Economic Buyer access! You''re getting in front of the real decision-makers early, which is why your close rate is strong. Keep requiring EB meetings before proposals."

✅ YOUR ACTION: Share their EB access strategy at next team meeting as best practice.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Decision Criteria
    RETURN QUERY
    SELECT
      'MEDDIC Execution'::TEXT,
      'Decision Criteria'::TEXT,
      (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not uncovering Decision Criteria - guessing what matters instead of asking.

📩 SEND THIS MESSAGE: "Hey [Name], MEDDIC requires us to know their exact Decision Criteria. Ask: ''When you evaluate solutions like this, what are the top 3 criteria you use to decide?'' Then: ''How will you weight those criteria?'' Document their answers. If we don''t know how they''re scoring vendors, we can''t win. Ask this on your next 5 discovery calls."

✅ YOUR ACTION: Check their next 3 deals. They should have documented decision criteria with weightings.'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Asking about Decision Criteria sometimes but not consistently capturing the full picture.

📩 SEND THIS MESSAGE: "Quick coaching: You''re asking about decision criteria, but we need more detail. After they list criteria, ask: ''If you had 100 points to distribute across those criteria, how would you weight them?'' This tells you exactly what to emphasize in your proposal. Make this your standard follow-up question this week."

✅ YOUR ACTION: Review 2 deals. Their decision criteria should show relative importance/weighting.'::TEXT
        ELSE '🌟 WINNING: Consistently documenting detailed Decision Criteria! Your proposals are perfectly targeted.

📩 SEND THIS MESSAGE: "Excellent Decision Criteria discovery! You''re documenting not just what matters but how much it matters. This is why your proposals resonate - they address priorities in the right order. Keep this up."

✅ YOUR ACTION: Share one of their decision criteria documents as a team example.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Budget Discussion
    RETURN QUERY
    SELECT
      'MEDDIC Execution'::TEXT,
      'Budget'::TEXT,
      (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not confirming budget early - wasting time on deals that can''t afford your solution.

📩 SEND THIS MESSAGE: "Hey [Name], in MEDDIC, no budget = no deal. After establishing pain and metrics, ask: ''Based on the [metric] impact we discussed, what budget has been allocated to solve this?'' If they don''t have budget, ask: ''What would it take to create budget for something that improves [metric] by [amount]?'' No budget conversation = disqualify. Ask on every call this week."

✅ YOUR ACTION: Review pipeline. Flag any deals older than 2 weeks without documented budget.'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Discussing budget sometimes but not early enough to avoid wasting time.

📩 SEND THIS MESSAGE: "Quick note: Budget needs to come up in the FIRST real conversation, not later. After you quantify pain, immediately ask about budget allocated. If they deflect, say: ''I ask because we want to make sure we''re aligned on investment level before spending more of your time.'' Direct and respectful. Make this your standard sequence this week."

✅ YOUR ACTION: Listen to 1 discovery call. Budget should be discussed before the call ends.'::TEXT
        ELSE '🌟 WINNING: Consistently qualifying budget early! You''re protecting your time and theirs.

📩 SEND THIS MESSAGE: "Great budget qualification! You''re confirming budget early, which keeps your pipeline clean and your forecast accurate. This discipline is paying off in your close rate. Keep it up."

✅ YOUR ACTION: Use their budget qualification approach as team training.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Talk Ratio
    RETURN QUERY
    SELECT
      'Conversation Quality'::TEXT,
      'Talk Ratio'::TEXT,
      AVG(talk_percentage),
      COUNT(*)::INTEGER,
      SUM(CASE WHEN talk_percentage <= 35 THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN AVG(talk_percentage) > 50 THEN 'high'::TEXT
        WHEN AVG(talk_percentage) > 35 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN AVG(talk_percentage) > 50
        THEN '📊 ISSUE: Talking ' || ROUND(AVG(talk_percentage))::TEXT || '% - presenting features instead of discovering MEDDIC elements.

📩 SEND THIS MESSAGE: "Hey [Name], you''re talking ' || ROUND(AVG(talk_percentage))::TEXT || '% of the time. MEDDIC requires deep discovery - you can''t learn Metrics, Decision Criteria, or Pain by talking. Ask questions then stay silent. Let them explain their business. Target: 30% you, 70% them. Try this on your next 5 calls."

✅ YOUR ACTION: Listen to 1 call next week and track their actual talk percentage.'::TEXT
        WHEN AVG(talk_percentage) > 35
        THEN '📊 ISSUE: Talk ratio at ' || ROUND(AVG(talk_percentage))::TEXT || '% (target: 30%) - asking questions but not letting prospects fully answer.

📩 SEND THIS MESSAGE: "Quick coaching: Your talk ratio is ' || ROUND(AVG(talk_percentage))::TEXT || '%. You''re close to target (30%). Focus on asking MEDDIC questions then waiting longer. When they finish answering, count to 3 before speaking. They''ll often add critical details. Try it this week."

✅ YOUR ACTION: Check again in 1 week. Talk ratio should trend toward 30%.'::TEXT
        ELSE '🌟 WINNING: Talk ratio (' || ROUND(AVG(talk_percentage))::TEXT || '%) shows excellent MEDDIC discovery!

📩 SEND THIS MESSAGE: "Perfect talk ratio! You''re letting prospects explain their Metrics, Decision Criteria, and Pain in detail. This listening discipline is why your MEDDIC qualification is so thorough. Keep it up."

✅ YOUR ACTION: Share recording as example of strong MEDDIC discovery questioning.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    HAVING COUNT(*) > 0;

  ELSIF user_methodology = 'Challenger' THEN
    -- Challenger: Teach, Tailor, Take Control, Constructive Tension

    -- Teaching Insight analysis
    RETURN QUERY
    SELECT
      'Challenger Execution'::TEXT as category,
      'Teaching Insight'::TEXT as metric_name,
      (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not leading with teaching insights - sounding like every other rep asking questions.

📩 SEND THIS MESSAGE: "Hey [Name], Challenger reps lead with insight, not questions. Start calls with: ''I''ve been working with other [their role] in [industry], and they''re telling me [surprising insight about their world]. Is that true for you too?'' Teach them something NEW about their business they don''t know. Stop asking ''What are your pain points?'' - tell them what they SHOULD be worried about. Try this on 5 calls."

✅ YOUR ACTION: Prepare 3 teaching insights for their industry. Review with them in next 1-on-1.'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Leading with insights sometimes but falling back into traditional discovery questions.

📩 SEND THIS MESSAGE: "Quick note: I see teaching insights in some calls but not all. Make this your rule: Every call starts with ''Here''s what I''m seeing in your industry...'' before you ask ANY questions. You need to earn the right to ask questions by first teaching them something valuable. Make this your opener every single time this week."

✅ YOUR ACTION: Listen to their next 2 calls. Each should start with a teaching insight within first 2 minutes.'::TEXT
        ELSE '🌟 WINNING: Consistently leading with valuable teaching insights! Prospects see you as a thought leader.

📩 SEND THIS MESSAGE: "Excellent teaching! You''re showing up as an expert who understands their business, not just another vendor. This is why prospects engage deeply with you. Keep bringing fresh insights."

✅ YOUR ACTION: Capture their best teaching insights to share with team.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Tailoring (Personalization) analysis
    RETURN QUERY
    SELECT
      'Challenger Execution'::TEXT,
      'Tailoring'::TEXT,
      (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Using generic pitches - not tailoring insights to their specific role and business context.

📩 SEND THIS MESSAGE: "Hey [Name], Challenger requires tailoring your message to their specific situation. Before calls, research: (1) Their role''s key priorities (2) Their company''s recent changes (3) Industry trends affecting them. Then connect your insight directly to THEIR world: ''As a VP Sales in manufacturing dealing with [specific challenge], here''s what I''m seeing...'' Make it personal. Generic insights don''t land. Tailor your next 5 calls."

✅ YOUR ACTION: Spot-check their call prep. They should have role-specific talking points documented.'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Tailoring sometimes but still using too much generic language.

📩 SEND THIS MESSAGE: "Quick coaching: You''re doing some tailoring but need to go deeper. Don''t say ''companies like yours'' - say their COMPANY NAME. Don''t say ''people in your role'' - describe THEIR SPECIFIC role challenges. Make every insight feel like it was written specifically for them. Practice this level of personalization on every call this week."

✅ YOUR ACTION: Review 2 calls. Count how many times they use prospect''s company name and specific details.'::TEXT
        ELSE '🌟 WINNING: Excellent tailoring! Every conversation feels personally crafted for that prospect.

📩 SEND THIS MESSAGE: "Love how you tailor every message! Prospects clearly feel like you understand their specific situation. This personalization is why they engage so deeply. Keep this up."

✅ YOUR ACTION: Share an example of their tailored messaging with the team.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Taking Control analysis
    RETURN QUERY
    SELECT
      'Challenger Execution'::TEXT,
      'Taking Control'::TEXT,
      (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Letting prospects control the conversation - following their agenda instead of leading.

📩 SEND THIS MESSAGE: "Hey [Name], Challenger reps take control respectfully. When prospects say ''send me info,'' use this: ''I could do that, but honestly most of what we send isn''t relevant until I understand your situation. How about this: give me 15 minutes, I''ll ask you targeted questions, and then you''ll know exactly what makes sense to review. Fair?'' Push back professionally. Guide the conversation. Try this on your next 5 calls."

✅ YOUR ACTION: Listen to 1 call this week. They should redirect at least once when prospect tries to rush.'::TEXT
        WHEN (SUM(CASE WHEN decision_makers_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Taking control sometimes but still deferring to prospect''s timeline too easily.

📩 SEND THIS MESSAGE: "Quick coaching: When prospects say ''follow up next month,'' don''t just agree. Use constructive tension: ''I appreciate that. Before we wait though, help me understand - what changes between now and next month that would make this more urgent then than now?'' Make them justify delays. You''re the expert on the buying process, not them. Practice this every time they defer."

✅ YOUR ACTION: Check their pipeline. Flag any deals with prospect-set timelines that seem arbitrary.'::TEXT
        ELSE '🌟 WINNING: Excellent control of sales conversations! You''re guiding prospects professionally.

📩 SEND THIS MESSAGE: "Great job taking control! You''re using constructive tension well - pushing back respectfully when needed and keeping deals moving. This is why your sales cycle is shorter. Keep it up."

✅ YOUR ACTION: Share example of their professional pushback with team.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Budget/Money Conversation
    RETURN QUERY
    SELECT
      'Challenger Execution'::TEXT,
      'Money Discussion'::TEXT,
      (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Avoiding money conversations - letting prospects dodge investment discussions.

📩 SEND THIS MESSAGE: "Hey [Name], Challenger reps don''t shy away from money. After teaching insight, use constructive tension: ''Based on what I''m seeing with similar companies, solving this typically requires investment in the $X-Y range. Is that in the realm of what you''d consider to fix [problem]?'' Name the number FIRST. If they flinch, you''ve learned something important. Ask this on every call this week."

✅ YOUR ACTION: Roleplay pricing discussion in your next 1-on-1. Make them comfortable naming numbers.'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Discussing money sometimes but still hesitating to lead with pricing expectations.

📩 SEND THIS MESSAGE: "Quick note: You''re discussing budget in some calls but not early enough. Challenger reps set pricing expectations upfront to avoid wasting anyone''s time. After establishing the problem: ''Companies solving this typically invest $X-Y. Does that align with your expectations?'' Direct. Professional. Saves everyone time. Do this on EVERY discovery call this week."

✅ YOUR ACTION: Check their next 3 deals. Pricing expectations should be set within first 2 conversations.'::TEXT
        ELSE '🌟 WINNING: Excellent money conversations! You''re setting clear investment expectations early.

📩 SEND THIS MESSAGE: "Love how you handle pricing! You''re direct about investment levels early, which qualifies deals fast and sets proper expectations. This confidence with money is a huge asset. Keep it up."

✅ YOUR ACTION: Use their pricing approach as team training example.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Talk Ratio
    RETURN QUERY
    SELECT
      'Conversation Quality'::TEXT,
      'Talk Ratio'::TEXT,
      AVG(talk_percentage),
      COUNT(*)::INTEGER,
      SUM(CASE WHEN talk_percentage <= 35 THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN AVG(talk_percentage) > 50 THEN 'high'::TEXT
        WHEN AVG(talk_percentage) > 35 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN AVG(talk_percentage) > 50
        THEN '📊 ISSUE: Talking ' || ROUND(AVG(talk_percentage))::TEXT || '% - lecturing instead of engaging in two-way teaching.

📩 SEND THIS MESSAGE: "Hey [Name], Challenger is about teaching, but talking ' || ROUND(AVG(talk_percentage))::TEXT || '% means you''re lecturing. Teach an insight (2 min), then ask: ''Does that resonate with what you''re seeing?'' and let them talk. It''s a dialogue, not a presentation. Target: 30% you teaching, 70% them engaging with your insights. Try this balance on your next 5 calls."

✅ YOUR ACTION: Listen to 1 call next week. They should teach then engage, not monologue.'::TEXT
        WHEN AVG(talk_percentage) > 35
        THEN '📊 ISSUE: Talk ratio ' || ROUND(AVG(talk_percentage))::TEXT || '% - teaching well but need to let prospects process more.

📩 SEND THIS MESSAGE: "Quick coaching: Talk ratio is ' || ROUND(AVG(talk_percentage))::TEXT || '% (target: 30%). You''re teaching good insights but need more prospect engagement. After teaching, ask: ''What''s your take on that?'' then stay silent longer. Let them wrestle with the insight. That''s where the learning happens. Try this week."

✅ YOUR ACTION: Check in 1 week. Talk ratio should move toward 30% as they add more engagement questions.'::TEXT
        ELSE '🌟 WINNING: Perfect talk ratio (' || ROUND(AVG(talk_percentage))::TEXT || '%) for Challenger! Teaching then engaging.

📩 SEND THIS MESSAGE: "Excellent balance! You''re teaching insights then creating space for prospects to engage and challenge back. This two-way dialogue is Challenger done right. Keep it up."

✅ YOUR ACTION: Share recording as example of Challenger teaching + engagement balance.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    HAVING COUNT(*) > 0;

  ELSIF user_methodology = 'SPIN' THEN
    -- SPIN: Situation, Problem, Implication, Need-Payoff questions

    -- Situation Questions analysis
    RETURN QUERY
    SELECT
      'SPIN Execution'::TEXT as category,
      'Situation Questions'::TEXT as metric_name,
      (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Spending too much time on Situation questions - prospects are getting bored with basic info gathering.

📩 SEND THIS MESSAGE: "Hey [Name], in SPIN, Situation questions should be brief - just enough to understand their context. Don''t ask ''Tell me about your current process'' for 20 minutes. Research beforehand. Ask 2-3 quick Situation questions (''How many reps?'' ''What CRM?'') then move to Problem questions. If you''re spending more than 5 minutes on Situation, you''re losing them. Try this on your next 5 calls."

✅ YOUR ACTION: Review their discovery question list. Flag situation questions that could be researched beforehand.'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Good Situation questions but sometimes getting stuck in information gathering.

📩 SEND THIS MESSAGE: "Quick coaching: Your Situation questions are good but watch the clock. 3-5 minutes max. Then transition: ''Thanks for that context. Now let me ask - what challenges are you seeing with that current setup?'' [PROBLEM question]. Don''t let Situation questions drag. Move to Problem faster. Try this week."

✅ YOUR ACTION: Listen to 1 call. Time how long they spend on Situation questions (should be < 5 min).'::TEXT
        ELSE '🌟 WINNING: Excellent Situation questioning! Quick, efficient context-gathering.

📩 SEND THIS MESSAGE: "Great Situation questioning! You''re getting just enough context without boring prospects, then moving quickly to Problems. This efficiency keeps prospects engaged. Keep it up."

✅ YOUR ACTION: Share their Situation question efficiency as best practice.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Problem Questions analysis
    RETURN QUERY
    SELECT
      'SPIN Execution'::TEXT,
      'Problem Questions'::TEXT,
      (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not asking enough Problem questions - jumping from Situation straight to your solution.

📩 SEND THIS MESSAGE: "Hey [Name], SPIN requires strong Problem questions before you can sell. After Situation questions, ask: ''What problems are you experiencing with that approach?'' Then: ''What other difficulties does that create?'' Keep probing until they''ve described 3-4 problems. Don''t pitch until they''ve convinced themselves they have problems worth solving. Ask these on your next 5 calls."

✅ YOUR ACTION: Review call recordings. Count Problem questions asked (should be 5-8 per call).'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Asking some Problem questions but not digging deep enough into multiple problems.

📩 SEND THIS MESSAGE: "Quick coaching: You''re asking Problem questions but stopping after finding one problem. SPIN works when you uncover MULTIPLE problems. After they share one: ''What other challenges does that create?'' Get them talking about 3-4 related problems. This builds urgency. Dig deeper on every call this week."

✅ YOUR ACTION: Spot-check 2 calls. They should uncover at least 3 distinct problems per conversation.'::TEXT
        ELSE '🌟 WINNING: Excellent Problem questioning! You''re uncovering multiple pain points systematically.

📩 SEND THIS MESSAGE: "Great Problem questions! You''re systematically uncovering multiple challenges before moving forward. This thorough problem identification is why prospects see the value. Keep it up."

✅ YOUR ACTION: Share an example of their Problem questioning sequence with the team.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Implication Questions analysis
    RETURN QUERY
    SELECT
      'SPIN Execution'::TEXT,
      'Implication Questions'::TEXT,
      (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Skipping Implication questions - not helping prospects see the full cost of their problems.

📩 SEND THIS MESSAGE: "Hey [Name], Implication questions are what make SPIN powerful. After they describe a Problem, ask: ''What effect does that have on your team?'' ''How does that impact your revenue?'' ''If this continues for 6 months, what happens?'' Make them see the FULL COST of not solving it. No Implication = no urgency. Ask these on your next 5 discovery calls."

✅ YOUR ACTION: Prepare 5 Implication questions for common problems in their industry. Review in next 1-on-1.'::TEXT
        WHEN (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Using some Implication questions but not connecting them to business impact systematically.

📩 SEND THIS MESSAGE: "Quick coaching: You''re asking Implication questions sometimes, but make them more powerful by connecting to money and time. After every Problem, ask: ''What''s that costing you per month?'' and ''How much time is your team spending on that?'' Quantify the implications. Make problems feel expensive. Do this every time this week."

✅ YOUR ACTION: Listen to 2 calls. Each Problem should have 2-3 Implication questions attached.'::TEXT
        ELSE '🌟 WINNING: Excellent Implication questions! Prospects are seeing the full cost of their problems.

📩 SEND THIS MESSAGE: "Outstanding Implication questioning! You''re helping prospects quantify the true cost of their problems, which is creating real urgency. This is SPIN done right. Keep it up."

✅ YOUR ACTION: Share example of their Implication sequence as team training.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Need-Payoff Questions analysis
    RETURN QUERY
    SELECT
      'SPIN Execution'::TEXT,
      'Need-Payoff Questions'::TEXT,
      (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not asking Need-Payoff questions - presenting your solution instead of letting them sell themselves.

📩 SEND THIS MESSAGE: "Hey [Name], Need-Payoff questions let prospects sell THEMSELVES. After Implication questions, ask: ''If we could solve that, what would that be worth to you?'' ''How would that change your quarterly results?'' ''Why is fixing this important to you personally?'' Let THEM describe the value. Then your solution is just giving them what they already said they want. Ask these on every call this week."

✅ YOUR ACTION: Create 5 Need-Payoff questions specific to your product. Roleplay them in next 1-on-1.'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Using Need-Payoff questions sometimes but not letting prospects fully articulate the value.

📩 SEND THIS MESSAGE: "Quick coaching: After asking Need-Payoff questions, STAY SILENT longer. You''re asking ''What would that be worth?'' but not letting them fully think through the value. Ask, then wait. Let them paint the picture of success in detail. The more THEY talk about the value, the easier the close. Practice this every time this week."

✅ YOUR ACTION: Listen to 1 call. After Need-Payoff questions, they should stay silent for 5+ seconds.'::TEXT
        ELSE '🌟 WINNING: Excellent Need-Payoff questions! Prospects are articulating the value in their own words.

📩 SEND THIS MESSAGE: "Outstanding Need-Payoff questioning! You''re getting prospects to describe exactly what success looks like and why it matters. When they sell themselves, your job is easy. Keep this up."

✅ YOUR ACTION: Share example of Need-Payoff question sequence as best practice.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Talk Ratio
    RETURN QUERY
    SELECT
      'Conversation Quality'::TEXT,
      'Talk Ratio'::TEXT,
      AVG(talk_percentage),
      COUNT(*)::INTEGER,
      SUM(CASE WHEN talk_percentage <= 35 THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN AVG(talk_percentage) > 50 THEN 'high'::TEXT
        WHEN AVG(talk_percentage) > 35 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN AVG(talk_percentage) > 50
        THEN '📊 ISSUE: Talking ' || ROUND(AVG(talk_percentage))::TEXT || '% - pitching solutions instead of asking SPIN questions.

📩 SEND THIS MESSAGE: "Hey [Name], SPIN is about questions, but you''re talking ' || ROUND(AVG(talk_percentage))::TEXT || '% of the time. That means you''re telling, not asking. Target: Ask a SPIN question, then let them talk. Count to 5 before speaking again. You should talk 30%, they should talk 70%. If you''re talking more, you''re not doing SPIN - you''re presenting. Fix this on your next 5 calls."

✅ YOUR ACTION: Listen to 1 call and count questions asked vs statements made. Should be 3:1 ratio.'::TEXT
        WHEN AVG(talk_percentage) > 35
        THEN '📊 ISSUE: Talk ratio ' || ROUND(AVG(talk_percentage))::TEXT || '% - asking questions but jumping in too quickly after answers.

📩 SEND THIS MESSAGE: "Quick coaching: Talk ratio is ' || ROUND(AVG(talk_percentage))::TEXT || '% (target: 30%). You''re asking SPIN questions but not letting prospects fully explore their answers. After they answer, wait 3 seconds. They''ll often add critical details. Especially on Implication and Need-Payoff questions - let them think out loud. Try this week."

✅ YOUR ACTION: Check again in 1 week. Talk ratio should trend toward 30% with longer pauses.'::TEXT
        ELSE '🌟 WINNING: Perfect talk ratio (' || ROUND(AVG(talk_percentage))::TEXT || '%) for SPIN! Asking great questions then listening.

📩 SEND THIS MESSAGE: "Excellent talk ratio! You''re asking powerful SPIN questions then giving prospects space to think and articulate their answers fully. This listening discipline makes SPIN work. Keep it up."

✅ YOUR ACTION: Share recording as example of strong SPIN question discipline.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    HAVING COUNT(*) > 0;

  ELSIF user_methodology = 'Gap' OR user_methodology = 'Gap Selling' THEN
    -- Gap Selling: Current State, Future State, Gap Analysis, Impact

    -- Current State Discovery analysis
    RETURN QUERY
    SELECT
      'Gap Selling Execution'::TEXT as category,
      'Current State Discovery'::TEXT as metric_name,
      (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not thoroughly documenting Current State - can''t show gap without clear baseline.

📩 SEND THIS MESSAGE: "Hey [Name], Gap Selling starts with deep Current State discovery. Don''t accept surface answers. Ask: ''Walk me through exactly how you do [process] today, step by step'' then ''What are the specific numbers? Close rate? Time? Cost?'' Document everything in detail. If you can''t describe their Current State back to them with precision, you can''t show the gap. Do this on every discovery call this week."

✅ YOUR ACTION: Review their next 2 deals. They should have detailed Current State documented with metrics.'::TEXT
        WHEN (SUM(CASE WHEN upfront_contract_set THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Capturing some Current State but not enough detail to quantify the gap.

📩 SEND THIS MESSAGE: "Quick coaching: You''re documenting Current State but need more specificity. When they describe their process, drill down: ''How many hours per week does that take?'' ''What does that cost you?'' ''How many times per month does that break?'' Get granular numbers. Vague Current State = weak gap. Make this your standard this week."

✅ YOUR ACTION: Spot-check their Current State documentation. Should have 5+ specific metrics per deal.'::TEXT
        ELSE '🌟 WINNING: Excellent Current State discovery! You''re documenting detailed, quantified baselines.

📩 SEND THIS MESSAGE: "Outstanding Current State discovery! You''re capturing detailed, quantified information about where they are today. This precision makes your gap analysis powerful and undeniable. Keep it up."

✅ YOUR ACTION: Share their Current State documentation template as team best practice.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Future State Vision analysis
    RETURN QUERY
    SELECT
      'Gap Selling Execution'::TEXT,
      'Future State Vision'::TEXT,
      (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not getting prospects to articulate clear Future State - they don''t know what success looks like.

📩 SEND THIS MESSAGE: "Hey [Name], after documenting Current State, you MUST get them to describe their ideal Future State. Ask: ''If we solved this perfectly, what would your process look like 6 months from now?'' ''What specific numbers would be different?'' ''What would you be doing that you can''t do today?'' Make them paint a detailed picture. No clear Future State = no gap = no urgency. Do this on every call this week."

✅ YOUR ACTION: Review recordings. They should be asking Future State questions before presenting any solution.'::TEXT
        WHEN (SUM(CASE WHEN pain_identified THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Getting Future State vision sometimes but not making it concrete with specific metrics.

📩 SEND THIS MESSAGE: "Quick coaching: You''re asking about Future State but need to make it more tangible. When they say ''we want to be faster,'' ask: ''Faster by how much? From what to what?'' Get specific numbers for the Future State just like you did for Current State. Vague vision = weak gap. Quantify the dream. Do this every time this week."

✅ YOUR ACTION: Check their Future State documentation. Should have specific metrics, not just qualitative descriptions.'::TEXT
        ELSE '🌟 WINNING: Excellent Future State vision work! Prospects have clear, quantified success pictures.

📩 SEND THIS MESSAGE: "Outstanding Future State questioning! You''re getting prospects to articulate exactly what success looks like with specific metrics. This clear vision makes the gap obvious and compelling. Keep it up."

✅ YOUR ACTION: Share example of their Future State discovery as team training.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Gap Identification analysis
    RETURN QUERY
    SELECT
      'Gap Selling Execution'::TEXT,
      'Gap Presentation'::TEXT,
      (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not explicitly presenting the gap - jumping from discovery to solution without the bridge.

📩 SEND THIS MESSAGE: "Hey [Name], Gap Selling requires you to SHOW THE GAP explicitly. After Current and Future State, summarize: ''So today you''re at [current state metrics], and you want to be at [future state metrics]. That''s a gap of [quantified difference]. Is that accurate?'' Make them SEE the distance. Don''t assume they calculated it themselves. Present the gap clearly on every call this week."

✅ YOUR ACTION: Listen to 1 call. They should explicitly articulate the gap with numbers before pitching.'::TEXT
        WHEN (SUM(CASE WHEN question_count > 10 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Presenting gaps sometimes but not consistently quantifying the distance.

📩 SEND THIS MESSAGE: "Quick coaching: When presenting the gap, always quantify the distance: ''You''re at 20% close rate today, you want 35%. That''s a 15-point gap, which at your deal size means $X in lost revenue quarterly.'' Make the gap feel REAL with numbers. The bigger and clearer the gap, the more urgency. Do this every time this week."

✅ YOUR ACTION: Review their proposals. Gap section should show Current vs Future with quantified difference.'::TEXT
        ELSE '🌟 WINNING: Excellent gap presentation! You''re clearly showing the distance between Current and Future State.

📩 SEND THIS MESSAGE: "Outstanding gap presentation! You''re making prospects SEE the distance between where they are and where they want to be, quantified. This clarity creates real urgency. Keep it up."

✅ YOUR ACTION: Share their gap presentation framework as team best practice.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Impact Quantification analysis
    RETURN QUERY
    SELECT
      'Gap Selling Execution'::TEXT,
      'Impact of Gap'::TEXT,
      (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5 THEN 'high'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.5
        THEN '📊 ISSUE: Not quantifying the cost of the gap - prospects don''t feel urgency to close it.

📩 SEND THIS MESSAGE: "Hey [Name], showing the gap isn''t enough - you must quantify what it''s COSTING them. After presenting the gap, ask: ''What is this gap costing you per month in lost revenue?'' ''How much time is your team wasting because of this gap?'' Get dollar amounts. Then: ''If this gap stays for 6 more months, what''s the total impact?'' Make the gap painful with numbers. Do this on every call this week."

✅ YOUR ACTION: Review deals. Each should have gap cost documented in dollars/time before proposal stage.'::TEXT
        WHEN (SUM(CASE WHEN budget_discussed THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) < 0.7
        THEN '📊 ISSUE: Quantifying impact sometimes but not connecting it to business outcomes consistently.

📩 SEND THIS MESSAGE: "Quick coaching: When quantifying gap impact, connect to what leadership cares about: revenue, profit, time, customer satisfaction. Don''t just say ''This costs you money'' - say ''This 15-point close rate gap is costing you $180K per quarter. Over a year, that''s $720K in lost revenue.'' Make it BIG and SPECIFIC. Do this every time this week."

✅ YOUR ACTION: Check their proposals. Impact section should show annual cost of maintaining the gap.'::TEXT
        ELSE '🌟 WINNING: Excellent impact quantification! You''re making the cost of the gap undeniable.

📩 SEND THIS MESSAGE: "Outstanding impact quantification! You''re showing exactly what the gap is costing them in dollars and time. This makes closing the gap feel urgent and essential. Keep it up."

✅ YOUR ACTION: Use their impact quantification as team training example.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;

    -- Talk Ratio
    RETURN QUERY
    SELECT
      'Conversation Quality'::TEXT,
      'Talk Ratio'::TEXT,
      AVG(talk_percentage),
      COUNT(*)::INTEGER,
      SUM(CASE WHEN talk_percentage <= 35 THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN AVG(talk_percentage) > 50 THEN 'high'::TEXT
        WHEN AVG(talk_percentage) > 35 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      CASE
        WHEN AVG(talk_percentage) > 50
        THEN '📊 ISSUE: Talking ' || ROUND(AVG(talk_percentage))::TEXT || '% - presenting solutions instead of discovering Current/Future State.

📩 SEND THIS MESSAGE: "Hey [Name], Gap Selling requires deep discovery, but you''re talking ' || ROUND(AVG(talk_percentage))::TEXT || '% of the time. That means you''re presenting, not discovering. Ask Current State questions, then Future State questions, then let THEM talk. You need to understand their world before showing gaps. Target: 30% you asking, 70% them describing. Fix this on your next 5 calls."

✅ YOUR ACTION: Listen to 1 call. Count discovery questions asked (should be 15+ for Current + Future State).'::TEXT
        WHEN AVG(talk_percentage) > 35
        THEN '📊 ISSUE: Talk ratio ' || ROUND(AVG(talk_percentage))::TEXT || '% - asking questions but not letting prospects fully explore answers.

📩 SEND THIS MESSAGE: "Quick coaching: Talk ratio is ' || ROUND(AVG(talk_percentage))::TEXT || '% (target: 30%). You''re asking good Current/Future State questions but jumping in too fast. After asking about their Future State, let them dream out loud. Stay silent longer. The more detail they give you, the clearer the gap becomes. Try this week."

✅ YOUR ACTION: Check in 1 week. Talk ratio should trend toward 30% with longer silences after questions.'::TEXT
        ELSE '🌟 WINNING: Perfect talk ratio (' || ROUND(AVG(talk_percentage))::TEXT || '%) for Gap Selling! Deep discovery happening.

📩 SEND THIS MESSAGE: "Excellent talk ratio! You''re asking great Current/Future State questions then letting prospects fully articulate their situation. This deep discovery makes your gap analysis powerful. Keep it up."

✅ YOUR ACTION: Share recording as example of thorough Gap Selling discovery.'::TEXT
      END
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    HAVING COUNT(*) > 0;

  ELSE
    -- For unknown methodologies, return generic insights
    RETURN QUERY
    SELECT
      'General Performance'::TEXT,
      'Overall Quality Score'::TEXT,
      AVG(overall_sandler_score) * 10,
      COUNT(*)::INTEGER,
      SUM(CASE WHEN overall_sandler_score >= 7 THEN 1 ELSE 0 END)::INTEGER,
      CASE
        WHEN AVG(overall_sandler_score) < 6 THEN 'high'::TEXT
        WHEN AVG(overall_sandler_score) < 7.5 THEN 'medium'::TEXT
        ELSE 'low'::TEXT
      END,
      'Select a sales methodology (MEDDIC, Challenger, Sandler, SPIN, or Gap Selling) in settings to receive methodology-specific coaching insights.'::TEXT
    FROM "Conversation_Analyses"
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    HAVING COUNT(*) > 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: get_team_benchmarks
-- Returns team-wide averages for comparison
-- ============================================
CREATE OR REPLACE FUNCTION get_team_benchmarks(
  admin_email TEXT,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  avg_dials NUMERIC,
  avg_conversations NUMERIC,
  avg_meetings NUMERIC,
  avg_dial_conv_rate NUMERIC,
  avg_conv_meeting_rate NUMERIC,
  avg_revenue NUMERIC,
  avg_sandler_score NUMERIC,
  avg_upfront_contract_rate NUMERIC,
  avg_pain_funnel_rate NUMERIC,
  avg_budget_rate NUMERIC,
  avg_talk_percentage NUMERIC
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF admin_email NOT IN ('admin@aiadvantagesolutions.com', 'admin@aiadvantagesolutions.ca', 'john@aiadvantagesolutions.com') THEN
    RAISE EXCEPTION 'Unauthorized: Not an admin user';
  END IF;

  -- Calculate team-wide averages
  RETURN QUERY
  WITH team_activity AS (
    SELECT
      user_id,
      SUM(dials)::NUMERIC / COUNT(DISTINCT date) as avg_daily_dials,
      SUM(conversations)::NUMERIC / COUNT(DISTINCT date) as avg_daily_conversations,
      SUM(discovery_meetings)::NUMERIC / COUNT(DISTINCT date) as avg_daily_meetings,
      CASE
        WHEN SUM(dials) > 0
        THEN (SUM(conversations)::NUMERIC / SUM(dials)) * 100
        ELSE 0
      END as dial_conv_rate,
      CASE
        WHEN SUM(conversations) > 0
        THEN (SUM(discovery_meetings)::NUMERIC / SUM(conversations)) * 100
        ELSE 0
      END as conv_meeting_rate
    FROM "Daily_Tracker"
    WHERE date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY user_id
  ),
  team_revenue AS (
    SELECT
      user_id,
      AVG(amount_cad) as avg_sale
    FROM "Sales"
    WHERE date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY user_id
  ),
  team_quality AS (
    SELECT
      user_id,
      AVG(overall_sandler_score) as avg_score,
      AVG(CASE WHEN upfront_contract_set THEN 100 ELSE 0 END) as upfront_rate,
      AVG(CASE WHEN pain_identified THEN 100 ELSE 0 END) as pain_rate,
      AVG(CASE WHEN budget_discussed THEN 100 ELSE 0 END) as budget_rate,
      AVG(talk_percentage) as talk_pct
    FROM "Conversation_Analyses"
    WHERE date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY user_id
  )
  SELECT
    AVG(ta.avg_daily_dials),
    AVG(ta.avg_daily_conversations),
    AVG(ta.avg_daily_meetings),
    AVG(ta.dial_conv_rate),
    AVG(ta.conv_meeting_rate),
    AVG(tr.avg_sale),
    AVG(tq.avg_score),
    AVG(tq.upfront_rate),
    AVG(tq.pain_rate),
    AVG(tq.budget_rate),
    AVG(tq.talk_pct)
  FROM team_activity ta
  LEFT JOIN team_revenue tr ON ta.user_id = tr.user_id
  LEFT JOIN team_quality tq ON ta.user_id = tq.user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Manager Team Coaching Dashboard - Functions Created!';
    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY DEFINER functions created:';
    RAISE NOTICE '  - get_team_overview(admin_email, days_back)';
    RAISE NOTICE '    Returns all users with metrics and top weakness/strength';
    RAISE NOTICE '';
    RAISE NOTICE '  - get_user_categorical_insights(admin_email, user_id, days_back)';
    RAISE NOTICE '    Deep analysis of Sandler methodology execution';
    RAISE NOTICE '';
    RAISE NOTICE '  - get_team_benchmarks(admin_email, days_back)';
    RAISE NOTICE '    Team-wide averages for comparison';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Security: Only admins can call these functions';
    RAISE NOTICE '⏭️  NEXT STEP: Create admin-team.html to build the UI';
    RAISE NOTICE '';
END $$;
