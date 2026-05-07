-- Migration 080: Tighten tenant security around Users, Accounts, and integration tables
-- This replaces legacy User_Roles-based access checks with Users-based checks.

-- Helper functions sourced from the current Users table.
CREATE OR REPLACE FUNCTION get_my_account_id()
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (
    SELECT account_id
    FROM "Users"
    WHERE auth_id = auth.uid()
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM "Users"
    WHERE auth_id = auth.uid()
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_account_leader()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN get_my_role() IN ('admin', 'manager', 'coach');
END;
$$;

CREATE OR REPLACE FUNCTION is_account_admin_or_manager()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN get_my_role() IN ('admin', 'manager');
END;
$$;

-- Accounts
ALTER TABLE IF EXISTS "Accounts" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their account" ON "Accounts";
DROP POLICY IF EXISTS "Managers can update account" ON "Accounts";
CREATE POLICY "Users can view their account" ON "Accounts"
  FOR SELECT
  USING (id = get_my_account_id());

CREATE POLICY "Managers can update account" ON "Accounts"
  FOR UPDATE
  USING (id = get_my_account_id() AND is_account_admin_or_manager())
  WITH CHECK (id = get_my_account_id() AND is_account_admin_or_manager());

-- Users
ALTER TABLE IF EXISTS "Users" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own record" ON "Users";
DROP POLICY IF EXISTS "Users can view teammates in their account" ON "Users";
DROP POLICY IF EXISTS "Users can update their own record" ON "Users";
DROP POLICY IF EXISTS "Admins and managers can manage users in their account" ON "Users";

CREATE POLICY "Users can view their own record" ON "Users"
  FOR SELECT
  USING (auth_id = auth.uid());

CREATE POLICY "Leaders can view teammates in their account" ON "Users"
  FOR SELECT
  USING (account_id = get_my_account_id() AND is_account_leader());

CREATE POLICY "Users can update their own record" ON "Users"
  FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Admins and managers can manage users in their account" ON "Users"
  FOR ALL
  USING (account_id = get_my_account_id() AND is_account_admin_or_manager())
  WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());

-- API_Connections
ALTER TABLE IF EXISTS "API_Connections" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Managers can view API connections" ON "API_Connections";
DROP POLICY IF EXISTS "Managers can manage API connections" ON "API_Connections";
DROP POLICY IF EXISTS "Managers access API_Connections" ON "API_Connections";
DROP POLICY IF EXISTS "policy_api_connections" ON "API_Connections";

CREATE POLICY "Managers can view API connections" ON "API_Connections"
  FOR SELECT
  USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Managers can manage API connections" ON "API_Connections"
  FOR ALL
  USING (account_id = get_my_account_id() AND is_account_admin_or_manager())
  WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());

-- Synced_Conversations
ALTER TABLE IF EXISTS "Synced_Conversations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view conversations" ON "Synced_Conversations";
DROP POLICY IF EXISTS "Users access Synced_Conversations" ON "Synced_Conversations";
DROP POLICY IF EXISTS "policy_synced_conversations" ON "Synced_Conversations";

CREATE POLICY "Users can view conversations" ON "Synced_Conversations"
  FOR SELECT
  USING (
    account_id = get_my_account_id()
    AND (
      is_account_leader()
      OR rep_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

-- Synced_Activities
ALTER TABLE IF EXISTS "Synced_Activities" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view activities" ON "Synced_Activities";
DROP POLICY IF EXISTS "Users access Synced_Activities" ON "Synced_Activities";
DROP POLICY IF EXISTS "policy_synced_activities" ON "Synced_Activities";

CREATE POLICY "Users can view activities" ON "Synced_Activities"
  FOR SELECT
  USING (
    account_id = get_my_account_id()
    AND (
      is_account_leader()
      OR rep_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

-- Coaching_Messages
ALTER TABLE IF EXISTS "Coaching_Messages" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view coaching messages" ON "Coaching_Messages";
DROP POLICY IF EXISTS "Coaches can insert coaching messages" ON "Coaching_Messages";
DROP POLICY IF EXISTS "Coaches can update coaching messages" ON "Coaching_Messages";
DROP POLICY IF EXISTS "Users access Coaching_Messages" ON "Coaching_Messages";
DROP POLICY IF EXISTS "policy_coaching_messages" ON "Coaching_Messages";

CREATE POLICY "Users can view coaching messages" ON "Coaching_Messages"
  FOR SELECT
  USING (
    account_id = get_my_account_id()
    AND (
      is_account_leader()
      OR rep_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "Coaches can insert coaching messages" ON "Coaching_Messages"
  FOR INSERT
  WITH CHECK (
    account_id = get_my_account_id()
    AND is_account_leader()
  );

CREATE POLICY "Coaches can update coaching messages" ON "Coaching_Messages"
  FOR UPDATE
  USING (
    account_id = get_my_account_id()
    AND (
      is_account_leader()
      OR rep_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
    )
  )
  WITH CHECK (
    account_id = get_my_account_id()
    AND (
      is_account_leader()
      OR rep_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

-- Coaching_Outcomes
ALTER TABLE IF EXISTS "Coaching_Outcomes" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view coaching outcomes" ON "Coaching_Outcomes";
DROP POLICY IF EXISTS "Users access Coaching_Outcomes" ON "Coaching_Outcomes";
DROP POLICY IF EXISTS "policy_coaching_outcomes" ON "Coaching_Outcomes";

CREATE POLICY "Users can view coaching outcomes" ON "Coaching_Outcomes"
  FOR SELECT
  USING (account_id = get_my_account_id());

-- Integration_Sync_Log
ALTER TABLE IF EXISTS "Integration_Sync_Log" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Managers can view sync logs" ON "Integration_Sync_Log";
DROP POLICY IF EXISTS "policy_integration_sync_log" ON "Integration_Sync_Log";

CREATE POLICY "Managers can view sync logs" ON "Integration_Sync_Log"
  FOR SELECT
  USING (account_id = get_my_account_id() AND is_account_leader());

-- Direct_Messages
ALTER TABLE IF EXISTS "Direct_Messages" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_messages" ON "Direct_Messages";
DROP POLICY IF EXISTS "users_send_messages" ON "Direct_Messages";
DROP POLICY IF EXISTS "users_update_received_messages" ON "Direct_Messages";

CREATE POLICY "users_read_own_messages" ON "Direct_Messages"
  FOR SELECT
  USING (
    account_id = get_my_account_id()
    AND (
      sender_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
      OR recipient_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "users_send_messages" ON "Direct_Messages"
  FOR INSERT
  WITH CHECK (
    account_id = get_my_account_id()
    AND sender_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "users_update_received_messages" ON "Direct_Messages"
  FOR UPDATE
  USING (
    account_id = get_my_account_id()
    AND recipient_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    account_id = get_my_account_id()
    AND recipient_email = (SELECT email FROM "Users" WHERE auth_id = auth.uid() LIMIT 1)
  );

