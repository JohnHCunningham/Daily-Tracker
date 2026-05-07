-- Migration 090: Audit trail for emergency account ownership handoffs

CREATE TABLE IF NOT EXISTS "Account_Handoff_Events" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  performed_by TEXT NOT NULL DEFAULT 'support',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_handoff_events_account_created
  ON "Account_Handoff_Events"(account_id, created_at DESC);

ALTER TABLE "Account_Handoff_Events" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaders can view account handoff events" ON "Account_Handoff_Events";
CREATE POLICY "Leaders can view account handoff events" ON "Account_Handoff_Events"
  FOR SELECT
  USING (
    account_id = get_my_account_id()
    AND is_account_admin_or_manager()
  );
