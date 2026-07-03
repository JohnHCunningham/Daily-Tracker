-- ============================================
-- MIGRATION 098: Methodology-Agnostic Knowledge Base
-- APPLIED 2026-05-26
-- ============================================
-- Steps 1-3: Table changes (safe, backward-compatible)
-- Steps 4-5: Function rewrites (uses LANGUAGE sql to avoid $$ escaping issues)
-- ============================================

-- STEP 1: Add methodology column
ALTER TABLE "Sandler_Knowledge_Base"
ADD COLUMN IF NOT EXISTS methodology TEXT NOT NULL DEFAULT 'sandler';

-- STEP 2: Update existing rows
UPDATE "Sandler_Knowledge_Base" SET methodology = 'sandler' WHERE methodology IS NULL;

-- STEP 3: Add index
CREATE INDEX IF NOT EXISTS sandler_kb_methodology_idx ON "Sandler_Knowledge_Base" (methodology);

-- STEP 4: Drop old search functions
DROP FUNCTION IF EXISTS search_sandler_content(vector, INT);
DROP FUNCTION IF EXISTS search_sandler_content(vector, INT, TEXT[]);
DROP FUNCTION IF EXISTS search_sandler_content(vector, FLOAT, INT);
DROP FUNCTION IF EXISTS search_sandler_content(vector, FLOAT, INT, TEXT[], TEXT[], TEXT[], TEXT[]);

-- STEP 4 (continued): Create methodology-aware search
CREATE OR REPLACE FUNCTION search_sandler_content(
    query_embedding extensions.vector,
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    filter_content_types TEXT[] DEFAULT NULL,
    filter_components TEXT[] DEFAULT NULL,
    filter_weakness_tags TEXT[] DEFAULT NULL,
    filter_situation_tags TEXT[] DEFAULT NULL,
    filter_methodology TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content_type TEXT,
    component_name TEXT,
    chunk_title TEXT,
    chunk_text TEXT,
    situation_tags TEXT[],
    weakness_tags TEXT[],
    similarity FLOAT,
    methodology TEXT
)
LANGUAGE sql
AS '
    SELECT
        kb.id,
        kb.content_type,
        kb.component_name,
        kb.chunk_title,
        kb.chunk_text,
        kb.situation_tags,
        kb.weakness_tags,
        (1 - (kb.embedding <=> query_embedding))::FLOAT AS similarity,
        kb.methodology
    FROM "Sandler_Knowledge_Base" kb
    WHERE kb.is_active = TRUE
        AND (filter_methodology IS NULL OR kb.methodology = filter_methodology)
        AND (filter_content_types IS NULL OR kb.content_type = ANY(filter_content_types))
        AND (filter_components IS NULL OR kb.component_name = ANY(filter_components))
        AND (filter_weakness_tags IS NULL OR kb.weakness_tags && filter_weakness_tags)
        AND (filter_situation_tags IS NULL OR kb.situation_tags && filter_situation_tags)
        AND (kb.embedding <=> query_embedding) < (1 - match_threshold)
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
';

-- STEP 5: Update find_scripts_for_weakness
DROP FUNCTION IF EXISTS find_scripts_for_weakness(TEXT, INT);

CREATE OR REPLACE FUNCTION find_scripts_for_weakness(
    weak_component TEXT,
    limit_count INT DEFAULT 3,
    filter_methodology TEXT DEFAULT NULL
)
RETURNS TABLE (
    chunk_title TEXT,
    chunk_text TEXT,
    situation_tags TEXT[],
    methodology TEXT
)
LANGUAGE sql
AS '
    SELECT
        kb.chunk_title,
        kb.chunk_text,
        kb.situation_tags,
        kb.methodology
    FROM "Sandler_Knowledge_Base" kb
    WHERE kb.content_type IN (''script'', ''manager_approved'', ''best_practice'')
        AND (filter_methodology IS NULL OR kb.methodology = filter_methodology)
        AND (
            kb.component_name ILIKE ''%'' || weak_component || ''%''
            OR weak_component = ANY(kb.weakness_tags)
            OR kb.chunk_title ILIKE ''%'' || weak_component || ''%''
        )
        AND kb.is_active = TRUE
    ORDER BY kb.chunk_index
    LIMIT limit_count;
';
