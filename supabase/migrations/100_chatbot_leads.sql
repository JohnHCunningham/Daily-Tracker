-- ============================================
-- MIGRATION 100: Chatbot Leads Table
-- ============================================

CREATE TABLE IF NOT EXISTS chatbot_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Lead information
    name TEXT,
    email TEXT,
    company TEXT,
    team_size TEXT,
    methodology TEXT,
    pain_point TEXT,

    -- Conversation history
    conversation JSONB,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS chatbot_leads_email_idx ON chatbot_leads (email);
CREATE INDEX IF NOT EXISTS chatbot_leads_created_at_idx ON chatbot_leads (created_at DESC);

-- Enable RLS
ALTER TABLE chatbot_leads ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage leads
DROP POLICY IF EXISTS "Allow service role to manage chatbot leads" ON chatbot_leads;
CREATE POLICY "Allow service role to manage chatbot leads"
ON chatbot_leads
FOR ALL
USING (auth.role() = 'service_role');

-- Allow authenticated users to insert leads (for API)
DROP POLICY IF EXISTS "Allow insert chatbot leads" ON chatbot_leads;
CREATE POLICY "Allow insert chatbot leads"
ON chatbot_leads
FOR INSERT
WITH CHECK (true);

-- Comment
COMMENT ON TABLE chatbot_leads IS 'Stores leads captured from the website chatbot';
