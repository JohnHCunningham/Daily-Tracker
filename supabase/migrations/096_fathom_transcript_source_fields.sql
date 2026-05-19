-- Migration 096: Preserve Fathom transcript/manuscript source data.

ALTER TABLE IF EXISTS "Synced_Conversations"
  ADD COLUMN IF NOT EXISTS transcript_segments JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS transcript_source TEXT DEFAULT 'provider_transcript',
  ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS idx_synced_conversations_provider_metadata
  ON "Synced_Conversations" USING GIN (provider_metadata);
