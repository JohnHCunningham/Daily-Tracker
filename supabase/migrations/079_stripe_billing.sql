-- Migration: Add Stripe billing fields to Accounts table
-- Per-rep pricing model: $50/rep/month or $500/rep/year

-- Add Stripe billing columns to Accounts table
ALTER TABLE "Accounts"
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS rep_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_customer ON "Accounts"(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_subscription_status ON "Accounts"(subscription_status);

-- Function to check if account has active subscription
CREATE OR REPLACE FUNCTION is_subscription_active(account_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  status TEXT;
  trial_end TIMESTAMPTZ;
BEGIN
  SELECT subscription_status, trial_ends_at
  INTO status, trial_end
  FROM "Accounts"
  WHERE id = account_id;

  -- Active subscription
  IF status = 'active' THEN
    RETURN TRUE;
  END IF;

  -- In trial period
  IF status = 'trialing' AND (trial_end IS NULL OR trial_end > NOW()) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription info for an account
CREATE OR REPLACE FUNCTION get_subscription_info(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'subscription_status', subscription_status,
    'billing_cycle', billing_cycle,
    'rep_count', rep_count,
    'trial_ends_at', trial_ends_at,
    'current_period_end', current_period_end,
    'cancel_at_period_end', cancel_at_period_end,
    'stripe_customer_id', stripe_customer_id,
    'stripe_subscription_id', stripe_subscription_id,
    'max_team_members', max_team_members
  )
  INTO result
  FROM "Accounts"
  WHERE id = p_account_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON COLUMN "Accounts".stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN "Accounts".stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN "Accounts".stripe_price_id IS 'Active Stripe price ID (price_xxx)';
COMMENT ON COLUMN "Accounts".rep_count IS 'Number of reps in subscription (quantity)';
COMMENT ON COLUMN "Accounts".billing_cycle IS 'Billing frequency: monthly or annual';
COMMENT ON COLUMN "Accounts".subscription_status IS 'Current subscription state';
COMMENT ON COLUMN "Accounts".trial_ends_at IS 'When the trial period ends';
COMMENT ON COLUMN "Accounts".current_period_end IS 'When the current billing period ends';
COMMENT ON COLUMN "Accounts".cancel_at_period_end IS 'If true, subscription will cancel at period end';
