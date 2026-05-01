-- Migration 068: Fix cron pipeline bugs
--
-- Bug 1: run_daily_coaching_pipeline() references Accounts.status which doesn't exist.
--         The column is actually "is_active" (boolean).
-- Bug 2: notify_leaders_pending_coaching() references Coaching_Messages.account_id
--         which doesn't exist. Must join through from_user_id → Users to get account_id.
-- Fix 3: Set app.supabase_url and app.service_role_key database settings so
--         invoke_edge_function() can actually call Edge Functions.

-- ============================================
-- Fix 1: Rewrite run_daily_coaching_pipeline()
-- ============================================
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

  END LOOP;

  RAISE LOG '[coaching-pipeline] Daily pipeline complete at %', now();
END;
$$;

-- ============================================
-- Fix 2: Rewrite notify_leaders_pending_coaching()
-- Join Coaching_Messages through from_user_id → Users to resolve account_id
-- ============================================
CREATE OR REPLACE FUNCTION notify_leaders_pending_coaching()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  leader RECORD;
  pending_count INT;
BEGIN
  -- Find leaders with pending coaching messages
  FOR leader IN
    SELECT DISTINCT u.id AS user_id, u.email, u.account_id, u.first_name
    FROM "Users" u
    WHERE u.role IN ('admin', 'manager', 'coach')
  LOOP
    -- Count pending coaching for their account
    -- Coaching_Messages doesn't have account_id directly;
    -- join through from_user_id to Users to match on account
    SELECT COUNT(*) INTO pending_count
    FROM "Coaching_Messages" cm
    JOIN "Users" sender ON sender.id = cm.from_user_id
    WHERE sender.account_id = leader.account_id
      AND cm.status = 'generated'
      AND cm.created_at > now() - interval '24 hours';

    IF pending_count > 0 THEN
      PERFORM invoke_edge_function('send-coaching-email', jsonb_build_object(
        'type', 'leader_digest',
        'leader_email', leader.email,
        'leader_name', leader.first_name,
        'pending_count', pending_count,
        'account_id', leader.account_id
      ));
      RAISE LOG '[coaching-pipeline] Notified leader % of % pending coaching messages', leader.email, pending_count;
    END IF;
  END LOOP;
END;
$$;

-- Fix 3: app.supabase_url and app.service_role_key must be set via
-- Supabase Dashboard → SQL Editor (requires superuser privileges)
-- or via supabase postgres-config update.
