-- Migration 086: billing grace period for payment failures

ALTER TABLE "Accounts"
  ADD COLUMN IF NOT EXISTS billing_grace_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN "Accounts".billing_grace_ends_at IS 'Grace window end after a payment failure before access is soft-locked';
