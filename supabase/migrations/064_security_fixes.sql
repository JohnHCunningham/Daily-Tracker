-- Migration 064: Security fixes for Supabase linter
-- Fixes: 1 error (RLS disabled) + 9 warnings (search_path, permissive policy, extension)

-- Ensure vector type is available
SET search_path TO public, extensions;

-- ============================================
-- ERROR FIX: Enable RLS on Pipeline_Runs
-- ============================================
ALTER TABLE "Pipeline_Runs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage pipeline runs"
  ON "Pipeline_Runs" FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Leaders can view pipeline runs"
  ON "Pipeline_Runs" FOR SELECT
  USING (true);

-- ============================================
-- WARNING FIXES: Set search_path on functions
-- These are the overloads from migration 034 that lack search_path
-- ============================================

-- Fix cache_embedding (034 signature: TEXT, TEXT, vector(1536), TEXT)
CREATE OR REPLACE FUNCTION cache_embedding(
    input_hash TEXT,
    input_text TEXT,
    input_embedding vector(1536),
    input_model TEXT DEFAULT 'text-embedding-3-small'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO "Embedding_Cache" (text_hash, original_text, embedding, model)
    VALUES (input_hash, input_text, input_embedding, input_model)
    ON CONFLICT (text_hash)
    DO UPDATE SET
        hit_count = "Embedding_Cache".hit_count + 1,
        last_accessed_at = NOW();
END;
$$;

-- Fix search_sandler_content (034 signature: vector(1536), FLOAT, INT, TEXT[], TEXT[], TEXT[], TEXT[])
CREATE OR REPLACE FUNCTION search_sandler_content(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    filter_content_types TEXT[] DEFAULT NULL,
    filter_components TEXT[] DEFAULT NULL,
    filter_weakness_tags TEXT[] DEFAULT NULL,
    filter_situation_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content_type TEXT,
    component_name TEXT,
    chunk_title TEXT,
    chunk_text TEXT,
    situation_tags TEXT[],
    weakness_tags TEXT[],
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.content_type,
        kb.component_name,
        kb.chunk_title,
        kb.chunk_text,
        kb.situation_tags,
        kb.weakness_tags,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM "Sandler_Knowledge_Base" kb
    WHERE
        kb.is_active = TRUE
        AND (filter_content_types IS NULL OR kb.content_type = ANY(filter_content_types))
        AND (filter_components IS NULL OR kb.component_name = ANY(filter_components))
        AND (filter_weakness_tags IS NULL OR kb.weakness_tags && filter_weakness_tags)
        AND (filter_situation_tags IS NULL OR kb.situation_tags && filter_situation_tags)
        AND 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Fix find_scripts_for_weakness (034 signature: TEXT, INT)
CREATE OR REPLACE FUNCTION find_scripts_for_weakness(
    weak_component TEXT,
    limit_count INT DEFAULT 3
)
RETURNS TABLE (
    chunk_title TEXT,
    chunk_text TEXT,
    situation_tags TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.chunk_title,
        kb.chunk_text,
        kb.situation_tags
    FROM "Sandler_Knowledge_Base" kb
    WHERE
        kb.is_active = TRUE
        AND kb.content_type = 'script'
        AND (
            kb.component_name = weak_component
            OR weak_component = ANY(kb.weakness_tags)
        )
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$;

-- Fix update_goal_progress (trigger function, no args)
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix update_users_updated_at (trigger function, no args)
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix create_manager_note (052 signature: UUID, TEXT)
CREATE OR REPLACE FUNCTION create_manager_note(p_rep_id UUID, p_note TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO "Manager_Notes" (rep_id, note) VALUES (p_rep_id, p_note) RETURNING id INTO v_id;
    RETURN v_id;
END $func$;

-- Fix create_user_goal (052 signature: TEXT, INT)
CREATE OR REPLACE FUNCTION create_user_goal(p_goal_type TEXT, p_target_value INT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO "user_goals" (user_id, goal_type, target_value)
    VALUES (auth.uid(), p_goal_type, p_target_value)
    RETURNING id INTO v_id;
    RETURN v_id;
END $func$;

-- ============================================
-- WARNING FIX: Tighten Coaching_Suggestions_Log INSERT policy
-- ============================================
DROP POLICY IF EXISTS "System can insert coaching suggestions" ON "Coaching_Suggestions_Log";

CREATE POLICY "Service role can insert coaching suggestions"
  ON "Coaching_Suggestions_Log" FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- WARNING FIX: Move pg_net to extensions schema
-- ============================================
DO $$
BEGIN
  CREATE SCHEMA IF NOT EXISTS extensions;
  ALTER EXTENSION pg_net SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not move pg_net to extensions schema: %. Non-critical.', SQLERRM;
END;
$$;
