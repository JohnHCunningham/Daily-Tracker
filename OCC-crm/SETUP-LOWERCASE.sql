DROP TABLE IF EXISTS "CRM_Lead_Activities" CASCADE;
DROP TABLE IF EXISTS "CRM_Lead_Meetings" CASCADE;
DROP TABLE IF EXISTS "CRM_Pipeline_Stages" CASCADE;
DROP TABLE IF EXISTS "CRM_Leads" CASCADE;

CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    title TEXT,
    company TEXT,
    linkedin_url TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    pipeline_stage_order INTEGER NOT NULL DEFAULT 0,
    classification TEXT DEFAULT 'V-B' CHECK (classification IN ('V-A', 'V-B')),
    profile_signal TEXT CHECK (profile_signal IN ('ONE_STAR', 'VIEWED', NULL)),
    category TEXT,
    next_step TEXT,
    ebbinghaus_status TEXT DEFAULT 'pending',
    ebbinghaus_date DATE,
    free_analysis_status TEXT DEFAULT 'pending',
    free_analysis_date DATE,
    mirror_status TEXT DEFAULT 'pending',
    mirror_date DATE,
    breakup_status TEXT DEFAULT 'pending',
    breakup_date DATE,
    dm_variant TEXT,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_account ON crm_leads(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(account_id, status);

CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
    stage_key TEXT NOT NULL,
    stage_label TEXT NOT NULL,
    stage_order INTEGER NOT NULL,
    color TEXT DEFAULT '#D4633E',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, stage_key)
);

CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stages_account ON crm_pipeline_stages(account_id, stage_order);

CREATE TABLE IF NOT EXISTS public.crm_lead_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_lead_activities(lead_id, created_at DESC);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can insert their crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can update their crm_leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can delete their crm_leads" ON crm_leads;

CREATE POLICY "Users can view their crm_leads" ON crm_leads
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Users can insert their crm_leads" ON crm_leads
    FOR INSERT
    WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Users can update their crm_leads" ON crm_leads
    FOR UPDATE
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Users can delete their crm_leads" ON crm_leads
    FOR DELETE
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

DROP POLICY IF EXISTS "Users can view their pipeline_stages" ON crm_pipeline_stages;
DROP POLICY IF EXISTS "Users can manage their pipeline_stages" ON crm_pipeline_stages;

CREATE POLICY "Users can view their pipeline_stages" ON crm_pipeline_stages
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Users can manage their pipeline_stages" ON crm_pipeline_stages
    FOR ALL
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

DROP POLICY IF EXISTS "Users can view their activities" ON crm_lead_activities;
DROP POLICY IF EXISTS "Users can manage their activities" ON crm_lead_activities;

CREATE POLICY "Users can view their activities" ON crm_lead_activities
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Users can manage their activities" ON crm_lead_activities
    FOR ALL
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

-- RPC function to update lead stage (for drag-and-drop)
CREATE OR REPLACE FUNCTION update_crm_lead_stage(
    p_lead_id UUID,
    p_status TEXT,
    p_pipeline_stage_order INT,
    p_update_contact_time BOOLEAN DEFAULT FALSE
)
RETURNS SETOF crm_leads
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE crm_leads
    SET
        status = p_status,
        pipeline_stage_order = p_pipeline_stage_order,
        last_contact_at = CASE WHEN p_update_contact_time THEN NOW() ELSE last_contact_at END,
        updated_at = NOW()
    WHERE id = p_lead_id
      AND account_id = get_my_account_id()
      AND is_account_admin_or_manager()
    RETURNING *;
END;
$$;

-- RPC function to insert or update lead (for import)
CREATE OR REPLACE FUNCTION upsert_crm_lead(
    p_account_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_title TEXT,
    p_company TEXT,
    p_linkedin_url TEXT,
    p_email TEXT,
    p_status TEXT,
    p_classification TEXT,
    p_category TEXT
)
RETURNS SETOF crm_leads
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO crm_leads (
        account_id,
        first_name,
        last_name,
        title,
        company,
        linkedin_url,
        email,
        status,
        classification,
        category,
        pipeline_stage_order
    ) VALUES (
        p_account_id,
        p_first_name,
        p_last_name,
        p_title,
        p_company,
        p_linkedin_url,
        p_email,
        COALESCE(p_status, 'pending'),
        COALESCE(p_classification, 'V-B'),
        p_category,
        0
    )
    ON CONFLICT (account_id, first_name, last_name, COALESCE(company, ''))
    DO UPDATE SET
        title = EXCLUDED.title,
        linkedin_url = EXCLUDED.linkedin_url,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        classification = EXCLUDED.classification,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING *;
END;
$$;

NOTIFY pgrst, 'reload schema';
