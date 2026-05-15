-- Sales Copilot Tables
-- Stores copilot chat interactions and feedback

CREATE TABLE IF NOT EXISTS "Copilot_Interactions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  question TEXT NOT NULL,
  intent_matched TEXT,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Copilot_Feedback" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES "Copilot_Interactions"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  intent_name TEXT,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_copilot_interactions_account ON "Copilot_Interactions"(account_id);
CREATE INDEX IF NOT EXISTS idx_copilot_interactions_user ON "Copilot_Interactions"(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_interactions_created ON "Copilot_Interactions"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copilot_feedback_interaction ON "Copilot_Feedback"(interaction_id);
CREATE INDEX IF NOT EXISTS idx_copilot_feedback_user ON "Copilot_Feedback"(user_id);

-- Row Level Security
ALTER TABLE "Copilot_Interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Copilot_Feedback" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own account's interactions
DROP POLICY IF EXISTS "Users can view copilot interactions for their account" ON "Copilot_Interactions";
CREATE POLICY "Users can view copilot interactions for their account"
  ON "Copilot_Interactions" FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM "Users" WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert copilot interactions for their account" ON "Copilot_Interactions";
CREATE POLICY "Users can insert copilot interactions for their account"
  ON "Copilot_Interactions" FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM "Users" WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view feedback for their account" ON "Copilot_Feedback";
CREATE POLICY "Users can view feedback for their account"
  ON "Copilot_Feedback" FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM "Users" WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own feedback" ON "Copilot_Feedback";
CREATE POLICY "Users can insert their own feedback"
  ON "Copilot_Feedback" FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM "Users" WHERE auth_id = auth.uid()
    )
  );
