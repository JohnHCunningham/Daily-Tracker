-- Check if the RPC functions exist
SELECT
    routine_name,
    routine_schema,
    security_type
FROM information_schema.routines
WHERE routine_name IN ('get_crm_leads', 'get_crm_pipeline_stages', 'update_crm_lead_stage', 'upsert_crm_lead')
ORDER BY routine_name;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_crm_leads(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_pipeline_stages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_crm_lead_stage(UUID, TEXT, INT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_crm_lead(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
