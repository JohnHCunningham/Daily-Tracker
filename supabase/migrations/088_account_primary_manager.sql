-- Migration 088: track primary manager on the account

ALTER TABLE "Accounts"
  ADD COLUMN IF NOT EXISTS primary_manager_user_id UUID;

ALTER TABLE "Accounts"
  ADD CONSTRAINT accounts_primary_manager_user_id_fkey
  FOREIGN KEY (primary_manager_user_id) REFERENCES "Users"(id) ON DELETE SET NULL;

COMMENT ON COLUMN "Accounts".primary_manager_user_id IS 'Primary manager responsible for the account and billing handoff';
