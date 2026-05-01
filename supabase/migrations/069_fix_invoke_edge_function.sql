-- Migration 069: Hardcode project URL and service role key into invoke_edge_function
--
-- Supabase managed Postgres does not allow ALTER DATABASE SET for custom app.* params.
-- Instead, embed the values directly in the function body.

CREATE OR REPLACE FUNCTION invoke_edge_function(
  function_name TEXT,
  payload JSONB DEFAULT '{}'::JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url TEXT := 'https://qwqlsbccwnwrdpcaccjz.supabase.co';
  service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cWxzYmNjd253cmRwY2FjY2p6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMDUwNCwiZXhwIjoyMDgwODg2NTA0fQ.HdW152OAQUE2VqlUSeaLWPVht_J6V9GFknSxW6xisVU';
  request_id BIGINT;
BEGIN
  SELECT net.http_post(
    url := project_url || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := payload
  ) INTO request_id;

  RETURN request_id;
END;
$$;
