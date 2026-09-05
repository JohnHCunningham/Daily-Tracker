# Unified CRM: 1-Click Outreach Implementation Plan

## Goal
Click a prospect → see 1-3 auto-filtered messages → one-click "Copy & Next Stage" → LinkedIn opens automatically.

**Current pain:** 6+ clicks/copies per outreach across 3 separate systems.
**After:** 1 click per outreach.

---

## Architecture Decision

**Build on the existing Next.js CRM app** at `/Users/johncunningham/oneclickcoaching/web/app/(app)/crm/`

Why:
- Already has Supabase database with CRM_Leads, CRM_Lead_Activities, CRM_Lead_Meetings tables
- Already has @dnd-kit Kanban with drag-drop
- Already has 24 message templates in MessageTemplates.tsx
- Already has Fathom/Calendar schema (just waiting on OAuth)

---

## Implementation Status

### Completed (Aug 2026)

| Component | File | Status |
|-----------|------|--------|
| QuickOutreachModal | `web/app/(app)/crm/components/QuickOutreachModal.tsx` | DONE |
| LeadCard click handler | `web/app/(app)/crm/components/LeadCard.tsx` | DONE |
| KanbanColumn pass-through | `web/app/(app)/crm/components/KanbanColumn.tsx` | DONE |
| Page modal state | `web/app/(app)/crm/page.tsx` | DONE |
| Advance Stage API | `web/app/api/crm/advance-stage/route.ts` | DONE |
| Import API | `web/app/api/crm/import/route.ts` | DONE |
| Tickler Panel | `web/app/(app)/crm/components/TicklerPanel.tsx` | DONE |
| Board Status API | `web/app/api/crm/board-status/route.ts` | DONE |

### Pending

| Component | Description |
|-----------|-------------|
| Fathom OAuth | Waiting on Fathom support (since May 2026) |
| Google Calendar | Show upcoming calls on prospect cards |

---

## Stage Progression

```
pending → request_sent → observability → free_analysis → mirror → breakup → call
```

### Stage Timing (Tickler Rules)

| Stage | Follow-up After | Notes |
|-------|-----------------|-------|
| pending | Immediate | New prospects to send connection requests |
| request_sent | 4 days | Wait for acceptance, then move to observability |
| observability | 3 days | Send 6-question test link |
| free_analysis | 5 days | After they take the test |
| mirror | 7 days | The nudge |
| breakup | 14 days | Final send |
| call | N/A | Scheduled meetings |

### Tickler Panel Features

The TicklerPanel shows at the top of the CRM page:
- Groups due prospects by stage
- Shows how many days overdue (+Xd)
- Sorts by: V-A first, then ONE_STAR, then most overdue
- Click any prospect to open the QuickOutreachModal
- Shows "All caught up!" when no prospects are due
- Links to Research page when observability prospects are due

---

## Key Resources

### Meeting Link
```
https://tidycal.com/aiautomations/execution-exploration
```

### Research Paper (Lead Magnet)
```
https://www.oneclickcoaching.com/research.html
```
Used in the **observability** stage - the 6-question test that shows where visibility breaks.

---

## Data Mappings

### Stage (HTML → Supabase)
| HTML stage | Supabase status |
|------------|-----------------|
| pending | pending |
| sent | request_sent |
| ebbinghaus | observability |
| free | free_analysis |
| mirror | mirror |
| breakup | breakup |
| call | call |

### Category → ICP (for message selection)
| Category | ICP Key | Message Set |
|----------|---------|-------------|
| VP, Manager, CRO | sales-leadership | "How many calls did your reps run today?" |
| Enablement | enablement | "Can you point to the last time you knew..." |
| Sandler Franchisee, Sandler User | sandler-franchisee | "Your clients finish training..." |
| Sales Trainers, Other | partner | "You own the methodology..." |

### Priority/Signal → Classification
| HTML field | Supabase field |
|------------|----------------|
| priority: "high" | classification: "V-A" |
| signal: "ONE_STAR" | profile_signal: "ONE_STAR" |
| signal: "VIEWED" | profile_signal: "VIEWED" |

---

## Fathom OAuth Integration

### Status
- **Working**: 10 calls synced Jun 20, 2026
- **Blocked**: Waiting on Fathom support since May 2026

### Credential Locations

| Location | Variables | Purpose |
|----------|-----------|---------|
| `~/oneclickcoaching/web/.env.local` | FATHOM_CLIENT_ID, FATHOM_CLIENT_SECRET, FATHOM_REDIRECT_URI | Local development |
| Vercel project env vars | FATHOM_CLIENT_ID, FATHOM_CLIENT_SECRET | Production (encrypted) |
| Supabase secrets | FATHOM_CLIENT_ID, FATHOM_CLIENT_SECRET, FATHOM_REDIRECT_URI | Edge function (fathom-sync) |

### Source of Truth
- **Fathom developer portal** (fathom.video)
- OAuth app name: "One Click Coaching"
- Redirect URI: `https://app.oneclickcoaching.com/api/integrations/fathom/oauth/callback`
- Authorization URL: `https://fathom.video/external/v1/oauth2/authorize`

### Troubleshooting
Credentials have been rotated at least once (old client IDs visible in May history).
If integration breaks, likely cause is **dev (.env.local) and prod (Vercel) drifting onto different pairs**.

**Action:** Confirm both environments hold the same current pair from Fathom portal.

### Related Files
- `~/oneclickcoaching/docs/FATHOM-OAUTH-BLOCKER.md`
- `~/oneclickcoaching/web/.env.example`
- Edge functions: `fathom-oauth-callback`, `fathom-sync`

---

---

## Priority Board Integration

The OCC Priority Board (`occ-priority-board.html`) is a daily focus tool with:
- Today's 3 must-dos
- Five work lanes: LinkedIn, Blog, Guest Posts, CRM, Personal
- Progress tracking with confetti celebration
- 14-day completion charts
- End-of-day reflection

### CRM Lane Tasks
The board's CRM lane includes:
1. Send DM batch 1 + 2 (from Telegram)
2. Process new Acceptances
3. Log connection requests + stamp Last Contact
4. Advance Call/Meeting follow-ups

### API Integration
The `/api/crm/board-status` endpoint provides real-time CRM status for the board:

```javascript
// GET /api/crm/board-status
{
  "date": "2026-08-31",
  "crm": "Send connection requests: 5 (2 V-A) · Check acceptances: 3",
  "dueCounts": [
    { "stage": "pending", "count": 5, "vaCount": 2, "action": "Send connection requests" }
  ],
  "totalDue": 8,
  "totalVaDue": 2,
  "pipelineStats": { "total": 150, "pending": 12, ... }
}
```

### Files
- `OCC-crm/occ-priority-board.html` - The priority board
- `OCC-crm/board-data.js` - Daily hints template
- `web/app/api/crm/board-status/route.ts` - API for CRM status

---

## Future Integrations

### Google Calendar
- Schema ready: `CRM_Lead_Meetings.google_calendar_event_id`
- Show upcoming calls on prospect cards
- Auto-link meetings to leads by attendee email

### Hermes Webhook
- Add `/api/crm/webhook` for conversational updates from Telegram
- Hermes skill can call webhook instead of CSV

---

## Verification Checklist

1. [ ] **Click any prospect card** → QuickOutreachModal opens
2. [ ] **Message auto-selected** based on their ICP + current stage
3. [ ] **Click "Copy & Next Stage"** →
   - Message copied to clipboard (verify with Cmd+V)
   - LinkedIn profile opens in new tab
   - Card moves to next column in Kanban
   - Activity logged in lead detail page
4. [ ] **Import test** → Upload CSV with 5 leads, verify they appear in Kanban
5. [ ] **Duplicate handling** → Re-import same CSV, verify no duplicates created
6. [ ] **Tickler system** → Shows due prospects for today

---

## Code Summary

| Action | File | Lines |
|--------|------|-------|
| CREATE | `web/app/(app)/crm/components/QuickOutreachModal.tsx` | ~300 |
| CREATE | `web/app/(app)/crm/components/TicklerPanel.tsx` | ~150 |
| MODIFY | `web/app/(app)/crm/components/LeadCard.tsx` | +20 |
| MODIFY | `web/app/(app)/crm/components/KanbanColumn.tsx` | +5 |
| MODIFY | `web/app/(app)/crm/page.tsx` | +35 |
| CREATE | `web/app/api/crm/advance-stage/route.ts` | ~95 |
| CREATE | `web/app/api/crm/import/route.ts` | ~200 |
| CREATE | `web/app/api/crm/board-status/route.ts` | ~115 |
| **Total new code** | | **~920 lines** |
