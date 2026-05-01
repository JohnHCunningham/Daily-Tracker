-- Migration 072: Add call_id and account_id to Coaching_Messages
--
-- Two missing columns that break the send-coaching-email → RAG write-back flow:
--
-- 1. call_id: needed to look up methodology_scores from Synced_Conversations
--    and extract weak components for RAG tagging. Without it, everything
--    defaults to component "GENERAL".
--
-- 2. account_id: referenced in send-coaching-email's select query. Because
--    PostgREST errors on non-existent columns, the entire coaching message
--    lookup fails silently, making coachingMsg null and skipping RAG write-back.

-- Add columns
ALTER TABLE "Coaching_Messages"
  ADD COLUMN IF NOT EXISTS call_id UUID REFERENCES "Synced_Conversations"(id);

ALTER TABLE "Coaching_Messages"
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES "Accounts"(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coaching_messages_call_id
  ON "Coaching_Messages" (call_id);

CREATE INDEX IF NOT EXISTS idx_coaching_messages_account_id
  ON "Coaching_Messages" (account_id);

-- Backfill account_id from the sender (from_user_id → Users.account_id)
UPDATE "Coaching_Messages" cm
SET account_id = u.account_id
FROM "Users" u
WHERE cm.from_user_id = u.id
  AND cm.account_id IS NULL;

-- Backfill call_id by matching rep_email + date extracted from subject.
-- Subject format: "Sandler Analysis: M/D/YYYY (Score: X.X/10)"
UPDATE "Coaching_Messages" cm
SET call_id = matched.conv_id
FROM (
  SELECT
    cm2.id AS msg_id,
    sc.id  AS conv_id
  FROM "Coaching_Messages" cm2
  JOIN "Synced_Conversations" sc
    ON sc.rep_email = cm2.rep_email
   AND sc.call_date::date = to_date(
         substring(cm2.subject FROM 'Analysis: (\d{1,2}/\d{1,2}/\d{4})'),
         'MM/DD/YYYY'
       )
  WHERE cm2.call_id IS NULL
    AND cm2.subject LIKE 'Sandler Analysis:%'
) matched
WHERE cm.id = matched.msg_id;
