# 🔔 Notification System Setup Guide

## Overview
The notification system allows managers to send coaching messages to team members, who receive instant in-app notifications.

## ✅ What's Included

### 1. **Database Schema** (`notifications-schema.sql`)
- `Coaching_Messages` table - stores all messages
- `Notification_Preferences` table - user notification settings
- Helper functions for sending and reading messages
- Row Level Security (RLS) policies for data privacy

### 2. **User Dashboard** (`index.html`)
- 🔔 Notification bell in header with unread badge
- Notification panel to view messages
- Auto-polling every 30 seconds for new messages
- Mark messages as read/unread
- Priority indicators (High/Medium/Low)

### 3. **Manager Interface** (`send-coaching-message.html`)
- Send coaching messages to team members
- Pre-populated with AI coaching insights
- Priority levels and metric tagging
- URL parameters for auto-filling from manager dashboard

---

## 📋 Setup Instructions

### Step 1: Run the Database Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `notifications-schema.sql`
4. Click **Run** to execute

This will create:
- ✅ Two new tables (`Coaching_Messages`, `Notification_Preferences`)
- ✅ Four functions (`get_unread_message_count`, `mark_message_as_read`, `mark_all_messages_as_read`, `send_coaching_message`)
- ✅ One view (`User_Messages`)
- ✅ RLS policies for security
- ✅ Indexes for performance

### Step 2: Update Supabase Config in send-coaching-message.html

Open `send-coaching-message.html` and update lines 184-185:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your actual Supabase URL and anon key (same as in index.html).

### Step 3: Test the System

1. **As a user (rep):**
   - Open `index.html`
   - Look for the 🔔 bell icon in the header
   - Bell should show with no badge initially (no messages)

2. **As a manager:**
   - Open `send-coaching-message.html`
   - Fill in:
     - Recipient email (a test user)
     - Subject: "Test Coaching Message"
     - Message body
     - Optional: Select a metric and priority
   - Click **Send Message**

3. **Back as the user (rep):**
   - Refresh the page or wait 30 seconds
   - Bell should show a red badge with "1"
   - Click the bell to open the notification panel
   - Click the message to view it
   - Message will be marked as read automatically

---

## 🎯 How Managers Use It

### Option 1: Manual Send (Current)
1. Manager reviews team insights in `admin-team.html`
2. Sees AI-generated coaching message
3. Copies the message
4. Opens `send-coaching-message.html`
5. Pastes message and sends

### Option 2: Direct Integration (Future Enhancement)
Add a "Send This Message" button in the manager dashboard that:
- Opens `send-coaching-message.html` with pre-filled data
- Uses URL parameters like:
  ```
  send-coaching-message.html?recipient=rep@example.com&subject=Pain%20Funnel%20Coaching&message=Hey%20John...&metric=Pain%20Funnel&priority=high
  ```

### Example Integration Code for Manager Dashboard:
```javascript
function sendCoachingMessage(repEmail, subject, messageBody, metric, priority) {
    const params = new URLSearchParams({
        recipient: repEmail,
        subject: subject,
        message: messageBody,
        metric: metric,
        priority: priority
    });

    window.open(`send-coaching-message.html?${params.toString()}`, '_blank');
}
```

---

## 🔧 Customization Options

### Adjust Polling Frequency
In `index.html`, find this code (around line 1580):

```javascript
// Poll for new messages every 30 seconds
setInterval(() => {
    if (currentUser) {
        fetchUnreadCount();
    }
}, 30000); // 30000 = 30 seconds
```

Change `30000` to any value in milliseconds:
- 15 seconds: `15000`
- 1 minute: `60000`
- 5 minutes: `300000`

### Add Email Notifications
Currently, notifications are in-app only. To add email notifications:

1. Set up Supabase Edge Function or webhook
2. Trigger on INSERT to `Coaching_Messages` table
3. Use Supabase's email service or SendGrid/Mailgun
4. Check user's `email_notifications` preference first

### Customize Message Display
In `index.html`, function `displayMessages()` controls how messages appear. You can modify:
- Colors for different priorities
- Message preview length (currently 150 characters)
- Date/time format
- Additional fields to display

---

## 📊 Database Schema Details

### Coaching_Messages Table
```sql
- id (UUID) - Unique message ID
- from_user_id (UUID) - Who sent it (manager)
- to_user_id (UUID) - Who receives it (rep)
- subject (VARCHAR) - Message subject line
- message_body (TEXT) - Full message content
- related_metric (VARCHAR) - Which metric triggered this (optional)
- related_date (DATE) - Which performance date (optional)
- priority (VARCHAR) - high/medium/low
- is_read (BOOLEAN) - Read status
- read_at (TIMESTAMP) - When marked as read
- created_at (TIMESTAMP) - When sent
```

### Functions Available

**`get_unread_message_count()`**
- Returns: INTEGER count of unread messages
- Used by: Notification badge

**`mark_message_as_read(message_id UUID)`**
- Marks single message as read
- Returns: BOOLEAN success

**`mark_all_messages_as_read()`**
- Marks all user's messages as read
- Returns: INTEGER count of messages marked

**`send_coaching_message(recipient_email, message_subject, message_body, metric_name, performance_date, message_priority)`**
- Sends a new coaching message
- Returns: UUID of new message
- Throws error if recipient not found

---

## 🔐 Security Features

1. **Row Level Security (RLS)**
   - Users can only see their own received messages
   - Users can only see messages they sent
   - Can't view other people's messages

2. **Authentication Required**
   - All functions use `auth.uid()`
   - Must be logged in to send/receive messages

3. **Data Privacy**
   - Messages deleted when user account deleted (CASCADE)
   - No sensitive data in logs

---

## 🐛 Troubleshooting

### "Notification bell not appearing"
- Check that `addLogoutButton()` function runs on page load
- Verify user is authenticated
- Check browser console for errors

### "No messages showing but badge shows count"
- Check RLS policies are active
- Verify `User_Messages` view query is correct
- Check user email matches recipient email in database

### "Can't send messages"
- Verify recipient email exists in `auth.users` table
- Check Supabase function has `SECURITY DEFINER` set
- Verify sender is authenticated

### "Messages not updating in real-time"
- Polling is set to 30 seconds by default
- Refresh page manually to force update
- Consider implementing Supabase Realtime subscriptions for instant updates

---

## 🚀 Future Enhancements

1. **Real-time Updates** - Use Supabase Realtime instead of polling
2. **Email Notifications** - Send email when message received
3. **Push Notifications** - Browser push notifications
4. **Message Replies** - Allow reps to respond to coaching
5. **Message Archive** - Move old messages to archive
6. **Rich Text** - Support markdown or HTML in messages
7. **Attachments** - Allow managers to attach files
8. **Templates** - Save frequently used coaching messages
9. **Analytics** - Track which messages get read, response times
10. **Integration** - Auto-send from AI insights without manual copy/paste

---

## 📞 Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify all tables and functions were created successfully
4. Test with a simple message first before integrating with AI coaching

---

Made with ❤️ for AI Advantage Solutions
