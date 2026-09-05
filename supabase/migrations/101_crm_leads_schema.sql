-- Migration 101: CRM Leads Schema for LinkedIn Outreach
-- Replaces Google Sheets-based CRM with proper database tables

-- =============================================================================
-- CRM_Leads: Primary lead storage (replaces Google Sheet "All Contacts" tab)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "CRM_Leads" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,

    -- Contact info (maps to Google Sheet columns B-E)
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    title TEXT,
    company TEXT,
    linkedin_url TEXT,
    email TEXT,

    -- Pipeline state (maps to columns F, L)
    -- Values: pending, request_sent, observability, free_analysis, mirror, breakup, call, won, lost
    status TEXT NOT NULL DEFAULT 'pending',
    pipeline_stage_order INTEGER NOT NULL DEFAULT 0,

    -- Classification (maps to columns G, H, I, J)
    classification TEXT DEFAULT 'V-B' CHECK (classification IN ('V-A', 'V-B')),
    profile_signal TEXT CHECK (profile_signal IN ('ONE_STAR', 'VIEWED', NULL)),
    source_tab TEXT,
    category TEXT CHECK (category IN ('VP', 'Enablement', 'Manager', 'Sandler Franchisee', 'Sandler User', 'Sales Trainers', 'Other', NULL)),

    -- Outreach cadence tracking (maps to columns M-T)
    next_step TEXT,

    -- Ebbinghaus (Observability) stage
    ebbinghaus_status TEXT DEFAULT 'pending' CHECK (ebbinghaus_status IN ('pending', 'sent', 'skip')),
    ebbinghaus_date DATE,

    -- Free Analysis stage
    free_analysis_status TEXT DEFAULT 'pending' CHECK (free_analysis_status IN ('pending', 'sent', 'skip')),
    free_analysis_date DATE,

    -- Mirror stage
    mirror_status TEXT DEFAULT 'pending' CHECK (mirror_status IN ('pending', 'sent', 'skip')),
    mirror_date DATE,

    -- Breakup stage
    breakup_status TEXT DEFAULT 'pending' CHECK (breakup_status IN ('pending', 'sent', 'skip')),
    breakup_date DATE,

    -- DM tracking (maps to columns U, V)
    dm_variant TEXT,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    last_contact_type TEXT,  -- email, linkedin_message, call, meeting

    -- Notes and metadata (maps to column K)
    notes TEXT,
    tags TEXT[],

    -- Ownership
    owner_user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),

    -- Import tracking
    legacy_sheet_id INTEGER,  -- Original ID from Google Sheet column A
    imported_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_account ON "CRM_Leads"(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON "CRM_Leads"(account_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_pipeline_order ON "CRM_Leads"(account_id, pipeline_stage_order, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_classification ON "CRM_Leads"(account_id, classification);
CREATE INDEX IF NOT EXISTS idx_crm_leads_category ON "CRM_Leads"(account_id, category);
CREATE INDEX IF NOT EXISTS idx_crm_leads_last_contact ON "CRM_Leads"(account_id, last_contact_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_ebbinghaus ON "CRM_Leads"(account_id, ebbinghaus_status, ebbinghaus_date);
CREATE INDEX IF NOT EXISTS idx_crm_leads_profile_signal ON "CRM_Leads"(account_id, profile_signal) WHERE profile_signal IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_legacy_id ON "CRM_Leads"(account_id, legacy_sheet_id) WHERE legacy_sheet_id IS NOT NULL;

-- Unique constraint for deduplication (same person at same company)
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_leads_unique_person
    ON "CRM_Leads"(account_id, LOWER(first_name), LOWER(last_name), LOWER(COALESCE(company, '')));

-- =============================================================================
-- CRM_Pipeline_Stages: Configurable pipeline stages with colors
-- =============================================================================
CREATE TABLE IF NOT EXISTS "CRM_Pipeline_Stages" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
    stage_key TEXT NOT NULL,
    stage_label TEXT NOT NULL,
    stage_order INTEGER NOT NULL,
    color TEXT DEFAULT '#D4633E',  -- terracotta default
    is_active BOOLEAN DEFAULT TRUE,
    is_won_stage BOOLEAN DEFAULT FALSE,
    is_lost_stage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, stage_key)
);

CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stages_account ON "CRM_Pipeline_Stages"(account_id, stage_order);

-- =============================================================================
-- CRM_Lead_Activities: Emails, calls, notes linked to leads
-- =============================================================================
CREATE TABLE IF NOT EXISTS "CRM_Lead_Activities" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES "CRM_Leads"(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,

    -- Activity type: email, call, meeting, note, linkedin_message, linkedin_connection
    activity_type TEXT NOT NULL,
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Content
    subject TEXT,
    body TEXT,
    direction TEXT CHECK (direction IN ('inbound', 'outbound', NULL)),

    -- External references for deduplication
    external_id TEXT,
    source_provider TEXT,  -- gmail, google_calendar, fathom, linkedin, manual

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(account_id, source_provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON "CRM_Lead_Activities"(lead_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_account ON "CRM_Lead_Activities"(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON "CRM_Lead_Activities"(account_id, activity_type);

-- =============================================================================
-- CRM_Lead_Meetings: Fathom/Calendar meetings linked to leads
-- =============================================================================
CREATE TABLE IF NOT EXISTS "CRM_Lead_Meetings" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES "CRM_Leads"(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,

    -- Link to existing Synced_Conversations (Fathom data)
    synced_conversation_id UUID REFERENCES "Synced_Conversations"(id) ON DELETE SET NULL,

    -- Calendar event reference
    google_calendar_event_id TEXT,

    -- Meeting details
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_title TEXT,
    duration_minutes INTEGER,
    attendees TEXT[],

    -- Transcript and analysis
    has_transcript BOOLEAN DEFAULT FALSE,
    transcript_summary TEXT,
    ai_analysis JSONB,  -- Fathom/OCC analysis results

    -- Metadata
    source_provider TEXT,  -- fathom, google_calendar, manual
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(lead_id, synced_conversation_id),
    UNIQUE(lead_id, google_calendar_event_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_meetings_lead ON "CRM_Lead_Meetings"(lead_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_meetings_account ON "CRM_Lead_Meetings"(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_meetings_conversation ON "CRM_Lead_Meetings"(synced_conversation_id) WHERE synced_conversation_id IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- CRM_Leads RLS
ALTER TABLE "CRM_Leads" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Manager can view CRM leads" ON "CRM_Leads"
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can insert CRM leads" ON "CRM_Leads"
    FOR INSERT
    WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can update CRM leads" ON "CRM_Leads"
    FOR UPDATE
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager())
    WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can delete CRM leads" ON "CRM_Leads"
    FOR DELETE
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

-- CRM_Pipeline_Stages RLS
ALTER TABLE "CRM_Pipeline_Stages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Manager can view pipeline stages" ON "CRM_Pipeline_Stages"
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can manage pipeline stages" ON "CRM_Pipeline_Stages"
    FOR ALL
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager())
    WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());

-- CRM_Lead_Activities RLS
ALTER TABLE "CRM_Lead_Activities" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Manager can view lead activities" ON "CRM_Lead_Activities"
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can manage lead activities" ON "CRM_Lead_Activities"
    FOR ALL
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager())
    WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());

-- CRM_Lead_Meetings RLS
ALTER TABLE "CRM_Lead_Meetings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Manager can view lead meetings" ON "CRM_Lead_Meetings"
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can manage lead meetings" ON "CRM_Lead_Meetings"
    FOR ALL
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager())
    WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION update_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_leads_updated_at ON "CRM_Leads";
CREATE TRIGGER trg_crm_leads_updated_at
    BEFORE UPDATE ON "CRM_Leads"
    FOR EACH ROW
    EXECUTE FUNCTION update_crm_updated_at();

DROP TRIGGER IF EXISTS trg_crm_pipeline_stages_updated_at ON "CRM_Pipeline_Stages";
CREATE TRIGGER trg_crm_pipeline_stages_updated_at
    BEFORE UPDATE ON "CRM_Pipeline_Stages"
    FOR EACH ROW
    EXECUTE FUNCTION update_crm_updated_at();

DROP TRIGGER IF EXISTS trg_crm_lead_meetings_updated_at ON "CRM_Lead_Meetings";
CREATE TRIGGER trg_crm_lead_meetings_updated_at
    BEFORE UPDATE ON "CRM_Lead_Meetings"
    FOR EACH ROW
    EXECUTE FUNCTION update_crm_updated_at();

-- =============================================================================
-- FUNCTION: Get pipeline stats
-- =============================================================================
CREATE OR REPLACE FUNCTION get_crm_pipeline_stats(p_account_id UUID)
RETURNS TABLE (
    stage_key TEXT,
    total_count BIGINT,
    va_count BIGINT,
    vb_count BIGINT,
    one_star_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.status AS stage_key,
        COUNT(*)::BIGINT AS total_count,
        COUNT(*) FILTER (WHERE l.classification = 'V-A')::BIGINT AS va_count,
        COUNT(*) FILTER (WHERE l.classification = 'V-B')::BIGINT AS vb_count,
        COUNT(*) FILTER (WHERE l.profile_signal = 'ONE_STAR')::BIGINT AS one_star_count
    FROM "CRM_Leads" l
    WHERE l.account_id = p_account_id
    GROUP BY l.status
    ORDER BY MIN(l.pipeline_stage_order);
END;
$$;

-- =============================================================================
-- SEED: Default pipeline stages for new accounts
-- =============================================================================
-- Note: Run this for John's account after migration
-- INSERT INTO "CRM_Pipeline_Stages" (account_id, stage_key, stage_label, stage_order, color)
-- VALUES
--   ('{account_id}', 'pending', 'Pending', 0, '#8F847A'),
--   ('{account_id}', 'request_sent', 'Request Sent', 1, '#C9A687'),
--   ('{account_id}', 'observability', 'Observability', 2, '#D4B89A'),
--   ('{account_id}', 'free_analysis', 'Free Analysis', 3, '#D4633E'),
--   ('{account_id}', 'mirror', 'Mirror', 4, '#E87456'),
--   ('{account_id}', 'breakup', 'Breakup', 5, '#B5583E'),
--   ('{account_id}', 'call', 'Call', 6, '#2A221C');
