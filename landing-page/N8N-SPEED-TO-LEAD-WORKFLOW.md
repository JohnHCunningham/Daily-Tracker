# Speed-to-Lead Workflow - n8n Setup

## Overview

**Contact Form → Instant Reply → Enrich (3min) → Personalized Email**

**Tools:**
- n8n (workflow automation)
- Apify (LinkedIn + website scraping)
- ChatGPT (analysis + email generation)
- Gmail/SMTP (email sending)

**Timing:**
- Instant auto-reply (< 5 seconds)
- Enrichment + analysis (< 2 minutes)
- Wait 3 minutes
- Personalized email sent (total ~5 minutes from form submission)

---

## n8n Workflow Structure

### Node 1: Webhook Trigger
**Type:** Webhook
**Method:** POST
**URL:** `https://aiadvantagesolutions.app.n8n.cloud/webhook/XXXXXXXX`

**Expected Data:**
```json
{
  "name": "John Smith",
  "email": "john@acme.com",
  "company": "Acme Corp",
  "website": "https://acme.com",
  "linkedin": "https://linkedin.com/in/johnsmith",
  "phone": "(555) 123-4567",
  "message": "Interested in learning more...",
  "source": "contact_form",
  "timestamp": "2024-12-19T18:30:00Z"
}
```

---

### Node 2: Send Immediate Auto-Reply
**Type:** Gmail / Send Email
**To:** `{{ $json.email }}`
**From:** `john@aiadvantagesolutions.ca`
**Subject:** `Thanks for reaching out, {{ $json.name.split(' ')[0] }}`

**Email Body:**
```
Hi {{ $json.name.split(' ')[0] }},

Thanks for reaching out about SalesAI.Coach. I received your message and I'm looking forward to learning more about your team's sales execution challenges.

I'll send you a personalized response within the next few minutes with some thoughts specific to your situation.

In the meantime, feel free to browse our Execution Exploration booking calendar if you'd like to schedule a focused conversation: https://tidycal.com/aiautomations/execution-exploration

Talk soon,
John Cunningham
AI Advantage Solutions
john@aiadvantagesolutions.ca
(905) 519-8983
```

**Settings:**
- ✅ Continue on fail (don't block workflow if email fails)

---

### Node 3A: Scrape LinkedIn Profile (If Provided)
**Type:** HTTP Request (Apify API) or Apify Node
**Condition:** `{{ $json.linkedin ? true : false }}`

**Apify Actor:** `apify/linkedin-profile-scraper`

**Input:**
```json
{
  "startUrls": [{ "url": "{{ $json.linkedin }}" }],
  "maxResults": 1
}
```

**Expected Output:**
```json
{
  "name": "John Smith",
  "headline": "VP of Sales at Acme Corp",
  "company": "Acme Corp",
  "location": "San Francisco, CA",
  "industry": "Software",
  "summary": "Sales leader with 15 years...",
  "skills": ["Sales Management", "SaaS", "B2B"],
  "experience": [...]
}
```

**Fallback if no LinkedIn:**
```json
{
  "linkedin_data": "No LinkedIn profile provided"
}
```

---

### Node 3B: Scrape Company Website (Parallel)
**Type:** HTTP Request (Apify API) or Apify Node
**Condition:** `{{ $json.website ? true : false }}`

**Apify Actor:** `apify/website-content-crawler`

**Input:**
```json
{
  "startUrls": [{ "url": "{{ $json.website }}" }],
  "maxCrawlDepth": 2,
  "maxPages": 5,
  "excludePatterns": ["/blog/*", "/careers/*"]
}
```

**Expected Output:**
```json
{
  "url": "https://acme.com",
  "title": "Acme Corp - Enterprise Software Solutions",
  "description": "We help companies...",
  "content": "Full text content from homepage and key pages...",
  "headings": ["About Us", "Products", "Solutions"],
  "meta": {
    "industry": "Software",
    "keywords": ["enterprise", "SaaS", "B2B"]
  }
}
```

**Fallback if no website:**
```json
{
  "website_data": "No website provided"
}
```

---

### Node 4: Merge Data
**Type:** Merge
**Mode:** Merge by position
**Inputs:**
- Main data (from webhook)
- LinkedIn data (from Node 3A)
- Website data (from Node 3B)

**Output:** Combined JSON with all data

---

### Node 5: ChatGPT - Analyze & Identify Industry Pain Points
**Type:** OpenAI / Chat
**Model:** `gpt-4o-mini` (fast & cheap)

**System Prompt:**
```
You are a sales intelligence analyst. Analyze the provided lead data and identify:
1. Industry/sector
2. Company size (estimate)
3. Top 3 pain points this industry typically faces with sales execution
4. Potential sales methodology they might use (Sandler, MEDDIC, Challenger, SPIN, GAP, or Unknown)
5. Key talking points for outreach

Be specific but concise. Output as JSON.
```

**User Prompt:**
```
Analyze this lead:

NAME: {{ $json.name }}
COMPANY: {{ $json.company }}
MESSAGE: {{ $json.message }}

LINKEDIN DATA:
{{ $json.linkedin_data ? JSON.stringify($json.linkedin_data, null, 2) : "Not provided" }}

WEBSITE DATA:
{{ $json.website_data ? JSON.stringify($json.website_data, null, 2) : "Not provided" }}

Return analysis as JSON with this structure:
{
  "industry": "Software/SaaS",
  "company_size": "50-200 employees",
  "pain_points": [
    "Inconsistent methodology execution across reps",
    "Lack of visibility into sales behavior",
    "Difficulty coaching at scale"
  ],
  "likely_methodology": "MEDDIC or Sandler",
  "talking_points": [
    "They likely struggle with reps cutting corners on qualification",
    "Manager visibility into execution is probably low",
    "Scaling coaching without 1:1 shadowing is a challenge"
  ],
  "personalization_notes": "VP of Sales - likely responsible for team performance, frustrated by inconsistent results"
}
```

**Output Settings:**
- Format: JSON
- Parse output: Yes

---

### Node 6: Wait 3 Minutes
**Type:** Wait
**Time:** 3 minutes

**Why:** Give impression of human review, avoid looking too automated

---

### Node 7: ChatGPT - Generate Personalized Email
**Type:** OpenAI / Chat
**Model:** `gpt-4o` (higher quality for outreach)

**System Prompt:**
```
You are John Cunningham, founder of SalesAI.Coach - a behavioral accountability system for sales teams.

Write a personalized email response to a lead who filled out a contact form.

TONE:
- Warm, authentic, consultative (not salesy)
- Show you understand their industry pain points
- Position yourself as a peer/advisor, not a vendor
- Reference their specific context naturally

STRUCTURE:
1. Acknowledge their inquiry
2. Show you understand their industry challenges (2-3 sentences)
3. Brief positioning of SalesAI.Coach as the solution (1-2 sentences)
4. Suggest next step: Execution Exploration call (not a "demo")
5. Provide TidyCal link

LENGTH: 150-200 words max

DO NOT:
- Use buzzwords or jargon
- Oversell or be pushy
- Make assumptions about their specific situation
- Use exclamation marks excessively

EXAMPLE GOOD EMAIL:
"Hi Sarah,

Thanks for reaching out about SalesAI.Coach. I saw you're at [Company] in [Industry] — I work with a lot of teams in your space, and the same pattern keeps coming up: reps know the methodology, but execution consistency is all over the map.

What I hear most often from [Industry] sales leaders is that they can't see *how* their team is selling until a deal is already lost. By then, it's too late to coach.

That's exactly what we built SalesAI.Coach to solve — behavioral accountability beneath your sales framework. Not another tool to log activities, but infrastructure to make your methodology actually enforceable.

If you're open to it, I'd suggest we do a quick Execution Exploration call (20-30 min). Not a product demo — just a focused conversation about where your execution breaks down and whether greater visibility would help.

Here's my calendar: https://tidycal.com/aiautomations/execution-exploration

Either way, happy to answer any questions.

John"
```

**User Prompt:**
```
Write a personalized email to this lead:

LEAD INFO:
Name: {{ $json.name }}
Email: {{ $json.email }}
Company: {{ $json.company }}
Message: {{ $json.message }}

ANALYSIS:
Industry: {{ $json.analysis.industry }}
Pain Points: {{ $json.analysis.pain_points.join(', ') }}
Talking Points: {{ $json.analysis.talking_points.join(', ') }}
Personalization Notes: {{ $json.analysis.personalization_notes }}

Generate the email body only (no subject line).
```

**Output:** Email text ready to send

---

### Node 8: Send Personalized Email
**Type:** Gmail / Send Email
**To:** `{{ $json.email }}`
**From:** `john@aiadvantagesolutions.ca`
**Subject:** `Re: Your inquiry about sales execution at {{ $json.company }}`

**Email Body:** `{{ $json.email_body }}` (from Node 7)

**CC:** `john@aiadvantagesolutions.ca` (so you have a copy)

---

### Node 9: Store Lead in Database (Optional)
**Type:** HTTP Request or Database Node
**Purpose:** Save lead + enrichment data for future reference

**Data to Store:**
```json
{
  "name": "{{ $json.name }}",
  "email": "{{ $json.email }}",
  "company": "{{ $json.company }}",
  "website": "{{ $json.website }}",
  "linkedin": "{{ $json.linkedin }}",
  "phone": "{{ $json.phone }}",
  "message": "{{ $json.message }}",
  "source": "{{ $json.source }}",
  "submitted_at": "{{ $json.timestamp }}",
  "enrichment": {
    "industry": "{{ $json.analysis.industry }}",
    "company_size": "{{ $json.analysis.company_size }}",
    "pain_points": {{ JSON.stringify($json.analysis.pain_points) }},
    "methodology": "{{ $json.analysis.likely_methodology }}"
  },
  "status": "contacted",
  "contacted_at": "{{ $now }}",
  "next_followup": "{{ $now.plus({days: 3}) }}"
}
```

---

### Node 10: Notify You (Optional)
**Type:** Send Email or Slack Message
**To:** Your notification channel
**Purpose:** Alert you about new qualified lead

**Message:**
```
🎯 New Lead: {{ $json.name }} from {{ $json.company }}

Industry: {{ $json.analysis.industry }}
Pain Points: {{ $json.analysis.pain_points[0] }}

Personalized email sent.

View in CRM: [link]
```

---

## Apify Setup

### LinkedIn Profile Scraper
1. Go to https://apify.com/apify/linkedin-profile-scraper
2. Get API token from Apify dashboard
3. Test with sample LinkedIn URL
4. Note: LinkedIn scraping has rate limits, use sparingly

### Website Content Crawler
1. Go to https://apify.com/apify/website-content-crawler
2. Configure to scrape homepage + 2-3 key pages
3. Exclude /blog, /careers, /jobs to reduce noise
4. Extract: title, description, main content, headings

---

## Testing the Workflow

### Test 1: Full Happy Path
1. Submit contact form with:
   - Name: Test User
   - Email: test@example.com
   - Company: Test Corp
   - Website: https://stripe.com
   - LinkedIn: https://linkedin.com/in/testuser
   - Message: "Interested in improving sales execution"
2. Check:
   - ✅ Instant auto-reply received (< 10 seconds)
   - ✅ LinkedIn scrape completes (check Apify logs)
   - ✅ Website scrape completes (check Apify logs)
   - ✅ ChatGPT analysis identifies correct industry
   - ✅ 3-minute wait happens
   - ✅ Personalized email received
   - ✅ Email is relevant and well-written

### Test 2: No LinkedIn Provided
1. Submit form without LinkedIn URL
2. Check workflow still completes successfully
3. Email should still be personalized based on website + message

### Test 3: No Website Provided
1. Submit form without website
2. Check workflow still completes
3. Email should be more generic but still relevant

### Test 4: Minimal Data
1. Submit form with only name, email, company, message
2. Check workflow completes
3. Email should be professional fallback version

---

## Error Handling

### If Apify Scraping Fails:
- Continue workflow with "No data" fallback
- Email generation should handle missing enrichment data
- Still send personalized email based on what's available

### If ChatGPT Fails:
- Retry once
- If still fails, send pre-written template email
- Notify you of failure

### If Email Sending Fails:
- Retry 3 times with 30-second delay
- If still fails, store in "failed emails" queue
- Notify you to manually follow up

---

## Cost Estimate

**Per Lead:**
- Apify LinkedIn scrape: $0.01-0.05
- Apify website scrape: $0.01-0.03
- ChatGPT analysis (gpt-4o-mini): $0.001
- ChatGPT email (gpt-4o): $0.01
- Email sending: Free (Gmail) or $0.0001 (SendGrid)

**Total per lead: ~$0.03-0.10**

**For 100 leads/month: $3-10**

---

## Next Steps

1. **Set up Apify account** and get API token
2. **Import n8n workflow** (I can provide JSON)
3. **Test with sample data**
4. **Connect to live contact form**
5. **Monitor first 10 leads** and adjust prompts
6. **Add to nurture sequence** (optional Phase 2)

---

## Future Enhancements (Phase 2)

- Add lead scoring based on enrichment data
- Trigger different email templates for different industries
- Add SMS option for high-value leads
- Create multi-touch nurture sequence (Day 1, 3, 7, 14)
- Integrate with CRM for automatic lead creation
- A/B test different email variations
- Add qualification criteria (auto-disqualify if < 5 reps)

---

Last updated: December 2024
