-- 078_coaching_enhancements.sql
-- Coaching Commitments: AI-extracted action items from coaching messages

CREATE TABLE IF NOT EXISTS "Coaching_Commitments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
  coaching_message_id UUID NOT NULL REFERENCES "Coaching_Messages"(id) ON DELETE CASCADE,
  rep_email TEXT NOT NULL,
  commitment_text TEXT NOT NULL,
  due_description TEXT DEFAULT 'By next call',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'dismissed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_coaching_commitments_account ON "Coaching_Commitments"(account_id);
CREATE INDEX idx_coaching_commitments_rep ON "Coaching_Commitments"(rep_email);
CREATE INDEX idx_coaching_commitments_message ON "Coaching_Commitments"(coaching_message_id);
CREATE INDEX idx_coaching_commitments_status ON "Coaching_Commitments"(status) WHERE status = 'open';

-- RLS
ALTER TABLE "Coaching_Commitments" ENABLE ROW LEVEL SECURITY;

-- Reps can see and update their own commitments
CREATE POLICY "Reps see own commitments"
  ON "Coaching_Commitments"
  FOR SELECT
  USING (
    rep_email = (
      SELECT email FROM "Users"
      WHERE auth_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Reps update own commitments"
  ON "Coaching_Commitments"
  FOR UPDATE
  USING (
    rep_email = (
      SELECT email FROM "Users"
      WHERE auth_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    rep_email = (
      SELECT email FROM "Users"
      WHERE auth_id = auth.uid()
      LIMIT 1
    )
  );

-- Leaders (admin/manager/coach) can see all commitments in their account
CREATE POLICY "Leaders see account commitments"
  ON "Coaching_Commitments"
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM "Users"
      WHERE auth_id = auth.uid()
        AND role IN ('admin', 'manager', 'coach')
    )
  );

-- Service role can insert (used by edge functions)
CREATE POLICY "Service role inserts commitments"
  ON "Coaching_Commitments"
  FOR INSERT
  WITH CHECK (true);
