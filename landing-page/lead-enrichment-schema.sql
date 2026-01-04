-- ============================================
-- LEAD ENRICHMENT SCHEMA
-- ============================================
-- Extends lead-attribution-schema.sql with enrichment capabilities
-- Includes: LinkedIn profiles, website scraping, competitor analysis, quality scores
-- Deploy AFTER lead-attribution-schema.sql

-- ============================================
-- 1. EXTEND LEADS TABLE WITH ENRICHMENT STATUS
-- ============================================

ALTER TABLE Leads
ADD COLUMN IF NOT EXISTS enrichment_status VARCHAR(50) DEFAULT 'pending' CHECK (enrichment_status IN (
    'pending',           -- Not yet enriched
    'in_progress',       -- Enrichment workflow running
    'completed',         -- Enrichment successful
    'failed',            -- Enrichment failed
    'partial'            -- Some enrichment succeeded, some failed
)),
ADD COLUMN IF NOT EXISTS enrichment_last_attempted TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS enrichment_completed_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
ADD COLUMN IF NOT EXISTS lead_grade VARCHAR(2) CHECK (lead_grade IN ('A+', 'A', 'B', 'C', 'D', 'F')),
ADD COLUMN IF NOT EXISTS is_high_value BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. LEAD ENRICHMENT DATA TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS Lead_Enrichment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES Leads(id) ON DELETE CASCADE,

    -- LinkedIn Profile Data
    linkedin_url TEXT,
    linkedin_profile_found BOOLEAN DEFAULT FALSE,
    linkedin_name VARCHAR(255),
    linkedin_headline TEXT,
    linkedin_current_company VARCHAR(255),
    linkedin_current_title VARCHAR(255),
    linkedin_location VARCHAR(255),
    linkedin_connections INTEGER,
    linkedin_industry VARCHAR(255),
    linkedin_profile_summary TEXT,
    linkedin_experience_years INTEGER,
    linkedin_education TEXT,
    linkedin_skills TEXT[], -- Array of skills
    linkedin_endorsements INTEGER,
    linkedin_recommendations INTEGER,

    -- Company LinkedIn Data
    company_linkedin_url TEXT,
    company_linkedin_found BOOLEAN DEFAULT FALSE,
    company_size VARCHAR(50), -- "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
    company_industry VARCHAR(255),
    company_headquarters VARCHAR(255),
    company_founded_year INTEGER,
    company_employee_count INTEGER,
    company_followers INTEGER,

    -- Website Scraping Data
    website_url TEXT,
    website_found BOOLEAN DEFAULT FALSE,
    website_title VARCHAR(500),
    website_description TEXT,
    website_tech_stack TEXT[], -- Array of technologies detected
    website_has_blog BOOLEAN DEFAULT FALSE,
    website_has_pricing BOOLEAN DEFAULT FALSE,
    website_has_careers BOOLEAN DEFAULT FALSE,
    website_primary_language VARCHAR(50),
    website_content_analysis TEXT, -- AI summary of website content
    website_value_proposition TEXT, -- Extracted value prop

    -- SEO & Digital Presence
    domain_authority INTEGER, -- Moz/Ahrefs domain authority score
    monthly_traffic_estimate INTEGER,
    organic_keywords_estimate INTEGER,
    social_media_presence JSONB, -- {twitter: "url", facebook: "url", etc}

    -- Competitor Analysis
    competitors_identified TEXT[], -- Array of competitor names
    competitor_comparison TEXT, -- AI-generated comparison
    market_position VARCHAR(50), -- "leader", "challenger", "niche_player", "startup"
    differentiation_notes TEXT,

    -- Quality Scoring Components
    firmographic_score INTEGER CHECK (firmographic_score >= 0 AND firmographic_score <= 100),
    engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
    intent_score INTEGER CHECK (intent_score >= 0 AND intent_score <= 100),
    fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),

    -- Enrichment Metadata
    enrichment_source VARCHAR(100), -- "apify", "clearbit", "hunter.io", "manual"
    enrichment_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    enrichment_cost NUMERIC(6, 2), -- Cost to enrich this lead

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(lead_id)
);

-- ============================================
-- 3. QUALITY SCORING RULES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS Lead_Quality_Rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    rule_name VARCHAR(255) NOT NULL,
    rule_category VARCHAR(50) CHECK (rule_category IN (
        'firmographic',  -- Company size, industry, revenue
        'engagement',    -- Website visits, email opens, content downloads
        'intent',        -- Search keywords, pages visited, form fills
        'fit'            -- Match to ICP (Ideal Customer Profile)
    )),

    -- Rule Logic
    condition_field VARCHAR(255), -- e.g., "company_size", "linkedin_connections"
    condition_operator VARCHAR(20), -- "equals", "greater_than", "less_than", "contains", "in_array"
    condition_value TEXT,

    -- Scoring
    points_awarded INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. LEAD ENRICHMENT LOG (AUDIT TRAIL)
-- ============================================

CREATE TABLE IF NOT EXISTS Lead_Enrichment_Log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES Leads(id) ON DELETE CASCADE,

    enrichment_type VARCHAR(100), -- "linkedin_profile", "company_data", "website_scrape", "competitor_analysis"
    status VARCHAR(50) CHECK (status IN ('started', 'completed', 'failed', 'skipped')),

    data_source VARCHAR(100), -- "apify_linkedin", "apify_website", "openai_gpt4", "manual"

    -- Results
    data_found BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    response_payload JSONB, -- Raw response from enrichment API

    -- Performance
    execution_time_ms INTEGER,
    api_cost NUMERIC(6, 3),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrichment_log_lead ON Lead_Enrichment_Log(lead_id);
CREATE INDEX idx_enrichment_log_type ON Lead_Enrichment_Log(enrichment_type);
CREATE INDEX idx_enrichment_log_date ON Lead_Enrichment_Log(created_at);

-- ============================================
-- 5. SEED DEFAULT QUALITY SCORING RULES
-- ============================================

-- Firmographic Rules (Company attributes)
INSERT INTO Lead_Quality_Rules (rule_name, rule_category, condition_field, condition_operator, condition_value, points_awarded, description)
VALUES
('Enterprise Company Size (1000+ employees)', 'firmographic', 'company_size', 'equals', '1000+', 25, 'Large enterprise with substantial budget'),
('Mid-Market Company (201-1000 employees)', 'firmographic', 'company_size', 'in_array', '["201-500", "501-1000"]', 15, 'Mid-market company with growth potential'),
('Target Industry Match', 'firmographic', 'company_industry', 'in_array', '["Technology", "Software", "SaaS", "Financial Services", "Healthcare"]', 20, 'Company in target industry'),
('Senior Decision Maker', 'firmographic', 'linkedin_current_title', 'contains', '["VP", "Director", "Head of", "Chief", "President", "Owner", "Founder"]', 20, 'Senior-level contact with decision authority'),
('High LinkedIn Connections (500+)', 'firmographic', 'linkedin_connections', 'greater_than', '500', 10, 'Well-connected professional');

-- Engagement Rules (Behavior signals)
INSERT INTO Lead_Quality_Rules (rule_name, rule_category, condition_field, condition_operator, condition_value, points_awarded, description)
VALUES
('Direct Website Visit (not bounce)', 'engagement', 'website_found', 'equals', 'true', 15, 'Actively researching our solution'),
('Has Active Social Presence', 'engagement', 'social_media_presence', 'not_null', '', 10, 'Active on social media'),
('Company Has Careers Page', 'engagement', 'website_has_careers', 'equals', 'true', 5, 'Growing company hiring talent');

-- Intent Rules (Buying signals)
INSERT INTO Lead_Quality_Rules (rule_name, rule_category, condition_field, condition_operator, condition_value, points_awarded, description)
VALUES
('Visited Pricing Page', 'intent', 'first_touch_landing_page', 'contains', 'pricing', 25, 'Strong buying intent'),
('Came from Paid Search (Google Ads)', 'intent', 'first_touch_utm_medium', 'equals', 'cpc', 20, 'Active searcher with commercial intent'),
('Downloaded Content/Whitepaper', 'intent', 'first_touch_utm_content', 'contains', 'download', 15, 'Engaged with educational content');

-- Fit Rules (Match to ICP)
INSERT INTO Lead_Quality_Rules (rule_name, rule_category, condition_field, condition_operator, condition_value, points_awarded, description)
VALUES
('High Domain Authority (50+)', 'fit', 'domain_authority', 'greater_than', '50', 10, 'Established online presence'),
('Market Leader Position', 'fit', 'market_position', 'equals', 'leader', 15, 'Industry leader likely has budget'),
('Website Has Pricing (Product-Led)', 'fit', 'website_has_pricing', 'equals', 'true', 10, 'Transparent pricing indicates product-market fit');

-- ============================================
-- 6. FUNCTION: CALCULATE LEAD QUALITY SCORE
-- ============================================

CREATE OR REPLACE FUNCTION calculate_lead_quality_score(target_lead_id UUID)
RETURNS TABLE (
    total_score INTEGER,
    grade VARCHAR(2),
    firmographic_score INTEGER,
    engagement_score INTEGER,
    intent_score INTEGER,
    fit_score INTEGER,
    scoring_breakdown JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_lead RECORD;
    v_enrichment RECORD;
    v_firmographic INTEGER := 0;
    v_engagement INTEGER := 0;
    v_intent INTEGER := 0;
    v_fit INTEGER := 0;
    v_total INTEGER := 0;
    v_grade VARCHAR(2);
    v_breakdown JSONB := '[]'::JSONB;
BEGIN
    -- Get lead data
    SELECT * INTO v_lead FROM Leads WHERE id = target_lead_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found: %', target_lead_id;
    END IF;

    -- Get enrichment data
    SELECT * INTO v_enrichment FROM Lead_Enrichment WHERE lead_id = target_lead_id;

    -- Calculate Firmographic Score (max 100 points)
    IF v_enrichment.company_size = '1000+' THEN
        v_firmographic := v_firmographic + 25;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Enterprise Company', 'points', 25);
    ELSIF v_enrichment.company_size IN ('201-500', '501-1000') THEN
        v_firmographic := v_firmographic + 15;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Mid-Market Company', 'points', 15);
    END IF;

    IF v_enrichment.company_industry IN ('Technology', 'Software', 'SaaS', 'Financial Services', 'Healthcare') THEN
        v_firmographic := v_firmographic + 20;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Target Industry', 'points', 20);
    END IF;

    IF v_enrichment.linkedin_current_title ~* '(VP|Director|Head of|Chief|President|Owner|Founder)' THEN
        v_firmographic := v_firmographic + 20;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Senior Decision Maker', 'points', 20);
    END IF;

    IF v_enrichment.linkedin_connections > 500 THEN
        v_firmographic := v_firmographic + 10;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'High LinkedIn Connections', 'points', 10);
    END IF;

    -- Calculate Engagement Score (max 100 points)
    IF v_enrichment.website_found THEN
        v_engagement := v_engagement + 15;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Website Visit', 'points', 15);
    END IF;

    IF v_enrichment.social_media_presence IS NOT NULL THEN
        v_engagement := v_engagement + 10;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Social Presence', 'points', 10);
    END IF;

    IF v_enrichment.website_has_careers THEN
        v_engagement := v_engagement + 5;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Growing Company', 'points', 5);
    END IF;

    -- Calculate Intent Score (max 100 points)
    IF v_lead.first_touch_landing_page ~* 'pricing' THEN
        v_intent := v_intent + 25;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Visited Pricing', 'points', 25);
    END IF;

    IF v_lead.first_touch_utm_medium = 'cpc' THEN
        v_intent := v_intent + 20;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Paid Search', 'points', 20);
    END IF;

    IF v_lead.first_touch_utm_content ~* 'download' THEN
        v_intent := v_intent + 15;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Content Download', 'points', 15);
    END IF;

    -- Calculate Fit Score (max 100 points)
    IF v_enrichment.domain_authority > 50 THEN
        v_fit := v_fit + 10;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'High Domain Authority', 'points', 10);
    END IF;

    IF v_enrichment.market_position = 'leader' THEN
        v_fit := v_fit + 15;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Market Leader', 'points', 15);
    END IF;

    IF v_enrichment.website_has_pricing THEN
        v_fit := v_fit + 10;
        v_breakdown := v_breakdown || jsonb_build_object('rule', 'Product-Led Growth', 'points', 10);
    END IF;

    -- Calculate total score (average of 4 categories)
    v_total := ROUND((v_firmographic + v_engagement + v_intent + v_fit) / 4.0);

    -- Assign grade
    IF v_total >= 90 THEN
        v_grade := 'A+';
    ELSIF v_total >= 80 THEN
        v_grade := 'A';
    ELSIF v_total >= 70 THEN
        v_grade := 'B';
    ELSIF v_total >= 60 THEN
        v_grade := 'C';
    ELSIF v_total >= 50 THEN
        v_grade := 'D';
    ELSE
        v_grade := 'F';
    END IF;

    -- Update Leads table
    UPDATE Leads
    SET
        quality_score = v_total,
        lead_grade = v_grade,
        is_high_value = (v_total >= 80)
    WHERE id = target_lead_id;

    -- Update Lead_Enrichment table
    UPDATE Lead_Enrichment
    SET
        firmographic_score = v_firmographic,
        engagement_score = v_engagement,
        intent_score = v_intent,
        fit_score = v_fit
    WHERE lead_id = target_lead_id;

    -- Return results
    RETURN QUERY
    SELECT
        v_total,
        v_grade,
        v_firmographic,
        v_engagement,
        v_intent,
        v_fit,
        v_breakdown;
END;
$$;

-- ============================================
-- 7. FUNCTION: GET ENRICHED LEADS (SECURITY DEFINER FOR ADMIN)
-- ============================================

CREATE OR REPLACE FUNCTION get_enriched_leads(
    min_quality_score INTEGER DEFAULT 0,
    only_high_value BOOLEAN DEFAULT FALSE,
    limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
    lead_id UUID,
    email VARCHAR,
    full_name TEXT,
    company VARCHAR,
    quality_score INTEGER,
    lead_grade VARCHAR,
    is_high_value BOOLEAN,

    -- LinkedIn
    linkedin_title VARCHAR,
    linkedin_company VARCHAR,
    linkedin_connections INTEGER,

    -- Company
    company_size VARCHAR,
    company_industry VARCHAR,

    -- Website
    website_url TEXT,
    tech_stack TEXT[],

    -- Competitors
    competitors TEXT[],
    market_position VARCHAR,

    -- Attribution
    first_touch_source VARCHAR,
    first_touch_campaign VARCHAR,
    lead_status VARCHAR,

    enrichment_status VARCHAR,
    created_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.email,
        COALESCE(l.first_name || ' ' || l.last_name, l.email) as full_name,
        l.company,
        l.quality_score,
        l.lead_grade,
        l.is_high_value,

        le.linkedin_current_title,
        le.linkedin_current_company,
        le.linkedin_connections,

        le.company_size,
        le.company_industry,

        le.website_url,
        le.website_tech_stack,

        le.competitors_identified,
        le.market_position,

        ls.source_name,
        c.campaign_name,
        l.lead_status,

        l.enrichment_status,
        l.created_at
    FROM Leads l
    LEFT JOIN Lead_Enrichment le ON l.id = le.lead_id
    LEFT JOIN Lead_Sources ls ON l.first_touch_source_id = ls.id
    LEFT JOIN Campaigns c ON l.first_touch_campaign_id = c.id
    WHERE
        (min_quality_score = 0 OR l.quality_score >= min_quality_score)
        AND (only_high_value = FALSE OR l.is_high_value = TRUE)
    ORDER BY l.quality_score DESC, l.created_at DESC
    LIMIT limit_count;
END;
$$;

-- ============================================
-- 8. VIEW: ENRICHMENT PERFORMANCE METRICS
-- ============================================

CREATE OR REPLACE VIEW Enrichment_Performance AS
SELECT
    DATE(created_at) as enrichment_date,
    enrichment_type,
    data_source,

    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE status = 'completed') as successful,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    COUNT(*) FILTER (WHERE data_found = TRUE) as data_found_count,

    ROUND(AVG(execution_time_ms), 0) as avg_execution_time_ms,
    SUM(api_cost) as total_api_cost,

    ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)) * 100,
        2
    ) as success_rate_percentage

FROM Lead_Enrichment_Log
GROUP BY DATE(created_at), enrichment_type, data_source
ORDER BY enrichment_date DESC;

-- ============================================
-- 9. VIEW: HIGH-VALUE LEADS DASHBOARD
-- ============================================

CREATE OR REPLACE VIEW High_Value_Leads_Dashboard AS
SELECT
    l.id,
    l.email,
    COALESCE(l.first_name || ' ' || l.last_name, l.email) as full_name,
    l.company,
    l.quality_score,
    l.lead_grade,

    -- Enrichment Data
    le.linkedin_current_title,
    le.linkedin_current_company,
    le.company_size,
    le.company_industry,
    le.company_employee_count,

    -- Competitor Context
    le.competitors_identified,
    le.market_position,
    le.differentiation_notes,

    -- Attribution
    ls.source_name as first_touch_source,
    c.campaign_name as first_touch_campaign,
    l.first_touch_utm_medium,

    -- Score Breakdown
    le.firmographic_score,
    le.engagement_score,
    le.intent_score,
    le.fit_score,

    -- Status
    l.lead_status,
    l.opportunity_value,
    l.created_at,

    -- Time to Contact
    CASE
        WHEN l.first_contact_date IS NOT NULL
        THEN EXTRACT(EPOCH FROM (l.first_contact_date - l.created_at)) / 60
        ELSE NULL
    END as minutes_to_first_contact

FROM Leads l
INNER JOIN Lead_Enrichment le ON l.id = le.lead_id
LEFT JOIN Lead_Sources ls ON l.first_touch_source_id = ls.id
LEFT JOIN Campaigns c ON l.first_touch_campaign_id = c.id
WHERE l.is_high_value = TRUE
ORDER BY l.quality_score DESC, l.created_at DESC;

-- ============================================
-- 10. TRIGGER: AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_enrichment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_enrichment_timestamp
BEFORE UPDATE ON Lead_Enrichment
FOR EACH ROW
EXECUTE FUNCTION update_enrichment_timestamp();

CREATE TRIGGER update_quality_rules_timestamp
BEFORE UPDATE ON Lead_Quality_Rules
FOR EACH ROW
EXECUTE FUNCTION update_enrichment_timestamp();

-- ============================================
-- 11. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE Lead_Enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE Lead_Quality_Rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE Lead_Enrichment_Log ENABLE ROW LEVEL SECURITY;

-- Admin can see all enrichment data
CREATE POLICY admin_all_access_enrichment ON Lead_Enrichment
FOR ALL
TO authenticated
USING (
    auth.jwt() ->> 'email' IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.com')
);

-- Admin can see all quality rules
CREATE POLICY admin_all_access_quality_rules ON Lead_Quality_Rules
FOR ALL
TO authenticated
USING (
    auth.jwt() ->> 'email' IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.com')
);

-- Admin can see all enrichment logs
CREATE POLICY admin_all_access_enrichment_log ON Lead_Enrichment_Log
FOR ALL
TO authenticated
USING (
    auth.jwt() ->> 'email' IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.com')
);

-- ============================================
-- 12. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_lead_enrichment_lead_id ON Lead_Enrichment(lead_id);
CREATE INDEX idx_lead_enrichment_company ON Lead_Enrichment(linkedin_current_company);
CREATE INDEX idx_lead_enrichment_title ON Lead_Enrichment(linkedin_current_title);
CREATE INDEX idx_lead_quality_score ON Leads(quality_score DESC);
CREATE INDEX idx_lead_grade ON Leads(lead_grade);
CREATE INDEX idx_lead_high_value ON Leads(is_high_value) WHERE is_high_value = TRUE;
CREATE INDEX idx_lead_enrichment_status ON Leads(enrichment_status);

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================

-- To test the quality scoring:
-- SELECT * FROM calculate_lead_quality_score('your-lead-uuid-here');

-- To view high-value leads:
-- SELECT * FROM High_Value_Leads_Dashboard;

-- To check enrichment performance:
-- SELECT * FROM Enrichment_Performance;
