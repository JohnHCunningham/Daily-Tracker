-- Migration 087: manager onboarding context

ALTER TABLE "Accounts"
  ADD COLUMN IF NOT EXISTS unique_customer_profile TEXT,
  ADD COLUMN IF NOT EXISTS competitor_context TEXT;

COMMENT ON COLUMN "Accounts".unique_customer_profile IS 'Description of the ideal / unique customer the team sells to';
COMMENT ON COLUMN "Accounts".competitor_context IS 'Notes on the main competitors, why they win, and why OCC should win';
