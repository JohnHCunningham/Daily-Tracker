-- ============================================
-- SALES PIPELINE INTEGRATION
-- ============================================
-- Connects Lead Attribution system with existing Daily-Tracker sales pipeline
-- Deploy AFTER: lead-attribution-schema.sql, lead-enrichment-schema.sql, and supabase-schema.sql

-- ============================================
-- 1. ADD LEAD_ID TO SALES TABLE
-- ============================================

-- Add lead tracking to existing sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES Leads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS opportunity_id UUID,
ADD COLUMN IF NOT EXISTS days_to_close INTEGER,
ADD COLUMN IF NOT EXISTS touchpoints_to_close INTEGER;

-- Create index for lead lookups
CREATE INDEX IF NOT EXISTS idx_sales_lead_id ON sales(lead_id);

-- ============================================
-- 2. ADD LEAD_ID TO PROJECTS TABLE
-- ============================================

-- Connect projects to leads
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES Leads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS opportunity_value DECIMAL(10, 2);

CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON projects(lead_id);

-- ============================================
-- 3. OPPORTUNITIES TABLE
-- ============================================
-- Bridge between Leads and Sales/Projects

CREATE TABLE IF NOT EXISTS Opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES Leads(id) ON DELETE CASCADE,

    -- Opportunity Details
    opportunity_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    stage VARCHAR(50) DEFAULT 'qualification' CHECK (stage IN (
        'qualification',
        'discovery',
        'demo',
        'proposal',
        'negotiation',
        'closed_won',
        'closed_lost'
    )),
    probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,

    -- Assignment
    owner_email VARCHAR(255),
    sales_rep_id UUID,

    -- Tracking
    created_from VARCHAR(50), -- 'inbound_lead', 'outbound_prospecting', 'referral', 'partner'
    loss_reason VARCHAR(255),
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(lead_id, opportunity_name)
);

CREATE INDEX idx_opportunities_lead ON Opportunities(lead_id);
CREATE INDEX idx_opportunities_stage ON Opportunities(stage);
CREATE INDEX idx_opportunities_owner ON Opportunities(owner_email);
CREATE INDEX idx_opportunities_close_date ON Opportunities(expected_close_date);

-- ============================================
-- 4. TRIGGER: AUTO-UPDATE LEAD STATUS ON OPPORTUNITY STAGE CHANGE
-- ============================================

CREATE OR REPLACE FUNCTION sync_lead_status_from_opportunity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update lead status based on opportunity stage
    IF NEW.stage = 'closed_won' THEN
        UPDATE Leads
        SET
            lead_status = 'customer',
            closed_won_date = COALESCE(NEW.actual_close_date, NOW()),
            closed_revenue = NEW.amount,
            opportunity_value = NEW.amount
        WHERE id = NEW.lead_id;

    ELSIF NEW.stage = 'closed_lost' THEN
        UPDATE Leads
        SET
            lead_status = 'lost',
            closed_lost_date = COALESCE(NEW.actual_close_date, NOW())
        WHERE id = NEW.lead_id;

    ELSIF NEW.stage = 'proposal' OR NEW.stage = 'negotiation' THEN
        UPDATE Leads
        SET
            lead_status = 'opportunity',
            opportunity_value = NEW.amount
        WHERE id = NEW.lead_id;

    ELSIF NEW.stage = 'discovery' OR NEW.stage = 'demo' THEN
        UPDATE Leads
        SET
            lead_status = 'meeting_completed',
            meeting_completed_date = COALESCE(
                (SELECT MAX(created_at) FROM Lead_Touchpoints WHERE lead_id = NEW.lead_id),
                NOW()
            )
        WHERE id = NEW.lead_id;

    ELSIF NEW.stage = 'qualification' THEN
        UPDATE Leads
        SET lead_status = 'qualified'
        WHERE id = NEW.lead_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_from_opportunity
AFTER INSERT OR UPDATE ON Opportunities
FOR EACH ROW
EXECUTE FUNCTION sync_lead_status_from_opportunity();

-- ============================================
-- 5. TRIGGER: AUTO-CREATE SALE WHEN OPPORTUNITY CLOSES
-- ============================================

CREATE OR REPLACE FUNCTION create_sale_from_opportunity()
RETURNS TRIGGER AS $$
DECLARE
    v_lead RECORD;
    v_client_name VARCHAR(255);
BEGIN
    -- Only create sale when opportunity closes won
    IF NEW.stage = 'closed_won' AND (OLD.stage IS NULL OR OLD.stage != 'closed_won') THEN

        -- Get lead information
        SELECT * INTO v_lead FROM Leads WHERE id = NEW.lead_id;

        -- Determine client name
        v_client_name := COALESCE(
            v_lead.company,
            v_lead.first_name || ' ' || v_lead.last_name,
            v_lead.email
        );

        -- Create sale record
        INSERT INTO sales (
            date,
            amount_cad,
            client_name,
            service_type,
            notes,
            lead_id,
            opportunity_id,
            days_to_close,
            touchpoints_to_close
        )
        VALUES (
            COALESCE(NEW.actual_close_date, CURRENT_DATE),
            NEW.amount,
            v_client_name,
            'SalesAI.Coach Subscription', -- Default service type
            NEW.notes,
            NEW.lead_id,
            NEW.id,
            EXTRACT(DAY FROM (COALESCE(NEW.actual_close_date, NOW()) - v_lead.created_at)),
            (SELECT COUNT(*) FROM Lead_Touchpoints WHERE lead_id = NEW.lead_id)
        );

        -- Update Lead_to_Sale_Journey
        INSERT INTO Lead_to_Sale_Journey (
            lead_id,
            stage,
            stage_entered_at,
            days_in_stage
        )
        VALUES (
            NEW.lead_id,
            'customer',
            COALESCE(NEW.actual_close_date, NOW()),
            0
        )
        ON CONFLICT (lead_id, stage) DO NOTHING;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_sale_on_opportunity_won
AFTER INSERT OR UPDATE ON Opportunities
FOR EACH ROW
EXECUTE FUNCTION create_sale_from_opportunity();

-- ============================================
-- 6. VIEW: FULL ATTRIBUTION REPORT (Lead to Sale)
-- ============================================

CREATE OR REPLACE VIEW Full_Attribution_Report AS
SELECT
    l.id as lead_id,
    l.email,
    COALESCE(l.first_name || ' ' || l.last_name, l.email) as lead_name,
    l.company,

    -- Attribution
    ls_first.source_name as first_touch_source,
    ls_last.source_name as last_touch_source,
    c_first.campaign_name as first_touch_campaign,
    c_last.campaign_name as last_touch_campaign,
    l.first_touch_utm_medium,
    l.last_touch_utm_medium,

    -- Lead Quality
    l.quality_score,
    l.lead_grade,
    l.is_high_value,

    -- Enrichment
    le.linkedin_current_title,
    le.company_size,
    le.market_position,

    -- Opportunity
    o.opportunity_name,
    o.stage as opportunity_stage,
    o.amount as opportunity_value,
    o.probability,
    o.expected_close_date,

    -- Sale
    s.date as sale_date,
    s.amount_cad as sale_amount,
    s.service_type,

    -- Journey Metrics
    l.created_at as lead_created_at,
    l.first_contact_date,
    l.meeting_completed_date,
    l.closed_won_date,
    EXTRACT(DAY FROM (l.closed_won_date - l.created_at)) as days_to_close,

    -- Touchpoint Count
    (SELECT COUNT(*) FROM Lead_Touchpoints WHERE lead_id = l.id) as total_touchpoints,

    -- Campaign ROI Attribution
    (SELECT SUM(amount_spent)
     FROM Campaign_Spend cs
     WHERE cs.campaign_id = l.first_touch_campaign_id
     AND cs.spend_date BETWEEN l.first_touch_date - INTERVAL '7 days' AND l.first_touch_date
    ) as attributed_campaign_spend,

    -- ROI Calculation
    CASE
        WHEN (SELECT SUM(amount_spent)
              FROM Campaign_Spend cs
              WHERE cs.campaign_id = l.first_touch_campaign_id
              AND cs.spend_date BETWEEN l.first_touch_date - INTERVAL '7 days' AND l.first_touch_date) > 0
        THEN ROUND(
            ((s.amount_cad - (SELECT SUM(amount_spent)
                              FROM Campaign_Spend cs
                              WHERE cs.campaign_id = l.first_touch_campaign_id
                              AND cs.spend_date BETWEEN l.first_touch_date - INTERVAL '7 days' AND l.first_touch_date))
            / (SELECT SUM(amount_spent)
               FROM Campaign_Spend cs
               WHERE cs.campaign_id = l.first_touch_campaign_id
               AND cs.spend_date BETWEEN l.first_touch_date - INTERVAL '7 days' AND l.first_touch_date)) * 100,
            2
        )
        ELSE NULL
    END as roi_percentage,

    -- Lead Status
    l.lead_status,
    l.enrichment_status

FROM Leads l
LEFT JOIN Lead_Sources ls_first ON l.first_touch_source_id = ls_first.id
LEFT JOIN Lead_Sources ls_last ON l.last_touch_source_id = ls_last.id
LEFT JOIN Campaigns c_first ON l.first_touch_campaign_id = c_first.id
LEFT JOIN Campaigns c_last ON l.last_touch_campaign_id = c_last.id
LEFT JOIN Lead_Enrichment le ON l.id = le.lead_id
LEFT JOIN Opportunities o ON l.id = o.lead_id
LEFT JOIN sales s ON l.id = s.lead_id
ORDER BY l.created_at DESC;

-- ============================================
-- 7. VIEW: CAMPAIGN ROI WITH CLOSED DEALS
-- ============================================

CREATE OR REPLACE VIEW Campaign_ROI_Report AS
SELECT
    c.campaign_name,
    ls.source_name,
    c.start_date,
    c.end_date,
    c.budget,

    -- Spend
    COALESCE(SUM(cs.amount_spent), 0) as total_spend,
    COALESCE(SUM(cs.clicks), 0) as total_clicks,
    COALESCE(SUM(cs.impressions), 0) as total_impressions,

    -- Leads
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.lead_grade IN ('A+', 'A') THEN l.id END) as high_value_leads,

    -- Opportunities
    COUNT(DISTINCT o.id) as total_opportunities,
    SUM(o.amount) FILTER (WHERE o.stage IN ('qualification', 'discovery', 'demo', 'proposal', 'negotiation')) as pipeline_value,

    -- Closed Deals
    COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END) as customers_won,
    COALESCE(SUM(s.amount_cad), 0) as total_revenue,

    -- Conversion Rates
    CASE
        WHEN COUNT(DISTINCT l.id) > 0
        THEN ROUND((COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END)::NUMERIC / COUNT(DISTINCT l.id)) * 100, 2)
        ELSE 0
    END as lead_to_customer_rate,

    -- Cost Metrics
    CASE
        WHEN COUNT(DISTINCT l.id) > 0
        THEN ROUND(COALESCE(SUM(cs.amount_spent), 0) / COUNT(DISTINCT l.id), 2)
        ELSE 0
    END as cost_per_lead,

    CASE
        WHEN COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END) > 0
        THEN ROUND(COALESCE(SUM(cs.amount_spent), 0) / COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END), 2)
        ELSE 0
    END as customer_acquisition_cost,

    -- ROI
    CASE
        WHEN COALESCE(SUM(cs.amount_spent), 0) > 0
        THEN ROUND(((COALESCE(SUM(s.amount_cad), 0) - COALESCE(SUM(cs.amount_spent), 0)) / COALESCE(SUM(cs.amount_spent), 0)) * 100, 2)
        ELSE 0
    END as roi_percentage,

    CASE
        WHEN COALESCE(SUM(cs.amount_spent), 0) > 0
        THEN ROUND(COALESCE(SUM(s.amount_cad), 0) - COALESCE(SUM(cs.amount_spent), 0), 2)
        ELSE 0
    END as net_profit

FROM Campaigns c
LEFT JOIN Lead_Sources ls ON c.lead_source_id = ls.id
LEFT JOIN Campaign_Spend cs ON c.id = cs.campaign_id
LEFT JOIN Leads l ON c.id = l.first_touch_campaign_id
LEFT JOIN Opportunities o ON l.id = o.lead_id
LEFT JOIN sales s ON l.id = s.lead_id
GROUP BY c.campaign_name, ls.source_name, c.start_date, c.end_date, c.budget
ORDER BY roi_percentage DESC;

-- ============================================
-- 8. VIEW: SALES VELOCITY BY SOURCE
-- ============================================

CREATE OR REPLACE VIEW Sales_Velocity_By_Source AS
SELECT
    ls.source_name,
    ls.source_category,

    -- Lead Volume
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.quality_score >= 80 THEN l.id END) as high_quality_leads,

    -- Conversion Metrics
    COUNT(DISTINCT CASE WHEN l.lead_status = 'qualified' THEN l.id END) as qualified_leads,
    COUNT(DISTINCT CASE WHEN l.meeting_completed_date IS NOT NULL THEN l.id END) as meetings_held,
    COUNT(DISTINCT o.id) as opportunities_created,
    COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END) as deals_won,

    -- Conversion Rates
    ROUND(
        (COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END)::NUMERIC / NULLIF(COUNT(DISTINCT l.id), 0)) * 100,
        2
    ) as lead_to_customer_rate,

    -- Velocity Metrics (average days)
    ROUND(AVG(EXTRACT(DAY FROM (l.first_contact_date - l.created_at)))) as avg_days_to_contact,
    ROUND(AVG(EXTRACT(DAY FROM (l.meeting_completed_date - l.created_at)))) as avg_days_to_meeting,
    ROUND(AVG(EXTRACT(DAY FROM (l.closed_won_date - l.created_at)))) as avg_days_to_close,

    -- Revenue
    SUM(s.amount_cad) as total_revenue,
    ROUND(AVG(s.amount_cad), 2) as avg_deal_size

FROM Lead_Sources ls
LEFT JOIN Leads l ON ls.id = l.first_touch_source_id
LEFT JOIN Opportunities o ON l.id = o.lead_id
LEFT JOIN sales s ON l.id = s.lead_id
GROUP BY ls.source_name, ls.source_category
ORDER BY total_revenue DESC NULLS LAST;

-- ============================================
-- 9. FUNCTION: GET LEAD CONVERSION FUNNEL
-- ============================================

CREATE OR REPLACE FUNCTION get_lead_conversion_funnel(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE,
    source_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    stage VARCHAR,
    count INTEGER,
    percentage NUMERIC,
    avg_days_in_stage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH funnel_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE l.created_at BETWEEN start_date AND end_date) as total_leads,
            COUNT(*) FILTER (WHERE l.first_contact_date IS NOT NULL) as contacted,
            COUNT(*) FILTER (WHERE l.lead_status = 'qualified') as qualified,
            COUNT(*) FILTER (WHERE l.meeting_completed_date IS NOT NULL) as meetings,
            COUNT(*) FILTER (WHERE l.lead_status = 'opportunity') as opportunities,
            COUNT(*) FILTER (WHERE l.closed_won_date IS NOT NULL) as customers,

            AVG(EXTRACT(DAY FROM (l.first_contact_date - l.created_at)))
                FILTER (WHERE l.first_contact_date IS NOT NULL) as avg_days_to_contact,
            AVG(EXTRACT(DAY FROM (l.meeting_completed_date - l.first_contact_date)))
                FILTER (WHERE l.meeting_completed_date IS NOT NULL AND l.first_contact_date IS NOT NULL) as avg_days_to_meeting,
            AVG(EXTRACT(DAY FROM (l.closed_won_date - l.meeting_completed_date)))
                FILTER (WHERE l.closed_won_date IS NOT NULL AND l.meeting_completed_date IS NOT NULL) as avg_days_to_close

        FROM Leads l
        WHERE (source_filter IS NULL OR l.first_touch_source_id = source_filter)
    )
    SELECT
        'Leads Created'::VARCHAR,
        total_leads::INTEGER,
        100.00::NUMERIC,
        0::NUMERIC
    FROM funnel_stats
    UNION ALL
    SELECT
        'Contacted'::VARCHAR,
        contacted::INTEGER,
        ROUND((contacted::NUMERIC / NULLIF(total_leads, 0)) * 100, 2),
        ROUND(avg_days_to_contact, 1)
    FROM funnel_stats
    UNION ALL
    SELECT
        'Qualified'::VARCHAR,
        qualified::INTEGER,
        ROUND((qualified::NUMERIC / NULLIF(total_leads, 0)) * 100, 2),
        0::NUMERIC
    FROM funnel_stats
    UNION ALL
    SELECT
        'Meetings Held'::VARCHAR,
        meetings::INTEGER,
        ROUND((meetings::NUMERIC / NULLIF(total_leads, 0)) * 100, 2),
        ROUND(avg_days_to_meeting, 1)
    FROM funnel_stats
    UNION ALL
    SELECT
        'Opportunities'::VARCHAR,
        opportunities::INTEGER,
        ROUND((opportunities::NUMERIC / NULLIF(total_leads, 0)) * 100, 2),
        0::NUMERIC
    FROM funnel_stats
    UNION ALL
    SELECT
        'Customers'::VARCHAR,
        customers::INTEGER,
        ROUND((customers::NUMERIC / NULLIF(total_leads, 0)) * 100, 2),
        ROUND(avg_days_to_close, 1)
    FROM funnel_stats;
END;
$$;

-- ============================================
-- 10. UPDATE daily_stats WITH LEAD METRICS
-- ============================================

-- Add lead tracking to daily stats
ALTER TABLE daily_stats
ADD COLUMN IF NOT EXISTS leads_created INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leads_contacted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leads_qualified INTEGER DEFAULT 0;

-- Function to sync daily stats from Leads table
CREATE OR REPLACE FUNCTION sync_daily_stats_from_leads()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO daily_stats (date, leads_created, leads_contacted, leads_qualified)
    SELECT
        DATE(created_at) as date,
        COUNT(*) as leads_created,
        COUNT(*) FILTER (WHERE first_contact_date::DATE = DATE(created_at)) as leads_contacted,
        COUNT(*) FILTER (WHERE lead_status = 'qualified') as leads_qualified
    FROM Leads
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY DATE(created_at)
    ON CONFLICT (date)
    DO UPDATE SET
        leads_created = EXCLUDED.leads_created,
        leads_contacted = EXCLUDED.leads_contacted,
        leads_qualified = EXCLUDED.leads_qualified;
END;
$$;

-- Run sync on deployment
SELECT sync_daily_stats_from_leads();

-- ============================================
-- 11. TRIGGER: AUTO-UPDATE daily_stats ON NEW LEAD
-- ============================================

CREATE OR REPLACE FUNCTION update_daily_stats_on_lead()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_stats (date, leads_created)
    VALUES (DATE(NEW.created_at), 1)
    ON CONFLICT (date)
    DO UPDATE SET leads_created = daily_stats.leads_created + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_daily_leads
AFTER INSERT ON Leads
FOR EACH ROW
EXECUTE FUNCTION update_daily_stats_on_lead();

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================

-- Verify integration with sample queries:

-- 1. View full attribution for recent customers
-- SELECT * FROM Full_Attribution_Report WHERE closed_won_date IS NOT NULL ORDER BY closed_won_date DESC LIMIT 10;

-- 2. View campaign ROI
-- SELECT * FROM Campaign_ROI_Report ORDER BY roi_percentage DESC;

-- 3. View sales velocity by source
-- SELECT * FROM Sales_Velocity_By_Source;

-- 4. Get conversion funnel for last 30 days
-- SELECT * FROM get_lead_conversion_funnel(CURRENT_DATE - 30, CURRENT_DATE);
