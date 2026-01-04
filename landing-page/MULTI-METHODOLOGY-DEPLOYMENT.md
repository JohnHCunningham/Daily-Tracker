# Multi-Methodology Sales Coaching Dashboard - Complete Deployment Guide

## 🎯 Overview

The Manager Coaching Dashboard now supports **ALL major sales methodologies**, not just Sandler. The system dynamically detects each user's methodology and displays the appropriate insights.

### ✅ Supported Methodologies

1. **Sandler** - Upfront Contract, Pain Funnel, Budget, Decision Process, Talk Ratio
2. **MEDDIC** - Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion
3. **Challenger** - Teach, Tailor, Take Control, Constructive Tension
4. **SPIN** - Situation, Problem, Implication, Need-Payoff Questions
5. **Gap Selling** - Current State, Future State, Gap, Impact, Root Cause
6. **Value Selling** - Business Value, Value Quantification, Personal Value, ROI

---

## 📂 New Files Created

### 1. Database Schema Extension
**File:** `/Users/johncunningham/Daily-Tracker/landing-page/multi-methodology-schema.sql`

**What it does:**
- Adds `methodology` column to `Conversation_Analyses` table
- Adds fields for all 6 methodologies (MEDDIC, Challenger, SPIN, Gap Selling, Value Selling)
- Creates `Methodology_Performance_Summary` view for reporting
- Adds `get_user_methodology()` function to detect user's methodology
- Creates RLS policies for multi-user access

### 2. Analysis Functions
**File:** `/Users/johncunningham/Daily-Tracker/landing-page/multi-methodology-functions.sql`

**What it does:**
- `analyze_meddic_execution()` - Analyzes MEDDIC component execution
- `analyze_challenger_execution()` - Analyzes Challenger selling execution
- `analyze_spin_execution()` - Analyzes SPIN questioning patterns
- `analyze_gap_selling_execution()` - Analyzes Gap Selling framework
- `analyze_value_selling_execution()` - Analyzes Value Selling approach
- All functions return coaching prompts and severity levels

### 3. Updated Frontend Files
**Files Modified:**
- `/Users/johncunningham/Daily-Tracker/landing-page/admin-team.html`
- `/Users/johncunningham/Daily-Tracker/landing-page/admin-team-detail.html`

**Changes:**
- Dynamic methodology detection from user metadata
- Methodology-specific analysis functions for each framework
- Automatic routing to correct analysis based on user's methodology
- All 6 methodologies fully supported in UI

---

## 🚀 Deployment Steps

### Step 1: Deploy Database Schema (REQUIRED)

**Navigate to Supabase SQL Editor:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar

**Run Schema Migration:**
```sql
-- Copy entire contents of multi-methodology-schema.sql
-- Paste into SQL Editor
-- Click "Run"
```

**Expected Output:**
```
✅ Multi-Methodology Schema Updated!
   📊 Supported Methodologies:
      • Sandler (existing + enhanced)
      • MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion)
      • Challenger (Teach, Tailor, Take Control)
      • SPIN (Situation, Problem, Implication, Need-Payoff)
      • Gap Selling (Current State, Future State, Gap, Impact)
      • Value Selling (Business Value, Personal Value, ROI)
```

**Verify Schema:**
```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Conversation_Analyses'
AND column_name LIKE 'meddic%' OR column_name LIKE 'challenger%'
ORDER BY column_name;

-- Should see 40+ new columns for all methodologies
```

### Step 2: Deploy Analysis Functions (REQUIRED)

**In Supabase SQL Editor:**
```sql
-- Copy entire contents of multi-methodology-functions.sql
-- Paste into SQL Editor
-- Click "Run"
```

**Expected Output:**
```
✅ Multi-Methodology Analysis Functions Created!
   📊 Functions Available:
      • analyze_meddic_execution()
      • analyze_challenger_execution()
      • analyze_spin_execution()
      • analyze_gap_selling_execution()
      • analyze_value_selling_execution()
```

**Verify Functions:**
```sql
-- List all new functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'analyze_%_execution';

-- Should show 5 new functions
```

### Step 3: Update Frontend Files (Automatic - Already Done)

✅ `admin-team.html` - Updated with multi-methodology support
✅ `admin-team-detail.html` - Updated with all methodology analysis functions

**No action needed** - files already updated with dynamic methodology detection.

### Step 4: Set User Methodologies

**For each user, set their methodology in Supabase:**

**Option A: Via SQL (Recommended for bulk updates)**
```sql
-- Update user's methodology in metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"methodology": "MEDDIC"}'::jsonb
WHERE email = 'user@example.com';

-- Batch update multiple users
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"methodology": "Challenger"}'::jsonb
WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com');
```

**Option B: Via Supabase Dashboard**
1. Go to Authentication → Users
2. Click on user
3. Scroll to "User Metadata"
4. Add: `"methodology": "MEDDIC"` (or other methodology)
5. Save

**Valid Methodology Values:**
- `"Sandler"`
- `"MEDDIC"`
- `"Challenger"`
- `"SPIN"`
- `"Gap Selling"`
- `"Value Selling"`
- `"Custom"` (falls back to Sandler analysis)

### Step 5: Create Sample Conversation Data (Optional but Recommended)

**To test each methodology, create sample conversation analyses:**

**MEDDIC Example:**
```sql
INSERT INTO Conversation_Analyses (
    user_id,
    conversation_title,
    methodology,
    transcript,
    meddic_metrics_identified,
    meddic_economic_buyer_identified,
    meddic_decision_criteria_mapped,
    meddic_decision_process_defined,
    meddic_pain_identified,
    meddic_champion_secured,
    overall_meddic_score
) VALUES (
    'USER_UUID_HERE',
    'Enterprise Discovery Call - Acme Corp',
    'MEDDIC',
    'Sample transcript here...',
    TRUE,  -- Metrics identified
    TRUE,  -- Economic buyer identified
    FALSE, -- Decision criteria NOT mapped
    TRUE,  -- Decision process defined
    TRUE,  -- Pain identified
    FALSE, -- Champion NOT secured
    7.5    -- Overall score
);
```

**Challenger Example:**
```sql
INSERT INTO Conversation_Analyses (
    user_id,
    conversation_title,
    methodology,
    transcript,
    challenger_teach_executed,
    challenger_tailor_executed,
    challenger_control_executed,
    challenger_tension_created,
    overall_challenger_score
) VALUES (
    'USER_UUID_HERE',
    'Commercial Insight Call - Beta Industries',
    'Challenger',
    'Sample transcript here...',
    TRUE,  -- Teaching executed
    TRUE,  -- Tailored message
    FALSE, -- Did NOT take control
    TRUE,  -- Created tension
    7.0    -- Overall score
);
```

**SPIN Example:**
```sql
INSERT INTO Conversation_Analyses (
    user_id,
    conversation_title,
    methodology,
    transcript,
    spin_situation_asked,
    spin_situation_count,
    spin_problem_asked,
    spin_problem_count,
    spin_implication_asked,
    spin_implication_count,
    spin_needpayoff_asked,
    spin_needpayoff_count,
    overall_spin_score
) VALUES (
    'USER_UUID_HERE',
    'Discovery Call - Gamma Solutions',
    'SPIN',
    'Sample transcript here...',
    TRUE, 3,  -- 3 situation questions
    TRUE, 5,  -- 5 problem questions
    TRUE, 2,  -- 2 implication questions
    TRUE, 3,  -- 3 need-payoff questions
    8.0       -- Overall score
);
```

---

## 🧪 Testing Guide

### Test 1: Verify Schema Migration

```sql
-- Check methodology column exists
SELECT methodology, COUNT(*) as count
FROM Conversation_Analyses
GROUP BY methodology;

-- Check new MEDDIC fields
SELECT COUNT(*) as meddic_rows
FROM Conversation_Analyses
WHERE meddic_metrics_identified IS NOT NULL;

-- Check new Challenger fields
SELECT COUNT(*) as challenger_rows
FROM Conversation_Analyses
WHERE challenger_teach_executed IS NOT NULL;
```

### Test 2: Verify Analysis Functions Work

```sql
-- Test MEDDIC analysis
SELECT * FROM analyze_meddic_execution('USER_UUID_HERE', 30);

-- Test Challenger analysis
SELECT * FROM analyze_challenger_execution('USER_UUID_HERE', 30);

-- Test SPIN analysis
SELECT * FROM analyze_spin_execution('USER_UUID_HERE', 30);

-- Test Gap Selling analysis
SELECT * FROM analyze_gap_selling_execution('USER_UUID_HERE', 30);

-- Test Value Selling analysis
SELECT * FROM analyze_value_selling_execution('USER_UUID_HERE', 30);
```

**Expected Output:**
Each function should return rows with:
- `component` - Methodology component name
- `execution_rate` - Percentage (0-100)
- `calls_executed` - Number of calls where component was executed
- `calls_analyzed` - Total calls analyzed
- `severity` - 'high', 'medium', or 'low'
- `coaching_prompt` - Specific coaching advice
- `detail_note` - Explanation of what the component is

### Test 3: Test Frontend Display

**For each methodology:**

1. **Set user methodology:**
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = raw_user_meta_data || '{"methodology": "MEDDIC"}'::jsonb
   WHERE email = 'testuser@example.com';
   ```

2. **Create sample conversation data** (use examples above)

3. **Open admin-team.html:**
   - Sign in as admin
   - Find the user's card
   - **Expected:** Card shows MEDDIC-specific insights like "Metrics: Missing in 6 of 10 calls"

4. **Click user card → Open detail view:**
   - **Expected:** Methodology Execution panel shows MEDDIC components (Metrics, Economic Buyer, etc.)
   - **Expected:** Each component has progress bar and coaching note
   - **Expected:** Severity colors match execution rates

5. **Repeat for each methodology:**
   - Sandler
   - MEDDIC
   - Challenger
   - SPIN
   - Gap Selling
   - Value Selling

---

## 🎨 What Each Methodology Shows

### Sandler (Default)
**Team Card:** "Upfront Contract: Missing in 6/10 calls"
**Detail Components:**
- Upfront Contract
- Pain Funnel
- Budget Discussion
- Decision Process
- Talk Ratio

### MEDDIC
**Team Card:** "Metrics: Not identified in 7/10 calls"
**Detail Components:**
- Metrics (M)
- Economic Buyer (E)
- Decision Criteria (D)
- Decision Process (D)
- Identify Pain (I)
- Champion (C)

### Challenger
**Team Card:** "Teach: No commercial insight in 8/10 calls"
**Detail Components:**
- Teach (Commercial Insight)
- Tailor (Personalization)
- Take Control (Assertiveness)
- Constructive Tension
- Reframe Thinking

### SPIN
**Team Card:** "Implication Questions: Missing in 9/10 calls"
**Detail Components:**
- Situation Questions (avg count per call)
- Problem Questions (avg count per call)
- Implication Questions (avg count per call)
- Need-Payoff Questions (avg count per call)

### Gap Selling
**Team Card:** "Gap Identification: Not quantified in 7/10 calls"
**Detail Components:**
- Current State Discovery
- Future State Vision
- Gap Identification
- Impact Quantification
- Root Cause Analysis

### Value Selling
**Team Card:** "Value Quantification: Missing numbers in 8/10 calls"
**Detail Components:**
- Business Value Discussion
- Value Quantification
- Personal Value Discussion
- ROI Presentation

---

## 📊 Methodology Field Mapping

### MEDDIC Fields in Database
```
meddic_metrics_identified (BOOLEAN)
meddic_metrics_score (DECIMAL)
meddic_economic_buyer_identified (BOOLEAN)
meddic_economic_buyer_score (DECIMAL)
meddic_decision_criteria_mapped (BOOLEAN)
meddic_decision_criteria_score (DECIMAL)
meddic_decision_process_defined (BOOLEAN)
meddic_decision_process_score (DECIMAL)
meddic_pain_identified (BOOLEAN)
meddic_pain_score (DECIMAL)
meddic_champion_secured (BOOLEAN)
meddic_champion_score (DECIMAL)
overall_meddic_score (DECIMAL)
```

### Challenger Fields
```
challenger_teach_executed (BOOLEAN)
challenger_teach_score (DECIMAL)
challenger_tailor_executed (BOOLEAN)
challenger_tailor_score (DECIMAL)
challenger_control_executed (BOOLEAN)
challenger_control_score (DECIMAL)
challenger_tension_created (BOOLEAN)
challenger_tension_score (DECIMAL)
challenger_reframe_attempted (BOOLEAN)
overall_challenger_score (DECIMAL)
```

### SPIN Fields
```
spin_situation_asked (BOOLEAN)
spin_situation_count (INTEGER)
spin_situation_score (DECIMAL)
spin_problem_asked (BOOLEAN)
spin_problem_count (INTEGER)
spin_problem_score (DECIMAL)
spin_implication_asked (BOOLEAN)
spin_implication_count (INTEGER)
spin_implication_score (DECIMAL)
spin_needpayoff_asked (BOOLEAN)
spin_needpayoff_count (INTEGER)
spin_needpayoff_score (DECIMAL)
overall_spin_score (DECIMAL)
```

### Gap Selling Fields
```
gap_current_state_discovered (BOOLEAN)
gap_current_state_score (DECIMAL)
gap_future_state_defined (BOOLEAN)
gap_future_state_score (DECIMAL)
gap_identified (BOOLEAN)
gap_score (DECIMAL)
gap_impact_quantified (BOOLEAN)
gap_root_cause_found (BOOLEAN)
overall_gap_score (DECIMAL)
```

### Value Selling Fields
```
value_business_discussed (BOOLEAN)
value_business_score (DECIMAL)
value_business_quantified (BOOLEAN)
value_personal_discussed (BOOLEAN)
value_personal_score (DECIMAL)
value_roi_presented (BOOLEAN)
value_roi_score (DECIMAL)
overall_value_score (DECIMAL)
```

---

## 🔍 Troubleshooting

### Issue: Dashboard shows Sandler for all users

**Cause:** User methodology not set in metadata

**Fix:**
```sql
-- Check current methodology setting
SELECT email, raw_user_meta_data->>'methodology' as methodology
FROM auth.users;

-- Set methodology for users who don't have one
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"methodology": "MEDDIC"}'::jsonb
WHERE email = 'user@example.com';
```

### Issue: "No data available" for all methodologies

**Cause:** No conversation analyses exist with methodology set

**Fix:**
```sql
-- Check existing conversations
SELECT methodology, COUNT(*)
FROM Conversation_Analyses
GROUP BY methodology;

-- Update existing conversations to match user methodology
UPDATE Conversation_Analyses
SET methodology = (
    SELECT raw_user_meta_data->>'methodology'
    FROM auth.users
    WHERE id = Conversation_Analyses.user_id
)
WHERE methodology IS NULL;
```

### Issue: Analysis function returns 0% for all components

**Cause:** Boolean fields are NULL instead of FALSE

**Fix:**
```sql
-- Set NULL values to FALSE for MEDDIC
UPDATE Conversation_Analyses
SET
    meddic_metrics_identified = COALESCE(meddic_metrics_identified, FALSE),
    meddic_economic_buyer_identified = COALESCE(meddic_economic_buyer_identified, FALSE),
    meddic_decision_criteria_mapped = COALESCE(meddic_decision_criteria_mapped, FALSE),
    meddic_decision_process_defined = COALESCE(meddic_decision_process_defined, FALSE),
    meddic_pain_identified = COALESCE(meddic_pain_identified, FALSE),
    meddic_champion_secured = COALESCE(meddic_champion_secured, FALSE)
WHERE methodology = 'MEDDIC';

-- Repeat for other methodologies as needed
```

### Issue: Methodology not appearing in UI

**Cause:** Methodology name mismatch (case-sensitive)

**Valid Values:**
- `"Sandler"` ✅
- `"MEDDIC"` ✅
- `"Challenger"` ✅
- `"SPIN"` ✅
- `"Gap Selling"` ✅ (note the space)
- `"Value Selling"` ✅ (note the space)

**Invalid Values:**
- `"sandler"` ❌ (lowercase)
- `"Meddic"` ❌ (wrong case)
- `"GapSelling"` ❌ (no space)

---

## ✅ Success Criteria

**Deployment is successful when:**

1. ✅ Schema migration runs without errors
2. ✅ All 5 new analysis functions exist in database
3. ✅ User methodology can be set in auth.users metadata
4. ✅ Team card shows methodology-specific insights (not generic Sandler for everyone)
5. ✅ Detail page displays correct methodology components
6. ✅ Each methodology shows different components:
   - Sandler: 5 components (Upfront Contract, Pain Funnel, Budget, Decision, Talk Ratio)
   - MEDDIC: 6 components (M-E-D-D-I-C)
   - Challenger: 4-5 components (Teach, Tailor, Control, Tension)
   - SPIN: 4 components (Situation, Problem, Implication, Need-Payoff)
   - Gap Selling: 5 components (Current, Future, Gap, Impact, Root Cause)
   - Value Selling: 4 components (Business, Quantification, Personal, ROI)
7. ✅ Coaching prompts are methodology-specific
8. ✅ Progress bars and severity colors work correctly
9. ✅ Manager can add notes for users with any methodology
10. ✅ Users see methodology-specific feedback in their dashboard

---

## 🎉 What's Been Delivered

### Database Layer
- ✅ 40+ new fields for 5 additional methodologies
- ✅ Methodology detection function
- ✅ 5 methodology-specific analysis functions
- ✅ Performance summary view supporting all methodologies
- ✅ RLS policies for secure multi-user access

### Frontend Layer
- ✅ Dynamic methodology detection from user metadata
- ✅ 6 methodology-specific analysis functions in JavaScript
- ✅ Automatic routing to correct methodology analyzer
- ✅ Methodology-aware coaching prompts
- ✅ Team cards showing methodology-specific insights
- ✅ Detail pages with methodology-specific breakdowns

### Supported Use Cases
- ✅ Enterprise sales teams using MEDDIC
- ✅ Challenger sales organizations
- ✅ SPIN Selling practitioners
- ✅ Gap Selling methodology users
- ✅ Value-based selling teams
- ✅ Traditional Sandler users
- ✅ Mixed methodology teams (each user can have different methodology)

---

## 🚀 Next Steps (Optional Enhancements)

### 1. AI-Powered Conversation Analysis
Integrate with Gemini/Claude to automatically analyze call transcripts and populate methodology fields.

### 2. Methodology Switching
Allow managers to change a user's methodology and re-analyze past conversations.

### 3. Hybrid Methodologies
Support users who combine multiple methodologies (e.g., "Sandler + MEDDIC").

### 4. Benchmark Reports
Show team averages across methodologies for comparison.

### 5. Methodology Training Content
Link each component to training resources and best practices.

---

## 📞 Support

**For deployment issues:**
- Check Supabase logs: Dashboard → Database → Logs
- Verify schema: `\d Conversation_Analyses` in SQL editor
- Check function exists: `\df analyze_*_execution`

**For data issues:**
- Verify methodology field: `SELECT DISTINCT methodology FROM Conversation_Analyses;`
- Check user metadata: `SELECT email, raw_user_meta_data FROM auth.users;`
- Test analysis function: `SELECT * FROM analyze_meddic_execution('user_id', 30);`

---

## 🎯 Conclusion

Your Manager Coaching Dashboard now supports **6 major sales methodologies** with full dynamic detection and analysis. Each user sees insights specific to their methodology, and managers get methodology-aware coaching prompts.

**Ready to deploy:** Follow the 5 steps above to go live!
