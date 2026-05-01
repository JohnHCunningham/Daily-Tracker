-- Migration 075: Direct Messages table for 1-on-1 notes
-- Enables manager-rep private messaging / 1-on-1 notes.

CREATE TABLE IF NOT EXISTS "Direct_Messages" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "Direct_Messages" ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received, scoped to their account
CREATE POLICY "users_read_own_messages" ON "Direct_Messages"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".auth_id = auth.uid()
      AND "Users".account_id = "Direct_Messages".account_id
      AND ("Users".email = "Direct_Messages".sender_email
           OR "Users".email = "Direct_Messages".recipient_email)
    )
  );

-- Users can send messages (insert) within their account
CREATE POLICY "users_send_messages" ON "Direct_Messages"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".auth_id = auth.uid()
      AND "Users".account_id = "Direct_Messages".account_id
      AND "Users".email = "Direct_Messages".sender_email
    )
  );

-- Users can update messages they received (mark as read)
CREATE POLICY "users_update_received_messages" ON "Direct_Messages"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".auth_id = auth.uid()
      AND "Users".account_id = "Direct_Messages".account_id
      AND "Users".email = "Direct_Messages".recipient_email
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".auth_id = auth.uid()
      AND "Users".account_id = "Direct_Messages".account_id
      AND "Users".email = "Direct_Messages".recipient_email
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_account
  ON "Direct_Messages"(account_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation
  ON "Direct_Messages"(sender_email, recipient_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_unread
  ON "Direct_Messages"(recipient_email, is_read)
  WHERE is_read = FALSE;

SELECT 'Migration 075 complete: Direct_Messages table' AS status;
