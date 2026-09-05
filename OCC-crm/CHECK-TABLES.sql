-- Check if tables exist and their schema
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('crm_leads', 'crm_pipeline_stages', 'crm_lead_activities')
ORDER BY table_name;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('crm_leads', 'crm_pipeline_stages', 'crm_lead_activities');

-- Check if tables are in the publication for PostgREST
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('crm_leads', 'crm_pipeline_stages', 'crm_lead_activities');

-- Grant table access to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pipeline_stages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_lead_activities TO anon, authenticated;

-- Ensure tables are added to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_pipeline_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_lead_activities;

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
