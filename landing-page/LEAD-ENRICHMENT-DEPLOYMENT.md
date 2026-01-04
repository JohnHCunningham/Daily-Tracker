# Lead Enrichment System - Deployment Guide

## Overview

This lead enrichment system automatically enriches new leads with:
- **LinkedIn profile data** (job title, company, connections, experience)
- **Company information** (size, industry, employee count, funding)
- **Website analysis** (tech stack, content, value proposition)
- **Competitor intelligence** (market position, competitors, differentiation)
- **Quality scoring** (A+ to F grade based on firmographic, engagement, intent, and fit)

**Result:** Every new lead gets a quality score (0-100) and grade (A+ to F) within 2-3 minutes of submission.

---

## Architecture

```
New Lead Submitted
        ↓
[Supabase Trigger] → Lead created in Leads table
        ↓
[Update Status] → enrichment_status = 'in_progress'
        ↓
[Parallel Enrichment]
        ├─→ [Apify] Scrape LinkedIn Profile
        ├─→ [Apify] Scrape Company Website
        └─→ [ChatGPT] Analyze Tech Stack
                ↓
        [ChatGPT] Competitor Analysis
                ↓
        [Save to Lead_Enrichment table]
                ↓
        [Calculate Quality Score] → Scores: Firmographic, Engagement, Intent, Fit
                ↓
        [Update Lead] → enrichment_status = 'completed'
                ↓
        [If Score >= 80] → Send High-Value Lead Alert Email
```

---

## Prerequisites

### 1. Supabase Setup

**Database Tables Required:**
- `Leads` (from lead-attribution-schema.sql)
- `Lead_Enrichment` (from lead-enrichment-schema.sql)
- `Lead_Quality_Rules` (from lead-enrichment-schema.sql)
- `Lead_Enrichment_Log` (from lead-enrichment-schema.sql)

**Deploy Schemas:**
```bash
# 1. Deploy lead attribution schema first
psql $SUPABASE_DB_URL -f lead-attribution-schema.sql

# 2. Deploy lead enrichment schema
psql $SUPABASE_DB_URL -f lead-enrichment-schema.sql
```

**Verify Tables:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('Leads', 'Lead_Enrichment', 'Lead_Quality_Rules', 'Lead_Enrichment_Log');
```

### 2. n8n Setup

**Install n8n (if not already installed):**
```bash
# Via npm
npm install -g n8n

# Or via Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Access n8n:**
```
http://localhost:5678
```

### 3. API Credentials

You'll need accounts and API keys for:

**Apify (for LinkedIn & website scraping):**
- Sign up: https://apify.com
- Get API token: https://console.apify.com/account/integrations
- Recommended plan: Pay-as-you-go ($0.25 per 1000 results)

**OpenAI (for competitor analysis & tech stack detection):**
- Sign up: https://platform.openai.com
- Get API key: https://platform.openai.com/api-keys
- Recommended model: GPT-4o ($2.50 per 1M input tokens)

**Supabase:**
- Project URL: https://[your-project].supabase.co
- Service Role Key: Project Settings > API > service_role key (secret)

**SMTP (for high-value lead alerts):**
- Gmail: Use App Password (https://myaccount.google.com/apppasswords)
- SendGrid, Mailgun, or any SMTP provider

---

## Deployment Steps

### Step 1: Import n8n Workflow

1. Open n8n at http://localhost:5678
2. Click **"Add workflow"** → **"Import from File"**
3. Select `lead-enrichment-workflow.json`
4. The workflow will appear in the canvas

### Step 2: Configure Credentials

**Supabase API Credential:**
1. Click any Supabase node
2. Click **"Credentials"** dropdown → **"Create New"**
3. Enter:
   - **Name:** Supabase API
   - **Host:** https://[your-project].supabase.co
   - **Service Role Key:** [your-service-role-key]
4. Click **"Save"**

**Apify API Credential:**
1. Click the "Apify - Scrape LinkedIn Profile" node
2. Click **"Credentials"** → **"Create New"**
3. Enter:
   - **Name:** Apify API
   - **API Token:** [your-apify-token]
4. Click **"Save"**

**OpenAI API Credential:**
1. Click the "ChatGPT - Analyze Tech Stack" node
2. Click **"Credentials"** → **"Create New"**
3. Enter:
   - **Name:** OpenAI API
   - **API Key:** [your-openai-api-key]
4. Click **"Save"**

**SMTP Credential (for email alerts):**
1. Click the "Send High-Value Lead Alert" node
2. Click **"Credentials"** → **"Create New"**
3. Enter:
   - **Name:** SMTP
   - **Host:** smtp.gmail.com (or your provider)
   - **Port:** 465 (SSL) or 587 (TLS)
   - **Username:** your-email@gmail.com
   - **Password:** [your-app-password]
4. Click **"Save"**

### Step 3: Configure Environment Variables

1. In n8n, go to **Settings** > **Environments**
2. Add:
   ```
   SUPABASE_URL=https://[your-project].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   ```

### Step 4: Configure Apify Actors

**LinkedIn Profile Scraper:**
1. Go to https://apify.com/store
2. Search for "LinkedIn Profile Scraper"
3. Subscribe to the actor (recommended: apify/linkedin-profile-scraper)
4. Copy the Actor ID
5. In n8n, update the "Apify - Scrape LinkedIn Profile" node:
   - **Task ID:** [linkedin-actor-id]

**Website Content Crawler:**
1. Search for "Website Content Crawler" on Apify
2. Subscribe (recommended: apify/website-content-crawler)
3. Copy the Actor ID
4. Update the "Apify - Scrape Website" node:
   - **Task ID:** [website-actor-id]

### Step 5: Activate Workflow

1. Click the toggle at the top: **"Inactive"** → **"Active"**
2. The workflow is now listening for new leads

---

## Testing

### Test 1: Manual Lead Creation

```sql
-- Create a test lead
INSERT INTO Leads (
    email,
    first_name,
    last_name,
    company,
    first_touch_source_id,
    first_touch_utm_medium,
    first_touch_landing_page
)
VALUES (
    'test@example.com',
    'John',
    'Doe',
    'Example Corp',
    (SELECT id FROM Lead_Sources WHERE source_name = 'Google Ads'),
    'cpc',
    'https://salesai.coach/pricing'
);
```

**Expected Result:**
1. n8n workflow triggers within 5 seconds
2. LinkedIn profile scraped (if LinkedIn URL provided)
3. Website scraped (if website URL provided)
4. Competitor analysis completed
5. Quality score calculated
6. Lead_Enrichment record created
7. Lead updated with `enrichment_status = 'completed'`
8. If score >= 80, email alert sent

**Verify Enrichment:**
```sql
-- Check enrichment data
SELECT
    l.email,
    l.quality_score,
    l.lead_grade,
    l.enrichment_status,
    le.linkedin_current_title,
    le.company_size,
    le.competitors_identified,
    le.market_position
FROM Leads l
LEFT JOIN Lead_Enrichment le ON l.id = le.lead_id
WHERE l.email = 'test@example.com';
```

### Test 2: Check Enrichment Log

```sql
SELECT
    enrichment_type,
    status,
    data_source,
    data_found,
    execution_time_ms,
    error_message
FROM Lead_Enrichment_Log
WHERE lead_id = (SELECT id FROM Leads WHERE email = 'test@example.com')
ORDER BY created_at DESC;
```

### Test 3: View Quality Score Breakdown

```sql
SELECT * FROM calculate_lead_quality_score(
    (SELECT id FROM Leads WHERE email = 'test@example.com')
);
```

**Expected Output:**
```
total_score | grade | firmographic_score | engagement_score | intent_score | fit_score
---------------------------------------------------------------------------
     75     |   B   |        65          |       50         |      85      |    60
```

---

## Quality Scoring Logic

### Score Components (Each 0-100 points)

**1. Firmographic Score (Company attributes)**
- Enterprise company (1000+ employees): **+25 points**
- Mid-market company (201-1000 employees): **+15 points**
- Target industry (Tech, SaaS, Finance, Healthcare): **+20 points**
- Senior decision maker (VP, Director, Chief, Founder): **+20 points**
- High LinkedIn connections (500+): **+10 points**

**2. Engagement Score (Behavior signals)**
- Visited website (not bounce): **+15 points**
- Active social media presence: **+10 points**
- Company has careers page (growing): **+5 points**

**3. Intent Score (Buying signals)**
- Visited pricing page: **+25 points**
- Came from paid search (Google Ads): **+20 points**
- Downloaded content/whitepaper: **+15 points**

**4. Fit Score (Match to ICP)**
- High domain authority (50+): **+10 points**
- Market leader position: **+15 points**
- Website has transparent pricing: **+10 points**

### Total Score Calculation

```
Total Score = (Firmographic + Engagement + Intent + Fit) / 4
```

### Grade Assignment

| Score Range | Grade | Description |
|-------------|-------|-------------|
| 90-100 | A+ | Perfect fit - immediate priority |
| 80-89 | A | High-value lead - fast follow-up |
| 70-79 | B | Good fit - standard follow-up |
| 60-69 | C | Moderate fit - nurture campaign |
| 50-59 | D | Low fit - low priority |
| 0-49 | F | Poor fit - disqualify or long nurture |

---

## Customizing Quality Rules

### Add New Scoring Rule

```sql
INSERT INTO Lead_Quality_Rules (
    rule_name,
    rule_category,
    condition_field,
    condition_operator,
    condition_value,
    points_awarded,
    description
)
VALUES (
    'Fortune 500 Company',
    'firmographic',
    'company_employee_count',
    'greater_than',
    '10000',
    30,
    'Enterprise-level company with significant budget'
);
```

### Update Existing Rule Points

```sql
UPDATE Lead_Quality_Rules
SET points_awarded = 30
WHERE rule_name = 'Visited Pricing Page';
```

### Deactivate Rule

```sql
UPDATE Lead_Quality_Rules
SET is_active = FALSE
WHERE rule_name = 'High LinkedIn Connections (500+)';
```

---

## Monitoring & Optimization

### Dashboard Queries

**Enrichment Success Rate:**
```sql
SELECT * FROM Enrichment_Performance
ORDER BY enrichment_date DESC
LIMIT 7;
```

**High-Value Leads:**
```sql
SELECT * FROM High_Value_Leads_Dashboard
ORDER BY quality_score DESC
LIMIT 20;
```

**Average Quality Score by Source:**
```sql
SELECT
    ls.source_name,
    COUNT(*) as total_leads,
    ROUND(AVG(l.quality_score), 1) as avg_quality_score,
    COUNT(*) FILTER (WHERE l.lead_grade IN ('A+', 'A')) as high_value_count
FROM Leads l
JOIN Lead_Sources ls ON l.first_touch_source_id = ls.id
WHERE l.quality_score IS NOT NULL
GROUP BY ls.source_name
ORDER BY avg_quality_score DESC;
```

**Enrichment Cost Analysis:**
```sql
SELECT
    DATE(created_at) as date,
    data_source,
    COUNT(*) as enrichments,
    SUM(api_cost) as total_cost,
    ROUND(AVG(api_cost), 3) as avg_cost_per_lead
FROM Lead_Enrichment_Log
WHERE status = 'completed'
GROUP BY DATE(created_at), data_source
ORDER BY date DESC;
```

### Performance Optimization

**1. Batch Processing (for bulk imports)**

Instead of enriching one-by-one, process in batches:

```sql
-- Get pending leads
SELECT id, email, company
FROM Leads
WHERE enrichment_status = 'pending'
LIMIT 100;
```

Then trigger n8n workflow manually or via webhook for batch processing.

**2. Conditional Enrichment (save API costs)**

Only enrich leads from high-intent sources:

```sql
-- Add condition to workflow trigger
WHERE first_touch_utm_medium IN ('cpc', 'email', 'referral')
  AND lead_status != 'spam'
```

**3. Cache Enrichment Data**

If the same company appears multiple times, reuse enrichment data:

```sql
-- Before enriching, check if company already enriched
SELECT * FROM Lead_Enrichment
WHERE linkedin_current_company = 'Example Corp'
AND created_at > NOW() - INTERVAL '30 days'
LIMIT 1;
```

---

## Troubleshooting

### Issue 1: LinkedIn Scraping Fails

**Symptom:** `linkedin_profile_found = FALSE` in Lead_Enrichment

**Causes:**
- Invalid LinkedIn URL
- LinkedIn URL is private profile
- Apify proxy blocked by LinkedIn

**Fix:**
1. Verify LinkedIn URL format: `https://www.linkedin.com/in/username/`
2. Use Apify's residential proxies (more expensive but higher success rate)
3. Add retry logic in n8n workflow

### Issue 2: Website Scraping Times Out

**Symptom:** Workflow stuck at "Apify - Scrape Website" node

**Causes:**
- Website is very slow to load
- Website requires JavaScript rendering
- Anti-bot protection blocking scraper

**Fix:**
1. Increase timeout in Apify actor settings (default: 60s → 120s)
2. Use Apify's "Cheerio Scraper" for simple HTML sites
3. Use "Puppeteer Scraper" for JavaScript-heavy sites

### Issue 3: Quality Score Always Low

**Symptom:** All leads getting grade C or below

**Causes:**
- Scoring rules too strict
- Missing enrichment data (LinkedIn/website not found)
- Rules not matching your ICP

**Fix:**
1. Review scoring breakdown:
   ```sql
   SELECT * FROM calculate_lead_quality_score('[lead-id]');
   ```
2. Adjust points in Lead_Quality_Rules table
3. Add custom rules matching your ideal customer profile

### Issue 4: High API Costs

**Symptom:** Apify/OpenAI bills higher than expected

**Causes:**
- Enriching spam leads
- Running enrichment on every lead (including low-intent)
- Not caching company data

**Solutions:**
1. **Filter spam before enriching:**
   ```sql
   -- Add to workflow trigger
   WHERE email NOT LIKE '%@gmail.com'
     AND email NOT LIKE '%@yahoo.com'
     AND lead_status != 'spam'
   ```

2. **Enrich only high-intent leads:**
   ```sql
   -- Add to workflow trigger
   WHERE first_touch_utm_medium IN ('cpc', 'email')
      OR first_touch_landing_page LIKE '%pricing%'
      OR first_touch_landing_page LIKE '%demo%'
   ```

3. **Cache company enrichment:**
   ```sql
   -- Before scraping, check cache
   SELECT * FROM Lead_Enrichment
   WHERE company_linkedin_url = '[url]'
   AND created_at > NOW() - INTERVAL '30 days';
   ```

---

## Integration with Contact Form

To capture lead data from your website contact form, update the form to POST to Supabase.

### Example: HTML Form

```html
<form id="contact-form">
    <input type="email" name="email" required>
    <input type="text" name="first_name" required>
    <input type="text" name="last_name" required>
    <input type="text" name="company">
    <input type="text" name="phone">

    <!-- Hidden UTM fields (populated by JavaScript) -->
    <input type="hidden" name="utm_source" id="utm_source">
    <input type="hidden" name="utm_medium" id="utm_medium">
    <input type="hidden" name="utm_campaign" id="utm_campaign">
    <input type="hidden" name="utm_term" id="utm_term">
    <input type="hidden" name="utm_content" id="utm_content">

    <button type="submit">Submit</button>
</form>

<script>
// Capture UTM parameters from URL
const urlParams = new URLSearchParams(window.location.search);
document.getElementById('utm_source').value = urlParams.get('utm_source') || '';
document.getElementById('utm_medium').value = urlParams.get('utm_medium') || '';
document.getElementById('utm_campaign').value = urlParams.get('utm_campaign') || '';
document.getElementById('utm_term').value = urlParams.get('utm_term') || '';
document.getElementById('utm_content').value = urlParams.get('utm_content') || '';

// Store UTM in sessionStorage for multi-page tracking
sessionStorage.setItem('utm_source', urlParams.get('utm_source') || '');
sessionStorage.setItem('utm_medium', urlParams.get('utm_medium') || '');
sessionStorage.setItem('utm_campaign', urlParams.get('utm_campaign') || '');

// Handle form submission
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const leadData = {
        email: formData.get('email'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        company: formData.get('company'),
        phone: formData.get('phone'),

        // First-touch attribution
        first_touch_utm_source: formData.get('utm_source'),
        first_touch_utm_medium: formData.get('utm_medium'),
        first_touch_utm_campaign: formData.get('utm_campaign'),
        first_touch_utm_term: formData.get('utm_term'),
        first_touch_utm_content: formData.get('utm_content'),
        first_touch_referrer: document.referrer,
        first_touch_landing_page: window.location.href,

        // Match to Lead_Sources
        first_touch_source_id: getSourceIdFromUTM(formData.get('utm_source')),

        lead_status: 'new'
    };

    // Submit to Supabase
    const response = await fetch('https://[your-project].supabase.co/rest/v1/Leads', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': '[your-anon-key]',
            'Authorization': 'Bearer [your-anon-key]'
        },
        body: JSON.stringify(leadData)
    });

    if (response.ok) {
        // Redirect to thank you page
        window.location.href = '/thank-you.html';
    } else {
        alert('Error submitting form. Please try again.');
    }
});

// Helper function to map UTM source to Lead_Sources table
function getSourceIdFromUTM(utmSource) {
    const sourceMap = {
        'google': '[google-ads-uuid]',
        'facebook': '[facebook-ads-uuid]',
        'linkedin': '[linkedin-ads-uuid]',
        // ... add more mappings
    };
    return sourceMap[utmSource] || null;
}
</script>
```

---

## Next Steps

1. **✅ Deploy Database Schema** - Run lead-attribution-schema.sql and lead-enrichment-schema.sql
2. **✅ Import n8n Workflow** - Import lead-enrichment-workflow.json
3. **✅ Configure Credentials** - Set up Apify, OpenAI, Supabase, SMTP
4. **✅ Test with Sample Lead** - Create test lead and verify enrichment
5. **⏳ Update Contact Form** - Add UTM capture and Supabase integration
6. **⏳ Build Attribution Dashboard** - Create frontend to visualize lead sources and ROI
7. **⏳ Set Up Alerts** - Configure high-value lead notifications
8. **⏳ Monitor Performance** - Track enrichment success rate and costs

---

## Cost Estimation

**Per 1000 Leads Enriched:**

| Service | Cost | Notes |
|---------|------|-------|
| Apify LinkedIn | ~$5-10 | Depends on proxy usage |
| Apify Website | ~$2-5 | Depends on page depth |
| OpenAI GPT-4o | ~$0.50 | 2 API calls per lead |
| **Total** | **~$7.50-15.50** | **= $0.0075-0.015 per lead** |

**Optimization:**
- Only enrich high-intent leads (pricing page visitors, paid search) to reduce costs
- Cache company data for 30 days to avoid re-enriching same companies
- Use conditional enrichment: skip enrichment for free email domains (@gmail, @yahoo)

**Expected ROI:**
- If 1 high-value lead converts → $50K deal
- Enrichment cost: $0.015
- ROI: 333,233% 🚀
