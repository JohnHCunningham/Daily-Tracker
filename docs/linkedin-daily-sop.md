# LinkedIn Daily Operations SOP
# For VA handoff — follow in sequence. Do not skip steps.

Last updated: May 28, 2026

---

## FILE NAMING CONVENTIONS

All lead lists and outreach files follow these names. Do not improvise.

| File | Pattern | Example |
|------|---------|---------|
| Connection request CSV | `linkedin-connections-YYYY-MM-DD.csv` | `linkedin-connections-2026-05-28.csv` |
| Acceptance names | `accepting-invites-YYYY-MM-DD.txt` | `accepting-invites-2026-05-28.txt` |
| Thank-you HTML form | `acceptance-thankyou-YYYY-MM-DD.html` | `acceptance-thankyou-2026-05-28.html` |
| InMail CSV export | `InMail-MM_DD_YY.csv` | `InMail-05_28_26.csv` |
| Profile viewers list | `profile-viewers-YYYY-MM-DD.txt` | `profile-viewers-2026-05-28.txt` |

**Rules:**
- Dates always in ISO format (YYYY-MM-DD) except InMail exports from Sales Nav (MM_DD_YY)
- All outreach files live in: `one-click-coaching-website/outreach/`
- Do NOT rename Sales Nav export files — they arrive with their own naming

---

## MORNING ROUTINE (15-20 minutes)

### Step 1: Open Sales Nav — Get the Two Numbers

1. Go to Sales Navigator → click your profile avatar
2. Record total LinkedIn connections: _____
3. Compare to yesterday's closing number in LEDGER.md
4. Calculate: Today's total − Yesterday's total = New acceptances
5. Open LEDGER.md and fill in the Opening section

### Step 2: Collect Acceptance Names

1. In LinkedIn, go to My Network → "See all" pending invitations
2. Any that say "Accepted" — copy their names
3. Save as `accepting-invites-YYYY-MM-DD.txt` in outreach/
4. Format: one name per line, no numbers, no extra formatting

### Step 3: Generate Thank-You Notes

1. Run: give Hermes the acceptance names file
2. Hermes generates `acceptance-thankyou-YYYY-MM-DD.html`
3. Open HTML file in browser
4. For each name: click Copy, paste into LinkedIn message, send
5. Do NOT modify the messages — they are pre-written, short, no pitch

### Step 4: Collect Profile Viewers (AFTER Step 3)

1. Sales Nav → "Who's viewed your profile" (last 7 days)
2. Copy names into `profile-viewers-YYYY-MM-DD.txt`
3. **CROSS-REFERENCE:** Remove any name that appears in:
   - Today's `accepting-invites-YYYY-MM-DD.txt` (they already accepted)
   - Today's `linkedin-connections-YYYY-MM-DD.csv` (you already sent them a request)
   - `do-not-contact.txt` (flagged as DNC)
4. Only keep names NOT on any of those lists
5. Wait 3 days from view date, then send connection request

### Step 5: Process New Connection Requests

1. If a new lead list CSV exists in outreach/:
   - Score each prospect (fit, role, company size)
   - Filter out non-ICP (wrong industry, too large/small, wrong role)
   - Dedupe against all previous CSVs and `do-not-contact.txt`
   - Draft connection notes (300 char max, personalized, no subject line)
   - Build HTML form with Copy buttons
2. Save as `linkedin-connections-YYYY-MM-DD.csv` with notes column

### Step 6: Close the LEDGER

1. Count requests sent today
2. Count new acceptances from Step 1
3. Record closing total connections
4. Check ☐ Reconciled
5. LEDGER.md is the source of truth — every other tracking system derives from it

---

## DAILY CROSS-REFERENCE RULES

Before sending ANY connection request or message, check against:

| Source | What to check |
|--------|---------------|
| `do-not-contact.txt` | Person flagged as DNC — skip |
| Today's `accepting-invites-*.txt` | Already accepted — send thank-you, not request |
| Today's `linkedin-connections-*.csv` | Already sent request — don't double-send |
| Previous `linkedin-connections-*.csv` | Sent in prior batch — check status first |
| `LEDGER.md` | Reconcile counts match |

---

## CONTENT CALENDAR (Weekly)

| Day | Action |
|-----|--------|
| Monday | Prep week's content, Sales Nav lead research |
| Tuesday | LinkedIn post (8 AM ET) + group post to Sandler Sales Training |
| Wednesday | LinkedIn post (12 PM ET) + group post to The Challenger Sale |
| Thursday | LinkedIn post (4:30 PM ET) + group post to Linking Sales Leaders |
| Friday | Franchisee outreach, content deep work |
| Saturday | Blog post, carousel content, catch-up |
| Sunday | Review dashboard, plan next week |

---

## COMMENT ENGAGEMENT (Ongoing)

When someone in ICP posts about sales methodology, coaching, discovery, or leadership:

1. Read the full post
2. Draft a comment using the 3-part protocol (acknowledge → add layer → question)
3. Get John's approval before posting (until VA is trusted on voice)
4. Max 2 comments per person per session
5. Never mention OCC

---

## FILE LOCATIONS — QUICK REFERENCE

| What | Where |
|------|-------|
| LEDGER | `one-click-coaching-website/outreach/LEDGER.md` |
| Connection CSVs | `one-click-coaching-website/outreach/linkedin-connections-*.csv` |
| Acceptance names | `one-click-coaching-website/outreach/accepting-invites-*.txt` |
| Thank-you forms | `one-click-coaching-website/outreach/acceptance-thankyou-*.html` |
| InMail drafts | `one-click-coaching-website/outreach/InMail-*.html` |
| Profile viewers | `one-click-coaching-website/outreach/profile-viewers-*.txt` |
| Do Not Contact | `one-click-coaching-website/outreach/do-not-contact.txt` |
| Content queue | `one-click-coaching-website/content-queue/` |
| LinkedIn operating map | `oneclickcoaching/docs/linkedin-operating-map.md` |
| This SOP | `oneclickcoaching/docs/linkedin-daily-sop.md` |

---

## HANDOFF NOTES FOR JOHN

- This SOP is designed for a VA who knows LinkedIn basics but not OCC
- The Hermes agent handles: drafting, HTML form generation, lead scoring, deduplication
- The VA handles: copying names, clicking Copy/Paste, following the sequence
- All thinking is in the system. The VA executes.
- If the VA gets stuck: the LinkedIn Operating Map has the full logic behind each step
