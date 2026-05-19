-- Migration 097: remove Aircall from the daily coaching pipeline
--
-- John confirmed Aircall will not be used. Keep existing historical data intact,
-- but stop cron/pipeline code from invoking the deprecated aircall-sync function.

CREATE OR REPLACE FUNCTION run_daily_coaching_pipeline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account RECORD;
  connection RECORD;
  conversation RECORD;
  call_count INT;
BEGIN
  RAISE LOG '[coaching-pipeline] Starting daily coaching pipeline at %', now();

  FOR account IN
    SELECT id FROM "Accounts" WHERE is_active = true OR is_active IS NULL
  LOOP
    RAISE LOG '[coaching-pipeline] Processing account %', account.id;

    FOR connection IN
      SELECT provider, id
      FROM "API_Connections"
      WHERE account_id = account.id
        AND connection_status = 'active'
        AND provider IN ('hubspot', 'fathom')
    LOOP
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

        ELSE
          RAISE LOG '[coaching-pipeline] Ignored unsupported provider % for account %', connection.provider, account.id;
      END CASE;
    END LOOP;

    PERFORM pg_sleep(2);
    call_count := 0;

    FOR conversation IN
      SELECT id
      FROM "Synced_Conversations"
      WHERE account_id = account.id
        AND analyzed_at IS NULL
        AND transcript IS NOT NULL
      ORDER BY call_date DESC
      LIMIT 50
    LOOP
      PERFORM invoke_edge_function('analyze-call', jsonb_build_object(
        'account_id', account.id,
        'call_id', conversation.id,
        'use_rag', true
      ));
      call_count := call_count + 1;
    END LOOP;

    RAISE LOG '[coaching-pipeline] Dispatched % individual analyze-call invocations for account %', call_count, account.id;

    PERFORM pg_sleep(2);

    PERFORM invoke_edge_function('detect-milestones', jsonb_build_object(
      'account_id', account.id
    ));
    RAISE LOG '[coaching-pipeline] Triggered milestone detection for account %', account.id;
  END LOOP;

  RAISE LOG '[coaching-pipeline] Daily pipeline complete at %', now();
END;
$$;

COMMENT ON FUNCTION run_daily_coaching_pipeline() IS 'Daily 8am EST pipeline: syncs HubSpot/Fathom, fans out individual analyze-call invocations, then detects milestones. Aircall removed 2026-05-19.';
