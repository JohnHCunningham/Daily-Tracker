-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('crm_leads', 'crm_pipeline_stages');

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('crm_leads', 'crm_pipeline_stages')
ORDER BY tablename, policyname;

-- Temporarily disable RLS to test if that's the issue
ALTER TABLE public.crm_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages DISABLE ROW LEVEL SECURITY;

-- Verify they're disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('crm_leads', 'crm_pipeline_stages');
