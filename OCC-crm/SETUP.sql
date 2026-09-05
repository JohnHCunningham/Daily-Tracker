CREATE TABLE IF NOT EXISTS "Accounts" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    subscription_status TEXT DEFAULT 'trialing',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    billing_grace_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Users" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES "Accounts"(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'rep',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(auth_id)
);

CREATE OR REPLACE FUNCTION get_my_account_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account_id UUID;
BEGIN
    SELECT account_id INTO v_account_id
    FROM "Users"
    WHERE auth_id = auth.uid();
    RETURN v_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION is_account_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM "Users"
    WHERE auth_id = auth.uid();
    RETURN v_role IN ('admin', 'manager', 'coach');
END;
$$;

CREATE TABLE IF NOT EXISTS "CRM_Leads" (
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

CREATE INDEX IF NOT EXISTS idx_crm_leads_account ON "CRM_Leads"(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON "CRM_Leads"(account_id, status);

CREATE TABLE IF NOT EXISTS "CRM_Pipeline_Stages" (
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

CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stages_account ON "CRM_Pipeline_Stages"(account_id, stage_order);

CREATE TABLE IF NOT EXISTS "CRM_Lead_Activities" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES "CRM_Leads"(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON "CRM_Lead_Activities"(lead_id, created_at DESC);

ALTER TABLE "CRM_Leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CRM_Pipeline_Stages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CRM_Lead_Activities" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin/Manager can view CRM leads" ON "CRM_Leads";
DROP POLICY IF EXISTS "Admin/Manager can insert CRM leads" ON "CRM_Leads";
DROP POLICY IF EXISTS "Admin/Manager can update CRM leads" ON "CRM_Leads";
DROP POLICY IF EXISTS "Admin/Manager can delete CRM leads" ON "CRM_Leads";

CREATE POLICY "Admin/Manager can view CRM leads" ON "CRM_Leads"
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can insert CRM leads" ON "CRM_Leads"
    FOR INSERT
    WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can update CRM leads" ON "CRM_Leads"
    FOR UPDATE
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can delete CRM leads" ON "CRM_Leads"
    FOR DELETE
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

DROP POLICY IF EXISTS "Admin/Manager can view pipeline stages" ON "CRM_Pipeline_Stages";
DROP POLICY IF EXISTS "Admin/Manager can manage pipeline stages" ON "CRM_Pipeline_Stages";

CREATE POLICY "Admin/Manager can view pipeline stages" ON "CRM_Pipeline_Stages"
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can manage pipeline stages" ON "CRM_Pipeline_Stages"
    FOR ALL
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

DROP POLICY IF EXISTS "Admin/Manager can view lead activities" ON "CRM_Lead_Activities";
DROP POLICY IF EXISTS "Admin/Manager can manage lead activities" ON "CRM_Lead_Activities";

CREATE POLICY "Admin/Manager can view lead activities" ON "CRM_Lead_Activities"
    FOR SELECT
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Admin/Manager can manage lead activities" ON "CRM_Lead_Activities"
    FOR ALL
    USING (account_id = get_my_account_id() AND is_account_admin_or_manager());
