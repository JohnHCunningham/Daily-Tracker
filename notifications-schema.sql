-- Notifications System for Manager Coaching Messages
-- Add this to your existing Supabase database

-- ============================================
-- TABLE: Coaching_Messages
-- Stores messages sent from managers to reps
-- ============================================
CREATE TABLE IF NOT EXISTS "Coaching_Messages" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Who sent and who receives
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Message content
    subject VARCHAR(255) NOT NULL,
    message_body TEXT NOT NULL,

    -- Context (what triggered this coaching)
    related_metric VARCHAR(100), -- e.g., 'Upfront Contract', 'Pain Funnel', 'Talk Ratio'
    related_date DATE, -- Which day's performance triggered this
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'

    -- Message metadata
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: Notification_Preferences
-- User preferences for notifications
-- ============================================
CREATE TABLE IF NOT EXISTS "Notification_Preferences" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- Notification settings
    email_notifications BOOLEAN DEFAULT TRUE,
    browser_notifications BOOLEAN DEFAULT TRUE,
    daily_digest BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_coaching_messages_to_user ON "Coaching_Messages"(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_messages_from_user ON "Coaching_Messages"(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_messages_unread ON "Coaching_Messages"(to_user_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE "Coaching_Messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification_Preferences" ENABLE ROW LEVEL SECURITY;

-- Users can view messages sent TO them
CREATE POLICY "Users can view their received messages"
    ON "Coaching_Messages" FOR SELECT
    USING (auth.uid() = to_user_id);

-- Users can view messages sent FROM them (managers viewing sent messages)
CREATE POLICY "Users can view their sent messages"
    ON "Coaching_Messages" FOR SELECT
    USING (auth.uid() = from_user_id);

-- Managers can send messages to their team members
CREATE POLICY "Managers can send messages"
    ON "Coaching_Messages" FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

-- Users can update their own received messages (mark as read)
CREATE POLICY "Users can update their received messages"
    ON "Coaching_Messages" FOR UPDATE
    USING (auth.uid() = to_user_id);

-- Users can manage their own notification preferences
CREATE POLICY "Users can manage notification preferences"
    ON "Notification_Preferences" FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Update timestamp
-- ============================================
DROP TRIGGER IF EXISTS update_coaching_messages_updated_at ON "Coaching_Messages";
CREATE TRIGGER update_coaching_messages_updated_at
    BEFORE UPDATE ON "Coaching_Messages"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON "Notification_Preferences";
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON "Notification_Preferences"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Get unread message count
-- ============================================
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM "Coaching_Messages"
    WHERE to_user_id = auth.uid()
      AND is_read = FALSE
  );
END;
$$;

-- ============================================
-- FUNCTION: Mark message as read
-- ============================================
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "Coaching_Messages"
  SET
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE id = message_id
    AND to_user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- ============================================
-- FUNCTION: Mark all messages as read
-- ============================================
CREATE OR REPLACE FUNCTION mark_all_messages_as_read()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE "Coaching_Messages"
  SET
    is_read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE to_user_id = auth.uid()
    AND is_read = FALSE;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$;

-- ============================================
-- FUNCTION: Send coaching message
-- ============================================
CREATE OR REPLACE FUNCTION send_coaching_message(
  recipient_email TEXT,
  message_subject TEXT,
  message_body TEXT,
  metric_name TEXT DEFAULT NULL,
  performance_date DATE DEFAULT NULL,
  message_priority TEXT DEFAULT 'medium'
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  recipient_id UUID;
  new_message_id UUID;
BEGIN
  -- Get recipient user ID from email
  SELECT id INTO recipient_id
  FROM auth.users
  WHERE email = recipient_email;

  IF recipient_id IS NULL THEN
    RAISE EXCEPTION 'Recipient not found: %', recipient_email;
  END IF;

  -- Insert message
  INSERT INTO "Coaching_Messages" (
    from_user_id,
    to_user_id,
    subject,
    message_body,
    related_metric,
    related_date,
    priority
  ) VALUES (
    auth.uid(),
    recipient_id,
    message_subject,
    message_body,
    metric_name,
    performance_date,
    message_priority
  )
  RETURNING id INTO new_message_id;

  RETURN new_message_id;
END;
$$;

-- ============================================
-- VIEW: Recent Messages (for recipients)
-- ============================================
CREATE OR REPLACE VIEW "User_Messages" AS
SELECT
    m.id,
    m.subject,
    m.message_body,
    m.related_metric,
    m.related_date,
    m.priority,
    m.is_read,
    m.read_at,
    m.created_at,
    sender.email as from_email,
    sender.raw_user_meta_data->>'full_name' as from_name
FROM "Coaching_Messages" m
JOIN auth.users sender ON m.from_user_id = sender.id
WHERE m.to_user_id = auth.uid()
ORDER BY m.created_at DESC;

-- ============================================
-- VIEW: Sent Messages (for managers)
-- ============================================
CREATE OR REPLACE VIEW "Sent_Messages" AS
SELECT
    m.id,
    m.subject,
    m.message_body,
    m.related_metric,
    m.related_date,
    m.priority,
    m.is_read,
    m.read_at,
    m.created_at,
    recipient.email as to_email,
    recipient.raw_user_meta_data->>'full_name' as to_name
FROM "Coaching_Messages" m
JOIN auth.users recipient ON m.to_user_id = recipient.id
WHERE m.from_user_id = auth.uid()
ORDER BY m.created_at DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Notification system created!';
    RAISE NOTICE '   - Coaching_Messages (main storage)';
    RAISE NOTICE '   - Notification_Preferences (user settings)';
    RAISE NOTICE '   - get_unread_message_count() function';
    RAISE NOTICE '   - mark_message_as_read() function';
    RAISE NOTICE '   - send_coaching_message() function';
    RAISE NOTICE '   - User_Messages view (received messages)';
    RAISE NOTICE '   - Sent_Messages view (sent messages with read status)';
    RAISE NOTICE '';
    RAISE NOTICE '🔔 Ready to send and receive coaching notifications!';
END $$;
