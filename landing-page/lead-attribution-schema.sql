-- ============================================
-- LEAD ATTRIBUTION & CAMPAIGN TRACKING SCHEMA
-- Track lead sources, campaigns, ad spend, and ROI
-- ============================================

-- ============================================
-- TABLE: Lead_Sources
-- Master list of all lead sources
-- ============================================
CREATE TABLE IF NOT EXISTS Lead_Sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE,
    source_type VARCHAR(50) CHECK (source_type IN (
        'paid_search',      -- Google Ads, Bing Ads
        'paid_social',      -- Facebook, LinkedIn, Twitter Ads
        'organic_search',   -- SEO traffic
        'organic_social',   -- Social media (unpaid)
        'referral',         -- Partner/customer referrals
        'direct',           -- Direct traffic
        'email',            -- Email campaigns
        'content',          -- Blog, whitepapers, webinars
        'event',            -- Conferences, trade shows
        'other'
    )),
    is_active BOOLEAN DEFAULT TRUE,
    default_cost_per_lead NUMERIC(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default lead sources
INSERT INTO Lead_Sources (source_name, source_type, default_cost_per_lead) VALUES
('Google Ads', 'paid_search', 50.00),
('Facebook Ads', 'paid_social', 35.00),
('LinkedIn Ads', 'paid_social', 75.00),
('Twitter Ads', 'paid_social', 40.00),
('Instagram Ads', 'paid_social', 30.00),
('Organic Search (Google)', 'organic_search', 0.00),
('Organic Search (Bing)', 'organic_search', 0.00),
('LinkedIn Organic', 'organic_social', 0.00),
('Twitter Organic', 'organic_social', 0.00),
('Customer Referral', 'referral', 0.00),
('Partner Referral', 'referral', 0.00),
('Direct Traffic', 'direct', 0.00),
('Email Newsletter', 'email', 5.00),
('Email Campaign', 'email', 10.00),
('Blog Post', 'content', 0.00),
('Webinar', 'content', 100.00),
('Whitepaper/Ebook', 'content', 20.00),
('Conference/Event', 'event', 200.00),
('Other', 'other', 0.00)
ON CONFLICT (source_name) DO NOTHING;

-- ============================================
-- TABLE: Campaigns
-- Track individual marketing campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS Campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_code VARCHAR(100) UNIQUE, -- utm_campaign value
    lead_source_id UUID REFERENCES Lead_Sources(id),

    -- Campaign Details
    campaign_type VARCHAR(50) CHECK (campaign_type IN (
        'awareness',
        'consideration',
        'conversion',
        'retention',
        'other'
    )),
    start_date DATE,
    end_date DATE,

    -- Budget & Spend
    budget_total NUMERIC(10, 2),
    budget_monthly NUMERIC(10, 2),

    -- Targeting
    target_audience TEXT,
    geographic_target TEXT,

    -- Campaign URLs
    landing_page_url TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: Campaign_Spend
-- Track daily/monthly ad spend per campaign
-- ============================================
CREATE TABLE IF NOT EXISTS Campaign_Spend (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES Campaigns(id) ON DELETE CASCADE,

    -- Spend Details
    spend_date DATE NOT NULL,
    amount_spent NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',

    -- Metrics from Ad Platform
    impressions INTEGER,
    clicks INTEGER,
    ctr NUMERIC(5, 2), -- Click-through rate
    cpc NUMERIC(10, 2), -- Cost per click

    -- Data Source
    data_source VARCHAR(50), -- 'manual', 'google_ads_api', 'facebook_api', etc.

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(campaign_id, spend_date)
);

-- ============================================
-- TABLE: Leads
-- Track all incoming leads with attribution
-- ============================================
CREATE TABLE IF NOT EXISTS Leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Lead Information
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    job_title VARCHAR(100),

    -- Attribution (First Touch)
    first_touch_source_id UUID REFERENCES Lead_Sources(id),
    first_touch_campaign_id UUID REFERENCES Campaigns(id),
    first_touch_date TIMESTAMPTZ DEFAULT NOW(),
    first_touch_utm_source VARCHAR(255),
    first_touch_utm_medium VARCHAR(255),
    first_touch_utm_campaign VARCHAR(255),
    first_touch_utm_term VARCHAR(255),
    first_touch_utm_content VARCHAR(255),
    first_touch_referrer TEXT,
    first_touch_landing_page TEXT,

    -- Attribution (Last Touch)
    last_touch_source_id UUID REFERENCES Lead_Sources(id),
    last_touch_campaign_id UUID REFERENCES Campaigns(id),
    last_touch_date TIMESTAMPTZ,
    last_touch_utm_source VARCHAR(255),
    last_touch_utm_medium VARCHAR(255),
    last_touch_utm_campaign VARCHAR(255),
    last_touch_utm_term VARCHAR(255),
    last_touch_utm_content VARCHAR(255),
    last_touch_referrer TEXT,
    last_touch_landing_page TEXT,

    -- Lead Details
    lead_score INTEGER DEFAULT 0,
    lead_status VARCHAR(50) DEFAULT 'new' CHECK (lead_status IN (
        'new',
        'contacted',
        'qualified',
        'unqualified',
        'meeting_scheduled',
        'meeting_completed',
        'opportunity',
        'customer',
        'lost',
        'spam'
    )),

    -- Engagement Tracking
    form_submissions INTEGER DEFAULT 1,
    page_views INTEGER DEFAULT 1,
    content_downloads INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,

    -- Lead Source Details (from form)
    how_did_you_hear_about_us TEXT,
    interests TEXT[],
    message TEXT,

    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ,

    -- Outcome Tracking
    first_contact_date TIMESTAMPTZ,
    meeting_scheduled_date TIMESTAMPTZ,
    meeting_completed_date TIMESTAMPTZ,
    opportunity_created_date TIMESTAMPTZ,
    closed_won_date TIMESTAMPTZ,
    closed_lost_date TIMESTAMPTZ,
    closed_lost_reason TEXT,

    -- Revenue Attribution
    opportunity_value NUMERIC(10, 2),
    closed_revenue NUMERIC(10, 2),

    -- Technical Details
    ip_address INET,
    user_agent TEXT,
    browser VARCHAR(100),
    device VARCHAR(50),
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(email)
);

-- ============================================
-- TABLE: Lead_Touchpoints
-- Track every interaction a lead has (multi-touch attribution)
-- ============================================
CREATE TABLE IF NOT EXISTS Lead_Touchpoints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES Leads(id) ON DELETE CASCADE,

    -- Touchpoint Details
    touchpoint_date TIMESTAMPTZ DEFAULT NOW(),
    touchpoint_type VARCHAR(50) CHECK (touchpoint_type IN (
        'website_visit',
        'form_submission',
        'content_download',
        'email_open',
        'email_click',
        'ad_click',
        'social_engagement',
        'webinar_registration',
        'webinar_attendance',
        'demo_request',
        'call_inbound',
        'call_outbound',
        'meeting',
        'other'
    )),

    -- Attribution
    source_id UUID REFERENCES Lead_Sources(id),
    campaign_id UUID REFERENCES Campaigns(id),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),

    -- Touchpoint Details
    page_url TEXT,
    referrer TEXT,
    content_title VARCHAR(255),

    -- Technical
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: Lead_to_Sale_Journey
-- Track the complete journey from lead to customer
-- ============================================
CREATE TABLE IF NOT EXISTS Lead_to_Sale_Journey (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES Leads(id) ON DELETE CASCADE,

    -- Sales Pipeline Stages
    stage VARCHAR(50) CHECK (stage IN (
        'lead',
        'contacted',
        'qualified',
        'meeting_scheduled',
        'meeting_completed',
        'proposal_sent',
        'negotiation',
        'closed_won',
        'closed_lost'
    )),
    stage_entered_date TIMESTAMPTZ DEFAULT NOW(),
    stage_exited_date TIMESTAMPTZ,
    time_in_stage_hours NUMERIC(10, 2),

    -- Stage Owners
    stage_owner UUID REFERENCES auth.users(id),

    -- Notes
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_email ON Leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON Leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_first_source ON Leads(first_touch_source_id);
CREATE INDEX IF NOT EXISTS idx_leads_last_source ON Leads(last_touch_source_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON Leads(first_touch_campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON Leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created ON Leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_touchpoints_lead ON Lead_Touchpoints(lead_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_date ON Lead_Touchpoints(touchpoint_date DESC);
CREATE INDEX IF NOT EXISTS idx_touchpoints_source ON Lead_Touchpoints(source_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_campaign ON Lead_Touchpoints(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_spend_campaign ON Campaign_Spend(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_spend_date ON Campaign_Spend(spend_date DESC);

CREATE INDEX IF NOT EXISTS idx_journey_lead ON Lead_to_Sale_Journey(lead_id);
CREATE INDEX IF NOT EXISTS idx_journey_stage ON Lead_to_Sale_Journey(stage);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lead_sources_updated_at ON Lead_Sources;
CREATE TRIGGER update_lead_sources_updated_at
    BEFORE UPDATE ON Lead_Sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON Campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON Campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON Leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON Leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Campaign Performance Summary
CREATE OR REPLACE VIEW Campaign_Performance AS
SELECT
    c.id as campaign_id,
    c.campaign_name,
    c.campaign_code,
    ls.source_name,
    ls.source_type,
    c.status,
    c.start_date,
    c.end_date,

    -- Spend Metrics
    COALESCE(SUM(cs.amount_spent), 0) as total_spend,
    COALESCE(SUM(cs.impressions), 0) as total_impressions,
    COALESCE(SUM(cs.clicks), 0) as total_clicks,
    CASE
        WHEN COALESCE(SUM(cs.impressions), 0) > 0
        THEN ROUND((COALESCE(SUM(cs.clicks), 0)::NUMERIC / SUM(cs.impressions)) * 100, 2)
        ELSE 0
    END as avg_ctr,

    -- Lead Metrics
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.lead_status = 'qualified' THEN l.id END) as qualified_leads,
    COUNT(DISTINCT CASE WHEN l.meeting_completed_date IS NOT NULL THEN l.id END) as meetings_completed,
    COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END) as customers_won,

    -- Revenue Metrics
    COALESCE(SUM(l.closed_revenue), 0) as total_revenue,

    -- ROI Calculations
    CASE
        WHEN COUNT(DISTINCT l.id) > 0 AND COALESCE(SUM(cs.amount_spent), 0) > 0
        THEN ROUND(COALESCE(SUM(cs.amount_spent), 0) / COUNT(DISTINCT l.id), 2)
        ELSE 0
    END as cost_per_lead,

    CASE
        WHEN COUNT(DISTINCT CASE WHEN l.meeting_completed_date IS NOT NULL THEN l.id END) > 0 AND COALESCE(SUM(cs.amount_spent), 0) > 0
        THEN ROUND(COALESCE(SUM(cs.amount_spent), 0) / COUNT(DISTINCT CASE WHEN l.meeting_completed_date IS NOT NULL THEN l.id END), 2)
        ELSE 0
    END as cost_per_meeting,

    CASE
        WHEN COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END) > 0 AND COALESCE(SUM(cs.amount_spent), 0) > 0
        THEN ROUND(COALESCE(SUM(cs.amount_spent), 0) / COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END), 2)
        ELSE 0
    END as cost_per_customer,

    CASE
        WHEN COALESCE(SUM(cs.amount_spent), 0) > 0
        THEN ROUND(((COALESCE(SUM(l.closed_revenue), 0) - COALESCE(SUM(cs.amount_spent), 0)) / COALESCE(SUM(cs.amount_spent), 0)) * 100, 2)
        ELSE 0
    END as roi_percentage

FROM Campaigns c
LEFT JOIN Lead_Sources ls ON c.lead_source_id = ls.id
LEFT JOIN Campaign_Spend cs ON c.id = cs.campaign_id
LEFT JOIN Leads l ON c.id = l.first_touch_campaign_id
GROUP BY c.id, c.campaign_name, c.campaign_code, ls.source_name, ls.source_type, c.status, c.start_date, c.end_date
ORDER BY total_revenue DESC, total_leads DESC;

-- Lead Source Performance Summary
CREATE OR REPLACE VIEW Lead_Source_Performance AS
SELECT
    ls.id as source_id,
    ls.source_name,
    ls.source_type,

    -- Lead Metrics
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.lead_status = 'qualified' THEN l.id END) as qualified_leads,
    COUNT(DISTINCT CASE WHEN l.meeting_completed_date IS NOT NULL THEN l.id END) as meetings_completed,
    COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END) as customers_won,

    -- Conversion Rates
    CASE
        WHEN COUNT(DISTINCT l.id) > 0
        THEN ROUND((COUNT(DISTINCT CASE WHEN l.lead_status = 'qualified' THEN l.id END)::NUMERIC / COUNT(DISTINCT l.id)) * 100, 2)
        ELSE 0
    END as lead_to_qualified_rate,

    CASE
        WHEN COUNT(DISTINCT l.id) > 0
        THEN ROUND((COUNT(DISTINCT CASE WHEN l.meeting_completed_date IS NOT NULL THEN l.id END)::NUMERIC / COUNT(DISTINCT l.id)) * 100, 2)
        ELSE 0
    END as lead_to_meeting_rate,

    CASE
        WHEN COUNT(DISTINCT l.id) > 0
        THEN ROUND((COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END)::NUMERIC / COUNT(DISTINCT l.id)) * 100, 2)
        ELSE 0
    END as lead_to_customer_rate,

    -- Revenue Metrics
    COALESCE(SUM(l.closed_revenue), 0) as total_revenue,
    CASE
        WHEN COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END) > 0
        THEN ROUND(COALESCE(SUM(l.closed_revenue), 0) / COUNT(DISTINCT CASE WHEN l.closed_won_date IS NOT NULL THEN l.id END), 2)
        ELSE 0
    END as avg_customer_value

FROM Lead_Sources ls
LEFT JOIN Leads l ON ls.id = l.first_touch_source_id
GROUP BY ls.id, ls.source_name, ls.source_type
ORDER BY total_revenue DESC, total_leads DESC;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE Lead_Sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE Campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE Campaign_Spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE Leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE Lead_Touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE Lead_to_Sale_Journey ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to lead_sources"
    ON Lead_Sources FOR ALL
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid())
        IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca')
    );

CREATE POLICY "Admins full access to campaigns"
    ON Campaigns FOR ALL
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid())
        IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca')
    );

CREATE POLICY "Admins full access to campaign_spend"
    ON Campaign_Spend FOR ALL
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid())
        IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca')
    );

CREATE POLICY "Admins full access to leads"
    ON Leads FOR ALL
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid())
        IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca')
    );

CREATE POLICY "Admins full access to touchpoints"
    ON Lead_Touchpoints FOR ALL
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid())
        IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca')
    );

CREATE POLICY "Admins full access to journey"
    ON Lead_to_Sale_Journey FOR ALL
    USING (
        (SELECT email FROM auth.users WHERE id = auth.uid())
        IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.ca')
    );

-- Users can view their assigned leads
CREATE POLICY "Users view assigned leads"
    ON Leads FOR SELECT
    USING (assigned_to = auth.uid());

CREATE POLICY "Users view touchpoints for assigned leads"
    ON Lead_Touchpoints FOR SELECT
    USING (
        lead_id IN (SELECT id FROM Leads WHERE assigned_to = auth.uid())
    );

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Lead Attribution & Campaign Tracking Schema Created!';
    RAISE NOTICE '   📊 Tables Created:';
    RAISE NOTICE '      • Lead_Sources (19 default sources seeded)';
    RAISE NOTICE '      • Campaigns (marketing campaign tracking)';
    RAISE NOTICE '      • Campaign_Spend (daily ad spend tracking)';
    RAISE NOTICE '      • Leads (with first/last touch attribution)';
    RAISE NOTICE '      • Lead_Touchpoints (multi-touch attribution)';
    RAISE NOTICE '      • Lead_to_Sale_Journey (pipeline stage tracking)';
    RAISE NOTICE '';
    RAISE NOTICE '   📈 Views Created:';
    RAISE NOTICE '      • Campaign_Performance (ROI by campaign)';
    RAISE NOTICE '      • Lead_Source_Performance (conversion rates by source)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ready to track leads from Google Ads, Facebook, and more!';
END $$;
