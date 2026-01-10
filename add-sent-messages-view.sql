-- ============================================
-- ADD SENT MESSAGES VIEW FOR MANAGERS
-- Run this to add read receipt tracking for managers
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
