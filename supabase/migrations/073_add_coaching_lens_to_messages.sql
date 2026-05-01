-- Migration 073: Add coaching_lens to Coaching_Messages
--
-- When analyze-call generates coaching, it picks a lens (script, question,
-- pattern, analogy, contrast) to vary the coaching style. This lens choice
-- needs to be stored on the coaching message so that:
--   1. send-coaching-email can write it to RAG with the correct metadata
--   2. RAG search can filter/prioritize by lens style
--   3. Future analysis can avoid re-using the same lens for the same rep/weakness

ALTER TABLE "Coaching_Messages"
  ADD COLUMN IF NOT EXISTS coaching_lens TEXT;

-- Backfill existing messages: we can't determine the original lens retroactively,
-- so leave them NULL. Only new messages will have this populated.
