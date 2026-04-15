-- ============================================
-- Team Settings - Shared Configuration
-- Manager sets this up once for the whole team
-- ============================================

CREATE TABLE IF NOT EXISTS "Team_Settings" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Sales Methodology (shared across team)
    methodology VARCHAR(50) DEFAULT 'Sandler',

    -- Ideal Customer Profile (shared)
    icp_industry TEXT[],
    icp_company_size VARCHAR(100),
    icp_decision_makers TEXT[],
    icp_budget_range VARCHAR(100),
    icp_pain_points TEXT[],

    -- Products/Services (shared)
    products JSONB DEFAULT '[]'::jsonb,

    -- Sales Scripts (shared)
    cold_call_script TEXT,
    discovery_script TEXT,
    objection_handling_script TEXT,
    closing_script TEXT,

    -- Activity Goals (shared defaults)
    default_daily_dials INTEGER DEFAULT 50,
    default_daily_conversations INTEGER DEFAULT 10,
    default_daily_meetings INTEGER DEFAULT 2,
    default_monthly_revenue_goal DECIMAL(10,2),

    -- Company Info
    company_name VARCHAR(255),
    company_website VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One settings per manager
    UNIQUE(manager_id)
);

-- RLS Policies
ALTER TABLE "Team_Settings" ENABLE ROW LEVEL SECURITY;

-- Managers can create their team settings
CREATE POLICY "Managers can create team settings"
ON "Team_Settings" FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = manager_id AND
    auth.jwt()->>'email' IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com', 'john@oneclickcoaching.com')
);

-- Managers can view their team settings
CREATE POLICY "Managers can view team settings"
ON "Team_Settings" FOR SELECT TO authenticated
USING (manager_id = auth.uid());

-- Team members can view their manager's settings
CREATE POLICY "Team members can view manager settings"
ON "Team_Settings" FOR SELECT TO authenticated
USING (
    manager_id IN (
        SELECT (raw_user_meta_data->>'manager_id')::UUID
        FROM auth.users
        WHERE id = auth.uid()
    )
);

-- Managers can update their team settings
CREATE POLICY "Managers can update team settings"
ON "Team_Settings" FOR UPDATE TO authenticated
USING (
    manager_id = auth.uid() AND
    auth.jwt()->>'email' IN ('john@oneclickcoaching.com', 'john@oneclickcoaching.com', 'john@oneclickcoaching.com')
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Team_Settings table created successfully!';
    RAISE NOTICE 'Managers can now configure team-wide settings.';
END $$;
