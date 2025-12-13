-- ============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================
-- This file enables Row Level Security on all tables
-- and creates policies for secure data access.
--
-- IMPORTANT: Run this in your Supabase SQL Editor
-- ============================================

-- Enable RLS on all main tables
ALTER TABLE Daily_Tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE Sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE Revenue_Summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE Weekly_Performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE Conversion_Funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE Recent_Conversation_Performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE Conversation_Analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE Email_Tracking ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES FOR Daily_Tracker
-- ============================================

-- Allow authenticated users to read their own data
CREATE POLICY "Users can view their own daily tracker data"
ON Daily_Tracker
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert their own data
CREATE POLICY "Users can insert their own daily tracker data"
ON Daily_Tracker
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update their own daily tracker data"
ON Daily_Tracker
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete their own data
CREATE POLICY "Users can delete their own daily tracker data"
ON Daily_Tracker
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- POLICIES FOR Sales
-- ============================================

CREATE POLICY "Users can view sales data"
ON Sales
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert sales data"
ON Sales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update sales data"
ON Sales
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete sales data"
ON Sales
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- POLICIES FOR Revenue_Summary (VIEW)
-- ============================================

CREATE POLICY "Users can view revenue summary"
ON Revenue_Summary
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- POLICIES FOR Weekly_Performance (VIEW)
-- ============================================

CREATE POLICY "Users can view weekly performance"
ON Weekly_Performance
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- POLICIES FOR Conversion_Funnel (VIEW)
-- ============================================

CREATE POLICY "Users can view conversion funnel"
ON Conversion_Funnel
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- POLICIES FOR Recent_Conversation_Performance (VIEW)
-- ============================================

CREATE POLICY "Users can view recent conversation performance"
ON Recent_Conversation_Performance
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- POLICIES FOR Conversation_Analyses
-- ============================================

CREATE POLICY "Users can view conversation analyses"
ON Conversation_Analyses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert conversation analyses"
ON Conversation_Analyses
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update conversation analyses"
ON Conversation_Analyses
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete conversation analyses"
ON Conversation_Analyses
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- POLICIES FOR Email_Tracking
-- ============================================

CREATE POLICY "Users can view email tracking data"
ON Email_Tracking
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert email tracking data"
ON Email_Tracking
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update email tracking data"
ON Email_Tracking
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete email tracking data"
ON Email_Tracking
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- ANON KEY POLICIES (for public demo access)
-- ============================================
-- OPTIONAL: If you want to allow unauthenticated users
-- to read sample data, uncomment these policies.
-- This is useful for demo purposes but should be
-- removed for production deployments.

-- Example: Allow public read access to Revenue_Summary
-- CREATE POLICY "Public can view revenue summary"
-- ON Revenue_Summary
-- FOR SELECT
-- TO anon
-- USING (true);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

-- Run this query to verify RLS is enabled on all tables:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- Expected result: All your tables should show rowsecurity = true
