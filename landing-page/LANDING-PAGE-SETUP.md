# Landing Page Setup Guide

## Overview

The landing page (`index.html`) captures lead information and UTM parameters, automatically creating leads in Supabase with full attribution tracking.

## Files Created

1. **index.html** - Main landing page with contact form
2. **thank-you.html** - Post-submission thank you page with conversion tracking
3. **LANDING-PAGE-SETUP.md** - This configuration guide

---

## Prerequisites

1. **Supabase Project** - Running with lead-attribution-schema.sql deployed
2. **Domain/Hosting** - Where you'll host the landing page
3. **Analytics (Optional)** - Google Analytics, Facebook Pixel, LinkedIn Insight

---

## Step 1: Configure Supabase Credentials

### Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** > **API**
4. Copy:
   - **Project URL**: `https://[your-project].supabase.co`
   - **anon/public key**: The public API key (safe for client-side use)

### Update index.html

Open `index.html` and find this section (around line 520):

```javascript
// TODO: Replace with your Supabase credentials
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Replace with your actual credentials:

```javascript
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Update thank-you.html

Open `thank-you.html` and update the same credentials (around line 250):

```javascript
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Step 2: Get Lead Source UUIDs

The form needs to map UTM sources to your `Lead_Sources` table.

### Query Lead Sources

Run this in Supabase SQL Editor:

```sql
SELECT id, source_name, source_category
FROM Lead_Sources
ORDER BY source_name;
```

### Create JavaScript Mapping

You'll get results like:

```
id                                  | source_name        | source_category
------------------------------------|--------------------|-----------------
a1b2c3d4-...                        | Google Ads         | paid-advertising
e5f6g7h8-...                        | Facebook Ads       | paid-advertising
i9j0k1l2-...                        | LinkedIn Ads       | paid-advertising
```

The form automatically looks up Lead Source IDs by name, so you don't need to hardcode these. However, if you want to optimize (reduce API calls), you can create a static map in `index.html`:

```javascript
// Optional: Hardcode Lead Source IDs to reduce API calls
const leadSourceMap = {
    'google-ads': 'a1b2c3d4-...',
    'facebook-ads': 'e5f6g7h8-...',
    'linkedin-ads': 'i9j0k1l2-...',
    // ... add all your sources
};

function getLeadSourceId(utmSource, utmMedium) {
    const sourceKey = getLeadSourceKey(utmSource, utmMedium);
    return leadSourceMap[sourceKey] || null;
}
```

---

## Step 3: Configure Analytics (Optional)

### Google Analytics 4

Add this to the `<head>` section of both `index.html` and `thank-you.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Replace `G-XXXXXXXXXX` with your Google Analytics Measurement ID.

### Google Ads Conversion Tracking

In `thank-you.html`, update line 230:

```javascript
gtag('event', 'conversion', {
    'send_to': 'AW-123456789/AbCdEfGhIjKlMnOp', // Replace with your conversion ID
    'transaction_id': new Date().getTime()
});
```

Get your conversion ID from Google Ads > Tools > Conversions.

### Facebook Pixel

Add this to the `<head>` section:

```html
<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"/>
</noscript>
```

Replace `YOUR_PIXEL_ID` with your Facebook Pixel ID.

### LinkedIn Insight Tag

Add this to the `<head>` section:

```html
<!-- LinkedIn Insight Tag -->
<script type="text/javascript">
_linkedin_partner_id = "YOUR_PARTNER_ID";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script><script type="text/javascript">
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>
<noscript>
<img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=YOUR_PARTNER_ID&fmt=gif" />
</noscript>
```

---

## Step 4: Test the Form

### Test 1: Basic Form Submission

1. Open `index.html` in a browser
2. Fill out the form with test data
3. Submit the form
4. Check Supabase:

```sql
SELECT
    email,
    first_name,
    last_name,
    company,
    first_touch_utm_source,
    first_touch_landing_page,
    lead_status,
    created_at
FROM Leads
ORDER BY created_at DESC
LIMIT 5;
```

You should see your test lead.

### Test 2: UTM Parameter Capture

Visit your landing page with UTM parameters:

```
https://yoursite.com/?utm_source=google&utm_medium=cpc&utm_campaign=sales-coaching-2025&utm_term=sales+coaching+software&utm_content=hero-cta
```

Submit the form and verify all UTM parameters are captured:

```sql
SELECT
    email,
    first_touch_utm_source,      -- Should be "google"
    first_touch_utm_medium,       -- Should be "cpc"
    first_touch_utm_campaign,     -- Should be "sales-coaching-2025"
    first_touch_utm_term,         -- Should be "sales+coaching+software"
    first_touch_utm_content,      -- Should be "hero-cta"
    first_touch_landing_page,     -- Should be full URL with params
    first_touch_referrer          -- Should show where you came from
FROM Leads
WHERE email = 'your-test-email@example.com';
```

### Test 3: Lead Source Mapping

Verify the Lead Source was correctly identified:

```sql
SELECT
    l.email,
    l.first_touch_utm_source,
    l.first_touch_utm_medium,
    ls.source_name,
    ls.source_category
FROM Leads l
LEFT JOIN Lead_Sources ls ON l.first_touch_source_id = ls.id
WHERE l.email = 'your-test-email@example.com';
```

If `source_name` is showing correctly (e.g., "Google Ads" for utm_source=google + utm_medium=cpc), the mapping is working.

### Test 4: Enrichment Trigger

If you've deployed the lead enrichment workflow (from lead-enrichment-workflow.json):

1. Submit a test lead
2. Wait 2-3 minutes
3. Check enrichment status:

```sql
SELECT
    l.email,
    l.enrichment_status,
    l.quality_score,
    l.lead_grade,
    le.linkedin_current_title,
    le.company_size,
    le.market_position
FROM Leads l
LEFT JOIN Lead_Enrichment le ON l.id = le.lead_id
WHERE l.email = 'your-test-email@example.com';
```

You should see `enrichment_status = 'completed'` and quality score calculated.

---

## Step 5: Deploy to Production

### Hosting Options

**Option 1: Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /path/to/landing-page
vercel
```

Follow prompts to deploy. Vercel will give you a production URL.

**Option 2: Netlify**

1. Go to https://app.netlify.com
2. Drag and drop your `landing-page` folder
3. Set up custom domain (optional)

**Option 3: CloudFlare Pages**

```bash
# Install Wrangler
npm install -g wrangler

# Deploy
wrangler pages deploy landing-page
```

**Option 4: Traditional Hosting (cPanel, Apache, Nginx)**

Upload files via FTP/SFTP to your web server's public directory.

### Custom Domain Setup

1. **Update form action** - If using a custom domain, update the `SUPABASE_URL` to use your domain's CORS settings:

   In Supabase Dashboard:
   - Go to **Settings** > **API** > **CORS**
   - Add your domain: `https://yourdomain.com`

2. **SSL Certificate** - Ensure your domain has HTTPS (required for secure form submission)

3. **DNS Configuration** - Point your domain to your hosting provider

---

## Step 6: Set Up UTM Campaigns

### Google Ads Campaign URLs

Use Google's Campaign URL Builder or create URLs manually:

```
https://salesai.coach/?utm_source=google&utm_medium=cpc&utm_campaign=sales-coaching-q1-2025&utm_term=ai+sales+coaching&utm_content=text-ad-1
```

**Recommended UTM Structure:**

- **utm_source**: `google`, `facebook`, `linkedin`, `twitter`, `email`
- **utm_medium**: `cpc` (paid ads), `social` (organic social), `email`, `referral`
- **utm_campaign**: Campaign name, e.g., `sales-coaching-q1-2025`
- **utm_term**: Keyword for paid search (e.g., `ai+sales+coaching`)
- **utm_content**: Ad variant (e.g., `text-ad-1`, `hero-cta`, `sidebar-banner`)

### Facebook Ads

In Facebook Ads Manager:
1. Go to Ad Set > Tracking
2. Add URL parameters:
   ```
   utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
   ```

### LinkedIn Ads

In LinkedIn Campaign Manager:
1. Edit Campaign > Campaign Details
2. Add URL parameters:
   ```
   utm_source=linkedin&utm_medium=cpc&utm_campaign={{campaign.id}}&utm_content={{creative.id}}
   ```

---

## Attribution Reports

Once leads are coming in, use these queries to measure campaign performance:

### Campaign ROI

```sql
SELECT * FROM Campaign_Performance
ORDER BY roi_percentage DESC;
```

### Lead Source Performance

```sql
SELECT * FROM Lead_Source_Performance
ORDER BY conversion_rate DESC;
```

### High-Value Leads by Source

```sql
SELECT
    ls.source_name,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE l.quality_score >= 80) as high_value_leads,
    ROUND(AVG(l.quality_score), 1) as avg_quality_score,
    SUM(l.opportunity_value) as total_pipeline_value
FROM Leads l
JOIN Lead_Sources ls ON l.first_touch_source_id = ls.id
WHERE l.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ls.source_name
ORDER BY high_value_leads DESC;
```

---

## Troubleshooting

### Issue: Form submission fails with CORS error

**Solution:** Add your domain to Supabase CORS whitelist:
1. Supabase Dashboard > Settings > API > CORS
2. Add: `https://yourdomain.com`

### Issue: UTM parameters not captured

**Solution:** Verify JavaScript is enabled and check browser console for errors. Ensure:
```javascript
document.getElementById('utm_source').value = utmParams.utm_source;
```
Is executing correctly.

### Issue: Lead Source ID is null

**Solution:** The Lead_Sources lookup query may be failing. Check:
1. Lead_Sources table has data (19 default sources should exist)
2. source_name matches your UTM source (case-insensitive)
3. CORS allows API requests from your domain

### Issue: Enrichment not triggering

**Solution:** Verify:
1. n8n workflow is active
2. Supabase trigger webhook is configured
3. Lead_Enrichment_Log shows errors:
   ```sql
   SELECT * FROM Lead_Enrichment_Log
   WHERE status = 'failed'
   ORDER BY created_at DESC;
   ```

---

## Next Steps

1. ✅ **Configure Supabase Credentials** - Add your project URL and anon key
2. ✅ **Test Form Submission** - Submit test lead and verify in database
3. ✅ **Deploy to Production** - Use Vercel, Netlify, or your hosting provider
4. ✅ **Set Up Analytics** - Add Google Analytics, Facebook Pixel, LinkedIn Insight
5. ✅ **Create UTM Campaigns** - Build tracking URLs for Google Ads, Facebook Ads, LinkedIn Ads
6. ⏳ **Build Attribution Dashboard** - Create frontend to visualize lead sources and campaign ROI
7. ⏳ **Monitor Performance** - Track conversion rates, quality scores, and campaign ROI

---

## Security Best Practices

1. **Use HTTPS Only** - Never use HTTP for form submission (exposes data)
2. **Anon Key is Public** - The `SUPABASE_ANON_KEY` is safe for client-side use (it's public)
3. **RLS Policies** - Ensure Row Level Security policies are enabled on Leads table
4. **Rate Limiting** - Consider adding rate limiting to prevent spam submissions
5. **Input Validation** - The form includes basic HTML5 validation, but add server-side validation for production

### Recommended RLS Policy for Leads Table

```sql
-- Allow public to insert leads (but not read/update/delete)
CREATE POLICY allow_public_insert ON Leads
FOR INSERT
TO anon
WITH CHECK (true);

-- Admin can do everything
CREATE POLICY admin_all_access ON Leads
FOR ALL
TO authenticated
USING (
    auth.jwt() ->> 'email' IN ('admin@aiadvantagesolutions.com', 'john@aiadvantagesolutions.com')
);
```

This allows anonymous users to submit leads but not view or modify them.

---

## Cost Estimation

**Per 1000 Form Submissions:**

| Service | Cost | Notes |
|---------|------|-------|
| Supabase | Free | Up to 50,000 rows (Free tier) |
| Hosting (Vercel) | Free | Unlimited bandwidth (Hobby tier) |
| Lead Enrichment | $7.50-15.50 | See LEAD-ENRICHMENT-DEPLOYMENT.md |
| **Total** | **~$7.50-15.50** | **Only if enrichment enabled** |

**Without enrichment:** Free (Supabase + Vercel free tiers)

---

## Support

Questions or issues? Contact:
- Email: admin@aiadvantagesolutions.com
- GitHub: [Your repo URL]
