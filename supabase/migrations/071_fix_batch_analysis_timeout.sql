-- Migration 071: Fix batch analysis timeout
--
-- Problem: run_daily_coaching_pipeline() invokes analyze-call in batch mode,
-- which then loops through all unanalyzed calls sequentially inside a single
-- Edge Function invocation. Each call takes ~10-15s (GPT-4 + RAG + DB writes),
-- so 4+ calls exceeds the 60s Edge Function timeout.
--
-- Fix: Move the fan-out into the DB function. Instead of one batch call,
-- query unanalyzed calls directly and fire off individual analyze-call
-- invocations via pg_net (fire-and-forget, effectively parallel).

CREATE OR REPLACE FUNCTION run_daily_coaching_pipeline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account RECORD;
  connection RECORD;
  pending_call RECORD;
  call_count INT;
BEGIN
  RAISE LOG '[coaching-pipeline] Starting daily coaching pipeline at %', now();

  -- Loop through all active accounts (is_active = true or null means active)
  FOR account IN
    SELECT id FROM "Accounts" WHERE is_active = true OR is_active IS NULL
  LOOP
    RAISE LOG '[coaching-pipeline] Processing account %', account.id;

    -- Trigger sync for each active integration connection
    FOR connection IN
      SELECT provider, id
      FROM "API_Connections"
      WHERE account_id = account.id
        AND connection_status = 'active'
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

        WHEN 'aircall' THEN
          PERFORM invoke_edge_function('aircall-sync', jsonb_build_object(
            'account_id', account.id
          ));
          RAISE LOG '[coaching-pipeline] Triggered aircall-sync for account %', account.id;

        ELSE
          RAISE LOG '[coaching-pipeline] Unknown provider % for account %', connection.provider, account.id;
      END CASE;
    END LOOP;

    -- Small delay to allow syncs to land (pg_net is async/fire-and-forget)
    PERFORM pg_sleep(2);

    -- Fan out: invoke analyze-call INDIVIDUALLY for each unanalyzed call.
    -- Each invocation goes through pg_net as a separate HTTP request,
    -- so they run in parallel and each gets its own 60s timeout.
    call_count := 0;
    FOR pending_call IN
      SELECT id
      FROM "Synced_Conversations"
      WHERE account_id = account.id
        AND analyzed_at IS NULL
        AND transcript IS NOT NULL
      ORDER BY call_date DESC
      LIMIT 20  -- Cap per account per run
    LOOP
      PERFORM invoke_edge_function('analyze-call', jsonb_build_object(
        'call_id', pending_call.id,
        'use_rag', true
      ));
      call_count := call_count + 1;
    END LOOP;

    RAISE LOG '[coaching-pipeline] Dispatched % individual analyze-call invocations for account %', call_count, account.id;

  END LOOP;

  RAISE LOG '[coaching-pipeline] Daily pipeline complete at %', now();
END;
$$;

COMMENT ON FUNCTION run_daily_coaching_pipeline() IS 'Daily 8am EST pipeline: syncs integrations, then fans out individual analyze-call invocations per unanalyzed call via pg_net (parallel, no timeout issues)';
