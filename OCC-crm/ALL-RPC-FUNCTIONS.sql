-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_crm_leads(UUID);
DROP FUNCTION IF EXISTS public.get_crm_pipeline_stages(UUID);
DROP FUNCTION IF EXISTS public.update_crm_lead_stage(UUID, TEXT, INT, BOOLEAN);
DROP FUNCTION IF EXISTS public.upsert_crm_lead(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Create unique index for upsert
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_unique_person
ON public.crm_leads (account_id, first_name, last_name, COALESCE(company, ''));

-- Function to get pipeline stages
CREATE FUNCTION public.get_crm_pipeline_stages(p_account_id UUID)
RETURNS TABLE (
    stage_key TEXT,
    stage_label TEXT,
    stage_order INT,
    color TEXT,
    account_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.stage_key,
        s.stage_label,
        s.stage_order,
        s.color,
        s.account_id
    FROM public.crm_pipeline_stages s
    WHERE s.account_id = p_account_id
    ORDER BY s.stage_order;
END;
$$;

-- Function to get leads
CREATE FUNCTION public.get_crm_leads(p_account_id UUID)
RETURNS TABLE (
    id UUID,
    account_id UUID,
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    company TEXT,
    linkedin_url TEXT,
    email TEXT,
    status TEXT,
    pipeline_stage_order INT,
    classification TEXT,
    profile_signal TEXT,
    category TEXT,
    next_step TEXT,
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    ebbinghaus_status TEXT,
    ebbinghaus_date TIMESTAMPTZ,
    free_analysis_status TEXT,
    free_analysis_date TIMESTAMPTZ,
    mirror_status TEXT,
    mirror_date TIMESTAMPTZ,
    breakup_status TEXT,
    breakup_date TIMESTAMPTZ,
    dm_variant TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.account_id,
        l.first_name,
        l.last_name,
        l.title,
        l.company,
        l.linkedin_url,
        l.email,
        l.status,
        l.pipeline_stage_order,
        l.classification,
        l.profile_signal,
        l.category,
        l.next_step,
        l.notes,
        l.last_contact_at,
        l.ebbinghaus_status,
        l.ebbinghaus_date,
        l.free_analysis_status,
        l.free_analysis_date,
        l.mirror_status,
        l.mirror_date,
        l.breakup_status,
        l.breakup_date,
        l.dm_variant,
        l.created_at,
        l.updated_at
    FROM public.crm_leads l
    WHERE l.account_id = p_account_id
    ORDER BY
        l.classification ASC,
        CASE WHEN l.profile_signal = 'ONE_STAR' THEN 0 WHEN l.profile_signal = 'VIEWED' THEN 1 ELSE 2 END,
        l.last_contact_at DESC NULLS FIRST;
END;
$$;

-- Function to update lead stage
CREATE FUNCTION public.update_crm_lead_stage(
    p_lead_id UUID,
    p_status TEXT,
    p_pipeline_stage_order INT,
    p_update_contact_time BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    account_id UUID,
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    company TEXT,
    linkedin_url TEXT,
    email TEXT,
    status TEXT,
    pipeline_stage_order INT,
    classification TEXT,
    profile_signal TEXT,
    category TEXT,
    next_step TEXT,
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    ebbinghaus_status TEXT,
    ebbinghaus_date TIMESTAMPTZ,
    free_analysis_status TEXT,
    free_analysis_date TIMESTAMPTZ,
    mirror_status TEXT,
    mirror_date TIMESTAMPTZ,
    breakup_status TEXT,
    breakup_date TIMESTAMPTZ,
    dm_variant TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.crm_leads
    SET
        status = p_status,
        pipeline_stage_order = p_pipeline_stage_order,
        last_contact_at = CASE WHEN p_update_contact_time THEN NOW() ELSE last_contact_at END,
        updated_at = NOW()
    WHERE crm_leads.id = p_lead_id
    RETURNING
        crm_leads.id,
        crm_leads.account_id,
        crm_leads.first_name,
        crm_leads.last_name,
        crm_leads.title,
        crm_leads.company,
        crm_leads.linkedin_url,
        crm_leads.email,
        crm_leads.status,
        crm_leads.pipeline_stage_order,
        crm_leads.classification,
        crm_leads.profile_signal,
        crm_leads.category,
        crm_leads.next_step,
        crm_leads.notes,
        crm_leads.last_contact_at,
        crm_leads.ebbinghaus_status,
        crm_leads.ebbinghaus_date,
        crm_leads.free_analysis_status,
        crm_leads.free_analysis_date,
        crm_leads.mirror_status,
        crm_leads.mirror_date,
        crm_leads.breakup_status,
        crm_leads.breakup_date,
        crm_leads.dm_variant,
        crm_leads.created_at,
        crm_leads.updated_at;
END;
$$;

-- Function to upsert lead
CREATE FUNCTION public.upsert_crm_lead(
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
RETURNS TABLE (
    id UUID,
    account_id UUID,
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    company TEXT,
    linkedin_url TEXT,
    email TEXT,
    status TEXT,
    pipeline_stage_order INT,
    classification TEXT,
    profile_signal TEXT,
    category TEXT,
    next_step TEXT,
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    ebbinghaus_status TEXT,
    ebbinghaus_date TIMESTAMPTZ,
    free_analysis_status TEXT,
    free_analysis_date TIMESTAMPTZ,
    mirror_status TEXT,
    mirror_date TIMESTAMPTZ,
    breakup_status TEXT,
    breakup_date TIMESTAMPTZ,
    dm_variant TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.crm_leads (
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
    ON CONFLICT ON CONSTRAINT crm_leads_unique_person
    DO UPDATE SET
        title = EXCLUDED.title,
        linkedin_url = EXCLUDED.linkedin_url,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        classification = EXCLUDED.classification,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING
        crm_leads.id,
        crm_leads.account_id,
        crm_leads.first_name,
        crm_leads.last_name,
        crm_leads.title,
        crm_leads.company,
        crm_leads.linkedin_url,
        crm_leads.email,
        crm_leads.status,
        crm_leads.pipeline_stage_order,
        crm_leads.classification,
        crm_leads.profile_signal,
        crm_leads.category,
        crm_leads.next_step,
        crm_leads.notes,
        crm_leads.last_contact_at,
        crm_leads.ebbinghaus_status,
        crm_leads.ebbinghaus_date,
        crm_leads.free_analysis_status,
        crm_leads.free_analysis_date,
        crm_leads.mirror_status,
        crm_leads.mirror_date,
        crm_leads.breakup_status,
        crm_leads.breakup_date,
        crm_leads.dm_variant,
        crm_leads.created_at,
        crm_leads.updated_at;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_crm_leads(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_crm_pipeline_stages(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_crm_lead_stage(UUID, TEXT, INT, BOOLEAN) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.upsert_crm_lead(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
