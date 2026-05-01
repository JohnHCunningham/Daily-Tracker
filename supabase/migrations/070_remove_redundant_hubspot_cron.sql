-- Migration 070: Remove redundant standalone hubspot-sync cron job
--
-- There was a standalone cron job that called hubspot-sync daily at 6 AM UTC
-- using the anon key. This is redundant with the main daily-coaching-pipeline
-- (migration 063) which already syncs HubSpot for all active accounts at
-- 13:00 UTC using the service role key.

-- Remove the redundant job (no-op if it doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('hubspot-sync');
  RAISE LOG '[migration-070] Removed redundant hubspot-sync cron job';
EXCEPTION
  WHEN others THEN
    RAISE LOG '[migration-070] hubspot-sync cron job not found or already removed: %', SQLERRM;
END;
$$;
