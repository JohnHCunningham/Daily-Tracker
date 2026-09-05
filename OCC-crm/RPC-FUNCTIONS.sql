-- First, create a unique index that handles NULL company values
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_unique_person
ON crm_leads (account_id, first_name, last_name, COALESCE(company, ''));

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
    ON CONFLICT ON CONSTRAINT crm_leads_unique_person
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
