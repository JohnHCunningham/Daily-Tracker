-- ============================================
-- User Settings Persistence Table
-- Stores all user setup data for cross-device/cross-URL persistence
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- ICP (Ideal Customer Profile)
    icp JSONB,

    -- Sales Scripts
    sales_scripts JSONB,

    -- Activity Goals
    activity_goals JSONB,

    -- Selected Methodology
    selected_methodology TEXT,

    -- Monthly Quota
    monthly_quota INTEGER,

    -- Fireflies Integration
    fireflies_api_key TEXT,

    -- Additional metadata
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_synced_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_settings_timestamp_trigger ON user_settings;
CREATE TRIGGER update_user_settings_timestamp_trigger
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

-- Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own settings
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can view all settings (for debugging/support)
CREATE POLICY "Admins can view all settings"
    ON user_settings FOR SELECT
    USING (
        auth.jwt()->>'email' IN (
            'admin@aiadvantagesolutions.com',
            'admin@aiadvantagesolutions.ca',
            'john@aiadvantagesolutions.com',
            'john@aiadvantagesolutions.ca'
        )
    );

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ User Settings Persistence Table Created!';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  - Stores ICP, sales scripts, activity goals, methodology, quota';
    RAISE NOTICE '  - Prevents data loss across URL changes and deployments';
    RAISE NOTICE '  - RLS enabled: users can only access their own data';
    RAISE NOTICE '  - Auto-updates last_synced_at timestamp';
    RAISE NOTICE '';
    RAISE NOTICE '⏭️  NEXT: Update index.html to sync with this table';
    RAISE NOTICE '';
END $$;
