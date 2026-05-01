-- Migration 077: Integrate milestone detection into daily coaching pipeline
-- Adds a detect-milestones invocation at the end of run_daily_coaching_pipeline().

CREATE OR REPLACE FUNCTION run_daily_coaching_pipeline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account RECORD;
  connection RECORD;
BEGIN
  RAISE LOG '[coaching-pipeline] Starting daily coaching pipeline at %', now();

  -- Loop through all active accounts
  FOR account IN
    SELECT id FROM "Accounts" WHERE status = 'active' OR status IS NULL
  LOOP
    RAISE LOG '[coaching-pipeline] Processing account %', account.id;

    -- Trigger sync for each active integration connection
    FOR connection IN
      SELECT provider, id
      FROM "API_Connections"
      WHERE account_id = account.id
        AND connection_status = 'active'
    LOOP
      -- Dispatch sync based on provider
      CASE connection.provider
        WHEN 'hubspot' THEN
          PERFORM invoke_edge_function('hubspot-sync', jsonb_build_object(
            'account_id', account.id
          ));
          RAISE LOG '[coaching-pipeline] Triggered hubspot-sync for account %', account.id;

        WHEN 'fathom' THEN
          PERFORM invoke_edge_function('fathom-sync', jsonb_build_object(
            'account_id', account.id
          ));
          RAISE LOG '[coaching-pipeline] Triggered fathom-sync for account %', account.id;

        WHEN 'aircall' THEN
          PERFORM invoke_edge_function('aircall-sync', jsonb_build_object(
            'account_id', account.id
          ));
          RAISE LOG '[coaching-pipeline] Triggered aircall-sync for account %', account.id;

        ELSE
          RAISE LOG '[coaching-pipeline] Unknown provider % for account %', connection.provider, account.id;
      END CASE;
    END LOOP;

    -- After syncs dispatched, trigger analysis of unanalyzed conversations
    -- (Small delay to allow syncs to land — edge functions are async via pg_net)
    PERFORM pg_sleep(2);

    PERFORM invoke_edge_function('analyze-call', jsonb_build_object(
      'account_id', account.id,
      'mode', 'batch',
      'use_rag', true
    ));
    RAISE LOG '[coaching-pipeline] Triggered batch analysis for account %', account.id;

    -- Detect milestones after analysis completes
    PERFORM pg_sleep(2);

    PERFORM invoke_edge_function('detect-milestones', jsonb_build_object(
      'account_id', account.id
    ));
    RAISE LOG '[coaching-pipeline] Triggered milestone detection for account %', account.id;

  END LOOP;

  RAISE LOG '[coaching-pipeline] Daily pipeline complete at %', now();
END;
$$;

COMMENT ON FUNCTION run_daily_coaching_pipeline() IS 'Daily 8am EST pipeline: syncs integrations, analyzes new calls, detects milestones, queues coaching for leader approval';

SELECT 'Migration 077 complete: milestone detection integrated into pipeline' AS status;
