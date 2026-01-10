-- ============================================
-- COMPLETE DEMO SETUP - RUN THIS ONE FILE
-- Sets up tables + adds demo data + creates manager account
-- ============================================

-- Create update function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create daily_stats table
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    dials INTEGER DEFAULT 0 CHECK (dials >= 0),
    conversations INTEGER DEFAULT 0 CHECK (conversations >= 0),
    discovery_meetings INTEGER DEFAULT 0 CHECK (discovery_meetings >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    amount_cad DECIMAL(10, 2) NOT NULL CHECK (amount_cad >= 0),
    client_name VARCHAR(255),
    service_type VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weekly_goals table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date DESC);

-- Create triggers
DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_stats;
CREATE TRIGGER update_daily_stats_updated_at
    BEFORE UPDATE ON daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADD DEMO DATA
-- ============================================

-- Add daily activity for last 7 days
INSERT INTO daily_stats (date, dials, conversations, discovery_meetings)
VALUES
    (CURRENT_DATE - 1, 25, 8, 3),
    (CURRENT_DATE - 2, 30, 10, 4),
    (CURRENT_DATE - 3, 20, 6, 2),
    (CURRENT_DATE - 4, 28, 9, 3),
    (CURRENT_DATE - 5, 22, 7, 2),
    (CURRENT_DATE - 6, 26, 8, 3),
    (CURRENT_DATE - 7, 24, 7, 2)
ON CONFLICT (date) DO UPDATE SET
    dials = EXCLUDED.dials,
    conversations = EXCLUDED.conversations,
    discovery_meetings = EXCLUDED.discovery_meetings;

-- Add some sales
INSERT INTO sales (date, amount_cad, client_name, service_type)
VALUES
    (CURRENT_DATE - 1, 15000.00, 'TechCorp Solutions', 'Sales Coaching Platform'),
    (CURRENT_DATE - 2, 25000.00, 'Growth Dynamics', 'AI Sales Training'),
    (CURRENT_DATE - 4, 12000.00, 'Innovate Inc', 'Sales Coaching Platform'),
    (CURRENT_DATE - 5, 18000.00, 'Momentum Sales', 'Team Performance System');

-- Add weekly goal
INSERT INTO weekly_goals (week_start_date, target_dials, target_conversations, target_meetings, target_sales, target_revenue_cad)
VALUES
    (date_trunc('week', CURRENT_DATE)::DATE, 150, 50, 20, 10, 100000)
ON CONFLICT (week_start_date) DO UPDATE SET
    target_dials = EXCLUDED.target_dials,
    target_conversations = EXCLUDED.target_conversations,
    target_meetings = EXCLUDED.target_meetings;

-- ============================================
-- CONFIRM USER ACCOUNT
-- ============================================

-- Force confirm your email
UPDATE auth.users
SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email = 'john@aiadvantagesolutions.ca';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅✅✅ DEMO SETUP COMPLETE! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tables created: daily_stats, sales, weekly_goals';
    RAISE NOTICE '📈 Demo data added: 7 days of activity + 4 sales';
    RAISE NOTICE '✅ Your account confirmed';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NOW: Go to login.html and log in!';
    RAISE NOTICE '   Email: john@aiadvantagesolutions.ca';
    RAISE NOTICE '   Password: (your password)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ready for your 6 PM demo!';
END $$;
