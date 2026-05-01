-- Coaching Variation Framework: lens rotation + escalation tiers
-- Adds coaching_lens tracking and escalation_tier to prevent repetitive suggestions

-- Add coaching lens column: which angle was used for this suggestion
ALTER TABLE "Coaching_Suggestions_Log"
  ADD COLUMN IF NOT EXISTS coaching_lens TEXT DEFAULT 'script';

-- Add escalation tier: computed from times_flagged, stored for query convenience
ALTER TABLE "Coaching_Suggestions_Log"
  ADD COLUMN IF NOT EXISTS escalation_tier INT DEFAULT 1;

-- Index for efficient lens rotation queries (what lens was last used per rep per component)
CREATE INDEX IF NOT EXISTS idx_suggestions_lens_rotation
  ON "Coaching_Suggestions_Log" (user_id, weakness_pattern, coaching_lens, last_flagged_at DESC);

-- Add manager_approved content type to knowledge base for feedback loop
-- (No schema change needed — Sandler_Knowledge_Base.content_type is already TEXT)

-- Track which coaching message an approved edit came from
ALTER TABLE "Sandler_Knowledge_Base"
  ADD COLUMN IF NOT EXISTS source_coaching_message_id UUID;

-- Policy: allow service role to insert manager-approved content
-- (existing INSERT policy with WITH CHECK (true) covers this for service role)

-- Track whether a manager edited the coaching before sending
ALTER TABLE "Coaching_Messages"
  ADD COLUMN IF NOT EXISTS manager_edited BOOLEAN DEFAULT false;

-- Update policy to allow service role updates on suggestions log
DROP POLICY IF EXISTS "System can update coaching suggestions" ON "Coaching_Suggestions_Log";
CREATE POLICY "System can update coaching suggestions"
  ON "Coaching_Suggestions_Log" FOR UPDATE
  USING (true)
  WITH CHECK (true);
