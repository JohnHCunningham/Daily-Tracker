-- Migration 095: Map HubSpot owners to OCC users for reliable activity allocation.

ALTER TABLE IF EXISTS "Synced_Activities"
  ADD COLUMN IF NOT EXISTS occ_user_id UUID REFERENCES "Users"(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "Integration_User_Mappings" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  provider_name TEXT,
  occ_user_id UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  match_status TEXT NOT NULL DEFAULT 'unmatched'
    CHECK (match_status IN ('matched', 'unmatched', 'ignored')),
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0
    CHECK (confidence >= 0 AND confidence <= 1),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_integration_user_mappings_account_provider
  ON "Integration_User_Mappings"(account_id, provider, match_status);

CREATE INDEX IF NOT EXISTS idx_integration_user_mappings_occ_user
  ON "Integration_User_Mappings"(occ_user_id);

CREATE INDEX IF NOT EXISTS idx_synced_activities_occ_user
  ON "Synced_Activities"(occ_user_id, activity_date DESC);

DROP TRIGGER IF EXISTS update_integration_user_mappings_updated_at ON "Integration_User_Mappings";
CREATE TRIGGER update_integration_user_mappings_updated_at
  BEFORE UPDATE ON "Integration_User_Mappings"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE "Integration_User_Mappings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view integration user mappings" ON "Integration_User_Mappings";
DROP POLICY IF EXISTS "Managers can manage integration user mappings" ON "Integration_User_Mappings";

CREATE POLICY "Managers can view integration user mappings" ON "Integration_User_Mappings"
  FOR SELECT
  USING (account_id = get_my_account_id() AND is_account_admin_or_manager());

CREATE POLICY "Managers can manage integration user mappings" ON "Integration_User_Mappings"
  FOR ALL
  USING (account_id = get_my_account_id() AND is_account_admin_or_manager())
  WITH CHECK (account_id = get_my_account_id() AND is_account_admin_or_manager());
