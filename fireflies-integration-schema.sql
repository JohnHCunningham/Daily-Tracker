-- ============================================
-- FIREFLIES.AI INTEGRATION
-- Automatic transcript sync with zero friction
-- ============================================

-- ============================================
-- TABLE: Fireflies_Settings
-- Store Fireflies API credentials per account
-- ============================================
CREATE TABLE IF NOT EXISTS "Fireflies_Settings" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,

    -- Fireflies API credentials
    api_key TEXT NOT NULL,

    -- Sync settings
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency_minutes INTEGER DEFAULT 30, -- Check every 30 minutes
    last_sync_at TIMESTAMP WITH TIME ZONE,

    -- Filter settings
    sync_only_user_meetings BOOLEAN DEFAULT TRUE, -- Only sync meetings user attended
    min_duration_minutes INTEGER DEFAULT 5, -- Skip very short calls

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One setting per account
    UNIQUE(account_id)
);

-- ============================================
-- TABLE: Fireflies_Synced_Transcripts
-- Track which Fireflies transcripts have been synced
-- ============================================
CREATE TABLE IF NOT EXISTS "Fireflies_Synced_Transcripts" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Link to account and conversation analysis
    account_id UUID NOT NULL REFERENCES "Accounts"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_analysis_id UUID REFERENCES "Conversation_Analyses"(id) ON DELETE SET NULL,

    -- Fireflies data
    fireflies_transcript_id TEXT NOT NULL, -- Fireflies unique ID
    fireflies_meeting_id TEXT NOT NULL,
    meeting_title TEXT,
    meeting_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    participants TEXT[], -- Array of participant names/emails

    -- Sync status
    sync_status VARCHAR(50) DEFAULT 'synced', -- 'synced', 'analyzing', 'analyzed', 'failed'
    sync_error TEXT,

    -- Timestamps
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE,

    -- Prevent duplicate syncs
    UNIQUE(account_id, fireflies_transcript_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_fireflies_settings_account ON "Fireflies_Settings"(account_id);
CREATE INDEX IF NOT EXISTS idx_fireflies_synced_account ON "Fireflies_Synced_Transcripts"(account_id, synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_fireflies_synced_status ON "Fireflies_Synced_Transcripts"(sync_status);
CREATE INDEX IF NOT EXISTS idx_fireflies_synced_user ON "Fireflies_Synced_Transcripts"(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE "Fireflies_Settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fireflies_Synced_Transcripts" ENABLE ROW LEVEL SECURITY;

-- Managers can manage Fireflies settings for their account
CREATE POLICY "Managers can manage Fireflies settings"
    ON "Fireflies_Settings" FOR ALL
    USING (
        account_id IN (
            SELECT account_id FROM "User_Roles"
            WHERE user_id = auth.uid() AND role = 'manager'
        )
    );

-- Users can view synced transcripts from their account
CREATE POLICY "Users can view their synced transcripts"
    ON "Fireflies_Synced_Transcripts" FOR SELECT
    USING (
        user_id = auth.uid() OR
        account_id IN (
            SELECT account_id FROM "User_Roles"
            WHERE user_id = auth.uid()
        )
    );

-- System can insert synced transcripts (via service key)
CREATE POLICY "System can insert synced transcripts"
    ON "Fireflies_Synced_Transcripts" FOR INSERT
    WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_fireflies_settings_updated_at ON "Fireflies_Settings";
CREATE TRIGGER update_fireflies_settings_updated_at
    BEFORE UPDATE ON "Fireflies_Settings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Save Fireflies API key
-- ============================================
CREATE OR REPLACE FUNCTION save_fireflies_api_key(
    api_key_input TEXT,
    auto_sync BOOLEAN DEFAULT TRUE
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_account_id UUID;
    setting_id UUID;
BEGIN
    -- Get user's account
    SELECT account_id INTO user_account_id
    FROM "User_Roles"
    WHERE user_id = auth.uid() AND role = 'manager'
    LIMIT 1;

    IF user_account_id IS NULL THEN
        RAISE EXCEPTION 'Only managers can configure Fireflies integration';
    END IF;

    -- Upsert settings
    INSERT INTO "Fireflies_Settings" (
        account_id,
        api_key,
        auto_sync_enabled
    ) VALUES (
        user_account_id,
        api_key_input,
        auto_sync
    )
    ON CONFLICT (account_id)
    DO UPDATE SET
        api_key = api_key_input,
        auto_sync_enabled = auto_sync,
        updated_at = NOW()
    RETURNING id INTO setting_id;

    RETURN setting_id;
END;
$$;

-- ============================================
-- FUNCTION: Get Fireflies settings
-- ============================================
CREATE OR REPLACE FUNCTION get_fireflies_settings()
RETURNS TABLE (
    api_key TEXT,
    auto_sync_enabled BOOLEAN,
    sync_frequency_minutes INTEGER,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    total_synced INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_account_id UUID;
BEGIN
    -- Get user's account
    SELECT account_id INTO user_account_id
    FROM "User_Roles"
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF user_account_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        fs.api_key,
        fs.auto_sync_enabled,
        fs.sync_frequency_minutes,
        fs.last_sync_at,
        COUNT(fst.id)::INTEGER as total_synced
    FROM "Fireflies_Settings" fs
    LEFT JOIN "Fireflies_Synced_Transcripts" fst ON fst.account_id = fs.account_id
    WHERE fs.account_id = user_account_id
    GROUP BY fs.id, fs.api_key, fs.auto_sync_enabled, fs.sync_frequency_minutes, fs.last_sync_at;
END;
$$;

-- ============================================
-- FUNCTION: Record synced transcript
-- Called by backend when transcript is synced
-- ============================================
CREATE OR REPLACE FUNCTION record_fireflies_sync(
    user_email TEXT,
    fireflies_transcript_id_input TEXT,
    fireflies_meeting_id_input TEXT,
    meeting_title_input TEXT,
    meeting_date_input TIMESTAMP WITH TIME ZONE,
    duration_minutes_input INTEGER,
    participants_input TEXT[],
    conversation_analysis_id_input UUID DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    target_user_id UUID;
    target_account_id UUID;
    sync_record_id UUID;
BEGIN
    -- Get user ID and account
    SELECT u.id, ur.account_id INTO target_user_id, target_account_id
    FROM auth.users u
    JOIN "User_Roles" ur ON u.id = ur.user_id
    WHERE u.email = user_email
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_email;
    END IF;

    -- Insert sync record
    INSERT INTO "Fireflies_Synced_Transcripts" (
        account_id,
        user_id,
        conversation_analysis_id,
        fireflies_transcript_id,
        fireflies_meeting_id,
        meeting_title,
        meeting_date,
        duration_minutes,
        participants,
        sync_status
    ) VALUES (
        target_account_id,
        target_user_id,
        conversation_analysis_id_input,
        fireflies_transcript_id_input,
        fireflies_meeting_id_input,
        meeting_title_input,
        meeting_date_input,
        duration_minutes_input,
        participants_input,
        CASE WHEN conversation_analysis_id_input IS NOT NULL THEN 'analyzed' ELSE 'synced' END
    )
    ON CONFLICT (account_id, fireflies_transcript_id)
    DO UPDATE SET
        conversation_analysis_id = conversation_analysis_id_input,
        sync_status = CASE WHEN conversation_analysis_id_input IS NOT NULL THEN 'analyzed' ELSE 'synced' END,
        analyzed_at = CASE WHEN conversation_analysis_id_input IS NOT NULL THEN NOW() ELSE NULL END
    RETURNING id INTO sync_record_id;

    RETURN sync_record_id;
END;
$$;

-- ============================================
-- VIEW: Recent Fireflies Syncs
-- ============================================
CREATE OR REPLACE VIEW "Recent_Fireflies_Syncs" AS
SELECT
    fst.id,
    fst.meeting_title,
    fst.meeting_date,
    fst.duration_minutes,
    fst.participants,
    fst.sync_status,
    fst.synced_at,
    fst.analyzed_at,
    u.email as user_email,
    u.raw_user_meta_data->>'full_name' as user_name,
    ca.overall_sandler_score as analysis_score
FROM "Fireflies_Synced_Transcripts" fst
JOIN auth.users u ON fst.user_id = u.id
LEFT JOIN "Conversation_Analyses" ca ON fst.conversation_analysis_id = ca.id
WHERE fst.account_id IN (
    SELECT account_id FROM "User_Roles" WHERE user_id = auth.uid()
)
ORDER BY fst.synced_at DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Fireflies Integration Created!';
    RAISE NOTICE '   - Fireflies_Settings table';
    RAISE NOTICE '   - Fireflies_Synced_Transcripts table';
    RAISE NOTICE '   - save_fireflies_api_key() function';
    RAISE NOTICE '   - get_fireflies_settings() function';
    RAISE NOTICE '   - record_fireflies_sync() function';
    RAISE NOTICE '   - Recent_Fireflies_Syncs view';
    RAISE NOTICE '';
    RAISE NOTICE '🔥 Automatic transcript sync ready!';
    RAISE NOTICE '📝 Add your Fireflies API key to enable auto-sync';
END $$;
