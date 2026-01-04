# n8n Speed-to-Lead Workflow - Final Corrected Version

## File: `n8n-speed-to-lead-FINAL.json`

This is the complete, corrected workflow with all bugs fixed and ready to import.

---

## Summary of All Fixes Applied

### 🔧 Critical Fix #1: Data Path Correction
**Problem:** Form data was nested in `$json.body.*` but all nodes were referencing `$json.*`

**What was broken:**
- Gmail auto-reply: `{{ $json.email }}` → undefined
- LinkedIn check: `{{ $json.linkedin }}` → undefined
- Website check: `{{ $json.website }}` → undefined
- All ChatGPT nodes referencing form fields → undefined

**Fix applied:** Updated ALL references to use `$json.body.*`:
```javascript
// Before:
{{ $json.email }}
{{ $json.name }}
{{ $json.linkedin }}
{{ $json.website }}

// After:
{{ $json.body.email }}
{{ $json.body.name }}
{{ $json.body.linkedin }}
{{ $json.body.website }}
```

### 🔧 Critical Fix #2: Apify Input Expression Evaluation
**Problem:** Apify nodes were receiving literal strings instead of evaluated URLs

**What was broken:**
```json
// This was treated as a literal string:
{
  "startUrls": [{"url": "{{ $json.body.website }}"}],
  "maxCrawlDepth": 2,
  "maxPages": 5
}
```

**Fix applied:** Proper expression evaluation:
```json
// Now correctly evaluates the variable:
={{ { "startUrls": [{ "url": $json.body.website }], "maxCrawlDepth": 2, "maxPages": 5 } }}
```

**Key changes:**
1. ✅ Expression starts with `=`
2. ✅ Removed quotes around `$json.body.website`
3. ✅ Removed `{{ }}` brackets (not needed in expression mode)

### 🔧 Fix #3: Webhook Response Mode
**Problem:** Had unused "Respond to Webhook" node causing 500 errors

**Fix applied:**
- Set Webhook node `responseMode` to `"lastNode"` (responds when last node finishes)
- Removed separate "Respond to Webhook" node
- Webhook now responds automatically when workflow completes

### 🔧 Fix #4: Complete ChatGPT Integration
**Added missing nodes:**
- ChatGPT: Analyze Lead (gpt-4o-mini)
- ChatGPT: Generate Personalized Email (gpt-4o)
- Wait 3 Minutes node
- Send Personalized Email node

**Proper prompt engineering:**
- Analysis prompt extracts industry, pain points, company size, decision-making level
- Email prompt uses analysis to write personalized response
- Both prompts reference merged data from form + Apify scrapers

---

## Updated Workflow Structure

```
Webhook → [Parallel Execution]
  ├─ Send Auto-Reply (instant)
  ├─ Check LinkedIn → Scrape OR Fallback → Merge
  └─ Check Website → Scrape OR Fallback → Merge
                                           ↓
                                    Analyze with ChatGPT (gpt-4o-mini)
                                           ↓
                                    Wait 3 Minutes
                                           ↓
                                    Generate Email with ChatGPT (gpt-4o)
                                           ↓
                                    Send Personalized Email
```

---

## How to Import This Workflow

### Step 1: Delete Old Workflow (Clean Slate)
1. In n8n, open your current "Speed-to-Lead" workflow
2. Click the **⋮** menu (top-right) → **Delete**
3. Confirm deletion

### Step 2: Import New Workflow
1. Click **+** (New Workflow)
2. Click **⋮** menu → **Import from File**
3. Select `n8n-speed-to-lead-FINAL.json`
4. Workflow will appear with all nodes configured

### Step 3: Configure Credentials
You'll need to set up 3 credential types:

#### A) Gmail OAuth2 (for both email nodes)
1. Click on "Send Instant Auto-Reply" node
2. Click **Credential to connect with** dropdown
3. Select your existing Gmail OAuth2 credential
4. Repeat for "Send Personalized Email" node

#### B) Apify API (for both scraper nodes)
1. Click on "Scrape LinkedIn Profile" node
2. Click **Credential to connect with** dropdown
3. Select your existing Apify credential
4. Repeat for "Scrape Company Website" node

#### C) OpenAI API (for both ChatGPT nodes)
1. Click on "ChatGPT: Analyze Lead" node
2. Click **Credential to connect with** dropdown
3. Select your existing OpenAI credential
4. Repeat for "ChatGPT: Generate Personalized Email" node

### Step 4: Verify Webhook URL
1. Click on "Webhook - Contact Form" node
2. Copy the **Production URL** (should be: `https://aiadvantagesolutions.app.n8n.cloud/webhook/701fa496-37f8-43c0-9e00-1eb8973b148f`)
3. Verify this matches the webhook URL in your Contact.tsx and Chatbot.tsx files

### Step 5: Save & Activate
1. Click **Save** (top-right)
2. Click **Publish** to activate the workflow
3. Confirm the toggle shows "Active" 🟢

---

## Testing the Workflow

### Manual Test in n8n
1. Click on "Webhook - Contact Form" node
2. Click **Listen for Test Event**
3. Submit your contact form on the website
4. Verify all nodes execute successfully (green checkmarks)

### What to Check:
- ✅ "Send Instant Auto-Reply" - Check your Gmail Sent folder
- ✅ "Scrape LinkedIn Profile" - Should show profile data OR "No LinkedIn provided"
- ✅ "Scrape Company Website" - Should show website content OR "No website provided"
- ✅ "ChatGPT: Analyze Lead" - Should show bullet-pointed analysis
- ✅ "Wait 3 Minutes" - Will pause workflow (you can skip this in test mode)
- ✅ "ChatGPT: Generate Personalized Email" - Should show personalized email body
- ✅ "Send Personalized Email" - Check Gmail Sent folder after 3 minutes

### Live Test from Website
1. Go to https://daily-tracker-ky8x.vercel.app/
2. Fill out the contact form with:
   - Your email
   - LinkedIn URL
   - Company website
   - Message
3. Submit form
4. **Within 5 seconds:** Check your inbox for auto-reply
5. **After ~5 minutes:** Check your inbox for personalized email

---

## All Data Paths Corrected

| Node | Field | Corrected Reference |
|------|-------|---------------------|
| Send Auto-Reply | Email | `{{ $json.body.email }}` |
| Send Auto-Reply | Name | `{{ $json.body.name.split(' ')[0] }}` |
| Check LinkedIn | Value | `{{ $json.body.linkedin }}` |
| Check Website | Value | `{{ $json.body.website }}` |
| Scrape LinkedIn | Input URL | `$json.body.linkedin` |
| Scrape Website | Input URL | `$json.body.website` |
| ChatGPT Analyze | All fields | `{{ $json.body.* }}` |
| ChatGPT Generate | All fields | `{{ $json.body.* }}` |
| Send Personalized Email | Email | `{{ $json.body.email }}` |
| Send Personalized Email | Subject | `{{ $json.body.name.split(' ')[0] }}` |

---

## Expected Costs Per Lead

- Apify LinkedIn scraper: ~$0.005 per profile
- Apify Website crawler: ~$0.01 per site (5 pages max)
- ChatGPT gpt-4o-mini (analysis): ~$0.001
- ChatGPT gpt-4o (email): ~$0.01-0.03
- Gmail: Free

**Total: ~$0.03-0.05 per lead**

Much cheaper than Chatbase at $500/month!

---

## Troubleshooting

### Gmail Not Sending
- Verify Gmail OAuth2 credentials are connected
- Check if emails are in Gmail "Sent" folder
- Check n8n execution logs for Gmail API errors

### Apify Returning "Invalid URL"
- Verify credential is connected
- Check if Apify account has credits
- Verify the form field (linkedin/website) is not empty
- Check execution logs for the actual URL being passed

### ChatGPT Nodes Failing
- Verify OpenAI API key is valid
- Check if you have API credits
- Verify model names: `gpt-4o-mini` and `gpt-4o`
- Check rate limits on your OpenAI account

### Workflow Not Activating
- Click **Publish** (not Save)
- Check if all credentials are configured
- Look for any nodes with ⚠️ warning icons
- Verify webhook URL path is correct

---

## What Changed From Previous Version

### n8n-speed-to-lead-workflow-fixed.json → n8n-speed-to-lead-FINAL.json

1. ✅ All `$json.*` changed to `$json.body.*`
2. ✅ Apify input expressions fixed (added `=`, removed quotes)
3. ✅ Added complete ChatGPT analysis node
4. ✅ Added complete ChatGPT email generation node
5. ✅ Added Wait 3 Minutes node
6. ✅ Added Send Personalized Email node
7. ✅ Webhook responseMode set to "lastNode"
8. ✅ Removed unused "Respond to Webhook" node
9. ✅ All node connections verified and complete

---

## Next Steps After Import

1. Import the workflow ✅
2. Configure all credentials (Gmail, Apify, OpenAI) ✅
3. Save and Publish ✅
4. Test with manual webhook ✅
5. Test from live website ✅
6. Monitor first few real submissions ✅
7. Verify email delivery and quality ✅

---

## Support

If you encounter issues:
1. Check the execution logs in n8n (click on failed node)
2. Verify all credentials are connected and valid
3. Test each node individually using the "Test step" button
4. Check the webhook OUTPUT to see what data structure is being received

The workflow is now production-ready! 🚀
