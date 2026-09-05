-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('crm_leads', 'crm_pipeline_stages', 'crm_lead_activities')
ORDER BY tablename, policyname;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can manage their leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can view their pipeline stages" ON public.crm_pipeline_stages;
DROP POLICY IF EXISTS "Users can manage their pipeline stages" ON public.crm_pipeline_stages;

-- Recreate RLS policies with simpler logic that doesn't rely on helper functions
-- For crm_leads
CREATE POLICY "Users can view their leads" ON public.crm_leads
    FOR SELECT
    USING (
        account_id IN (
            SELECT account_id
            FROM public."Users"
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their leads" ON public.crm_leads
    FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM public."Users"
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their leads" ON public.crm_leads
    FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id
            FROM public."Users"
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their leads" ON public.crm_leads
    FOR DELETE
    USING (
        account_id IN (
            SELECT account_id
            FROM public."Users"
            WHERE auth_id = auth.uid()
        )
    );

-- For crm_pipeline_stages
CREATE POLICY "Users can view their stages" ON public.crm_pipeline_stages
    FOR SELECT
    USING (
        account_id IN (
            SELECT account_id
            FROM public."Users"
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their stages" ON public.crm_pipeline_stages
    FOR ALL
    USING (
        account_id IN (
            SELECT account_id
            FROM public."Users"
            WHERE auth_id = auth.uid()
        )
    );

-- Enable RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lead_activities ENABLE ROW LEVEL SECURITY;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
