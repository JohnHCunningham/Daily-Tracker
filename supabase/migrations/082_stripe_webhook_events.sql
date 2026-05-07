-- Migration 082: Stripe webhook event log and idempotency

CREATE TABLE IF NOT EXISTS "Stripe_Webhook_Events" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  account_id UUID REFERENCES "Accounts"(id) ON DELETE SET NULL,
  customer_id TEXT,
  subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_account_created
  ON "Stripe_Webhook_Events"(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status_created
  ON "Stripe_Webhook_Events"(status, created_at DESC);

ALTER TABLE "Stripe_Webhook_Events" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages stripe webhook events" ON "Stripe_Webhook_Events";
CREATE POLICY "service role manages stripe webhook events"
  ON "Stripe_Webhook_Events" FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_stripe_webhook_events_updated_at ON "Stripe_Webhook_Events";
CREATE TRIGGER update_stripe_webhook_events_updated_at
  BEFORE UPDATE ON "Stripe_Webhook_Events"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE "Stripe_Webhook_Events" IS 'Webhook event log for Stripe retries and billing diagnostics';
