-- Migration 081: Coaching memory entries for notes, coaching, and future trend retrieval
-- Stores tenant-scoped memory records that can be embedded and searched for RAG.

CREATE TABLE IF NOT EXISTS "Coaching_Memory_Entries" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,

  -- What produced the memory?
  source_type TEXT NOT NULL CHECK (source_type IN ('note', 'coaching', 'call_summary')),
  source_table TEXT NOT NULL,
  source_id UUID,

  -- Human-readable content
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Who is this about?
  rep_email TEXT,
  manager_email TEXT,
  sender_email TEXT,
  recipient_email TEXT,

  -- Categorization
  methodology TEXT,
  status TEXT,
  weakness_tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  situation_tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- RAG
  embedding vector(1536),
  embedding_model TEXT,
  embedding_status TEXT NOT NULL DEFAULT 'pending',
  embedding_error TEXT,
  embedded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_memory_account_created
  ON "Coaching_Memory_Entries"(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coaching_memory_account_type_created
  ON "Coaching_Memory_Entries"(account_id, source_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coaching_memory_account_rep_created
  ON "Coaching_Memory_Entries"(account_id, rep_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coaching_memory_source
  ON "Coaching_Memory_Entries"(source_table, source_id);

CREATE INDEX IF NOT EXISTS coaching_memory_embedding_idx
  ON "Coaching_Memory_Entries"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE "Coaching_Memory_Entries" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view coaching memory" ON "Coaching_Memory_Entries";
CREATE POLICY "Users can view coaching memory"
  ON "Coaching_Memory_Entries" FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM "Users"
      WHERE "Users".auth_id = auth.uid()
        AND "Users".account_id = "Coaching_Memory_Entries".account_id
    )
  );

DROP POLICY IF EXISTS "Users can insert coaching memory" ON "Coaching_Memory_Entries";
CREATE POLICY "Users can insert coaching memory"
  ON "Coaching_Memory_Entries" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "Users"
      WHERE "Users".auth_id = auth.uid()
        AND "Users".account_id = "Coaching_Memory_Entries".account_id
    )
  );

DROP POLICY IF EXISTS "System can update coaching memory" ON "Coaching_Memory_Entries";
CREATE POLICY "System can update coaching memory"
  ON "Coaching_Memory_Entries" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM "Users"
      WHERE "Users".auth_id = auth.uid()
        AND "Users".account_id = "Coaching_Memory_Entries".account_id
    )
  );

DROP TRIGGER IF EXISTS update_coaching_memory_entries_updated_at ON "Coaching_Memory_Entries";
CREATE TRIGGER update_coaching_memory_entries_updated_at
  BEFORE UPDATE ON "Coaching_Memory_Entries"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION search_coaching_memory(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.65,
  match_count INT DEFAULT 5,
  filter_account_id UUID DEFAULT NULL,
  filter_source_types TEXT[] DEFAULT NULL,
  filter_rep_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  source_type TEXT,
  source_table TEXT,
  source_id UUID,
  title TEXT,
  content TEXT,
  rep_email TEXT,
  manager_email TEXT,
  sender_email TEXT,
  recipient_email TEXT,
  methodology TEXT,
  status TEXT,
  weakness_tags TEXT[],
  situation_tags TEXT[],
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    e.id,
    e.account_id,
    e.source_type,
    e.source_table,
    e.source_id,
    e.title,
    e.content,
    e.rep_email,
    e.manager_email,
    e.sender_email,
    e.recipient_email,
    e.methodology,
    e.status,
    e.weakness_tags,
    e.situation_tags,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM "Coaching_Memory_Entries" e
  WHERE e.embedding IS NOT NULL
    AND (filter_account_id IS NULL OR e.account_id = filter_account_id)
    AND (filter_source_types IS NULL OR e.source_type = ANY(filter_source_types))
    AND (filter_rep_email IS NULL OR e.rep_email = filter_rep_email)
    AND EXISTS (
      SELECT 1
      FROM "Users"
      WHERE "Users".auth_id = auth.uid()
        AND "Users".account_id = e.account_id
    )
    AND 1 - (e.embedding <=> query_embedding) >= match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON TABLE "Coaching_Memory_Entries" IS 'Tenant-scoped coaching memory for notes, coaching, call summaries, and trend retrieval';
COMMENT ON FUNCTION search_coaching_memory IS 'Semantic search over tenant-scoped coaching memory';
