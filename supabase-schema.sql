-- AI Advantage Solutions Success Chart - Supabase Database Schema
-- Run this in your Supabase SQL Editor to create the tables

-- ============================================
-- TABLE: daily_stats
-- Tracks daily sales activity metrics
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    dials INTEGER DEFAULT 0 CHECK (dials >= 0),
    conversations INTEGER DEFAULT 0 CHECK (conversations >= 0),
    discovery_meetings INTEGER DEFAULT 0 CHECK (discovery_meetings >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: sales
-- Tracks individual sales and revenue
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    amount_cad DECIMAL(10, 2) NOT NULL CHECK (amount_cad >= 0),
    client_name VARCHAR(255),
    service_type VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: projects
-- Tracks project completions and milestones
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    start_date DATE NOT NULL,
    completion_date DATE,
    expected_completion_date DATE,
    revenue_cad DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: weekly_goals
-- Tracks weekly targets and achievements
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_start_date DATE NOT NULL UNIQUE,
    target_dials INTEGER DEFAULT 50,
    target_conversations INTEGER DEFAULT 15,
    target_meetings INTEGER DEFAULT 5,
    target_sales INTEGER DEFAULT 2,
    target_revenue_cad DECIMAL(10, 2) DEFAULT 5000,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: coaching_insights
-- Stores AI-generated coaching and insights
-- ============================================
CREATE TABLE IF NOT EXISTS coaching_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    insight_type VARCHAR(50), -- 'performance', 'suggestion', 'milestone', 'alert'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_projects_completion ON projects(completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_date ON coaching_insights(date DESC, is_read);

-- ============================================
-- TRIGGER: Update timestamp on row update
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_stats_updated_at
    BEFORE UPDATE ON daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS for multi-user support (optional)
-- ============================================
-- Uncomment if you want to enable RLS
-- ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE coaching_insights ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VIEWS for analytics
-- ============================================

-- View: Weekly performance summary
CREATE OR REPLACE VIEW weekly_performance AS
SELECT
    DATE_TRUNC('week', date) as week_start,
    SUM(dials) as total_dials,
    SUM(conversations) as total_conversations,
    SUM(discovery_meetings) as total_meetings,
    ROUND(AVG(CASE WHEN dials > 0 THEN (conversations::DECIMAL / dials) * 100 ELSE 0 END), 2) as conversation_rate,
    ROUND(AVG(CASE WHEN conversations > 0 THEN (discovery_meetings::DECIMAL / conversations) * 100 ELSE 0 END), 2) as meeting_rate
FROM daily_stats
GROUP BY week_start
ORDER BY week_start DESC;

-- View: Sales revenue summary
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
    DATE_TRUNC('month', date) as month,
    COUNT(*) as total_sales,
    SUM(amount_cad) as total_revenue,
    AVG(amount_cad) as avg_sale_value,
    MAX(amount_cad) as largest_sale
FROM sales
GROUP BY month
ORDER BY month DESC;

-- View: Conversion funnel metrics
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT
    SUM(dials) as total_dials,
    SUM(conversations) as total_conversations,
    SUM(discovery_meetings) as total_meetings,
    (SELECT COUNT(*) FROM sales) as total_sales,
    (SELECT SUM(amount_cad) FROM sales) as total_revenue,
    CASE
        WHEN SUM(dials) > 0 THEN ROUND((SUM(conversations)::DECIMAL / SUM(dials)) * 100, 2)
        ELSE 0
    END as dial_to_conversation_rate,
    CASE
        WHEN SUM(conversations) > 0 THEN ROUND((SUM(discovery_meetings)::DECIMAL / SUM(conversations)) * 100, 2)
        ELSE 0
    END as conversation_to_meeting_rate,
    CASE
        WHEN SUM(discovery_meetings) > 0 THEN ROUND(((SELECT COUNT(*) FROM sales)::DECIMAL / SUM(discovery_meetings)) * 100, 2)
        ELSE 0
    END as meeting_to_sale_rate
FROM daily_stats;
