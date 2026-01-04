-- Daily Activities Table
-- Stores daily activity metrics for each team member
CREATE TABLE IF NOT EXISTS daily_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    calls_made INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    meetings_booked INTEGER DEFAULT 0,
    methodology_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, date)
);

-- Manager Feedback Table
-- Stores coaching notes from managers to team members
CREATE TABLE IF NOT EXISTS manager_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback_date DATE DEFAULT CURRENT_DATE,
    performance_vs_average TEXT,
    areas_of_improvement TEXT[],
    omissions TEXT[],
    recommendations TEXT[],
    goals_set TEXT[],
    full_message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User Goals Table
-- Stores individual goals for team members
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL, -- 'daily_calls', 'daily_emails', 'daily_meetings', 'methodology_score'
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'missed'
    created_by UUID REFERENCES auth.users(id), -- manager who set the goal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date ON daily_activities(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_manager_feedback_team_member ON manager_feedback(team_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_status ON user_goals(user_id, status);

-- Row Level Security Policies
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Daily Activities Policies
CREATE POLICY "Users can view own activities"
    ON daily_activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
    ON daily_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
    ON daily_activities FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team activities"
    ON daily_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = user_id
            AND auth.users.raw_user_meta_data->>'manager_id' = auth.uid()::text
        )
    );

-- Manager Feedback Policies
CREATE POLICY "Team members can view their feedback"
    ON manager_feedback FOR SELECT
    USING (auth.uid() = team_member_id);

CREATE POLICY "Managers can insert feedback for their team"
    ON manager_feedback FOR INSERT
    WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can view feedback they created"
    ON manager_feedback FOR SELECT
    USING (auth.uid() = manager_id);

-- User Goals Policies
CREATE POLICY "Users can view own goals"
    ON user_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team goals"
    ON user_goals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = user_id
            AND auth.users.raw_user_meta_data->>'manager_id' = auth.uid()::text
        )
    );

CREATE POLICY "Managers can insert team goals"
    ON user_goals FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Managers can update team goals"
    ON user_goals FOR UPDATE
    USING (auth.uid() = created_by);
