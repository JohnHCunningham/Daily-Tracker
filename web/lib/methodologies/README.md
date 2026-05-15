# Sales Methodology Coaching Prompts

## Overview

This directory contains **in-depth, methodology-specific coaching prompts** for One Click Coaching. Each prompt creates a genuinely different coaching experience - not just different terminology, but different personality, diagnostic approach, frameworks, and language patterns.

## Completed Methodologies

### 1. **Sandler Selling System**
**File:** `sandler-selling-prompt.md` (already implemented in Challenger example)
- **Coaching Personality:** Tough-love psychologist who calls out games
- **Core Philosophy:** Qualify ruthlessly, no convincing
- **Primary Tools:** Pain Funnel, Negative Reversals, Upfront Contracts
- **Best For:** Transactional to mid-complexity sales, one-on-one
- **Key Differentiator:** Only methodology that celebrates disqualification

### 2. **Challenger Sale**
**File:** Already implemented (Challenger example provided)
- **Coaching Personality:** Contrarian professor who reframes reality
- **Core Philosophy:** Win by teaching, not listening
- **Primary Tools:** Commercial Insights, Stakeholder Tailoring, Teaching Framework
- **Best For:** Complex B2B, competitive markets, status quo disruption
- **Key Differentiator:** Leads with teaching before needs discovery

### 3. **SPIN Selling**
**File:** `spin-selling-prompt.md`
- **Coaching Personality:** Patient Socratic mentor who builds logic step-by-step
- **Core Philosophy:** Build explicit need through question sequences
- **Primary Tools:** S→P→I→N Questions, Implication Building, Need-Payoff
- **Best For:** Large sales ($100K+), long cycles, committees
- **Key Differentiator:** Research-based (35,000 calls), Implication questions make small problems big

### 4. **Gap Selling**
**File:** `gap-selling-prompt.md`
- **Coaching Personality:** Clinical diagnostician who won't prescribe until diagnosis is complete
- **Core Philosophy:** Diagnose problem before prescribing solution
- **Primary Tools:** Impact Tables, Root Cause Analysis, Current vs Future State
- **Best For:** Complex B2B, custom solutions, problem-centric selling
- **Key Differentiator:** Refuses to present solutions until problem is quantified

### 5. **MEDDPICC**
**File:** `meddpicc-prompt.md`
- **Coaching Personality:** Deal strategist / political consultant who tests rigor
- **Core Philosophy:** Master deal structure & politics through 8-element qualification
- **Primary Tools:** 8-Element Checklist, Champion Strength Testing, MEDDPICC Scorecard
- **Best For:** Enterprise sales ($250K+ ACV), 6-10+ stakeholders, political deals
- **Key Differentiator:** Only methodology with structural 8-element framework, Champion vs Coach distinction

---

## How They're Different (Not Just Terminologically)

| **Aspect** | **Sandler** | **Challenger** | **SPIN** | **Gap** | **MEDDPICC** |
|------------|-------------|----------------|----------|---------|--------------|
| **Core Question** | "Is this real or hope?" | "Are you teaching them something new?" | "Have you built explicit need?" | "What's the gap between current and future state?" | "Do you have all 8 elements?" |
| **Primary Diagnostic** | Pain Funnel | Commercial Insight | Question Sequence | Impact Table | 8-Element Checklist |
| **Coaching Voice** | Psychologist | Professor | Strategist | Doctor | Architect |
| **Success Metric** | Disqualification rate ↑ | Stakeholder engagement | Implication:Situation ratio | Gap value quantified | MEDDPICC score 7+ |
| **Celebrates** | Disqualifying fast | Teaching moments | Buyer articulating need | Diagnostic precision | Qualification rigor |
| **Language** | "That's hope, not a deal" | "What would surprise them?" | "What question builds need?" | "That's a symptom - what's the root cause?" | "Prove it - how do you know?" |

---

## Implementation Plan

### Phase 1: Update Settings UI ✅ COMPLETE
- [x] Added methodology field to database schema (already exists)
- [x] Created methodology selector in settings page
- [x] Users can now select: Sandler, MEDDIC, Challenger, SPIN, Gap Selling

### Phase 2: Copilot Integration (NEXT - After Audit)
**Goal:** Use the selected methodology to power the coaching copilot

**Files to Update:**
1. `/app/api/copilot/chat/route.ts`:
   - Currently hardcoded to Sandler (`sales-copilot-intents.json`)
   - Update to load methodology-specific prompts based on user's account setting

2. Create methodology-specific intent files:
   - `spin-intents.json` (based on SPIN question types)
   - `gap-intents.json` (based on Gap diagnostic questions)
   - `meddpicc-intents.json` (based on MEDDPICC elements)
   - `challenger-intents.json` (based on Teach-Tailor-Take Control)

3. Update copilot to:
   ```typescript
   // Fetch user's methodology from account settings
   const { data: account } = await supabase
     .from('Accounts')
     .select('methodology')
     .eq('id', userData.account_id)
     .single()

   // Load methodology-specific prompt and intents
   const methodology = account?.methodology || 'sandler'
   const prompt = await loadMethodologyPrompt(methodology)
   const intents = await loadMethodologyIntents(methodology)
   ```

### Phase 3: Intent File Structure

Each methodology needs a JSON file with intents structured like this:

```json
[
  {
    "name": "intent_name",
    "stage": "Stage in methodology",
    "sample_user_utterances": [
      "How do I...",
      "Help me with...",
      "What should I ask..."
    ],
    "bot_behavior": "How the coach should respond",
    "response_templates": [
      "Template 1 with methodology-specific language",
      "Template 2 with examples"
    ]
  }
]
```

### Phase 4: Logo/Branding Integration
**User Request:** Add logo to brand settings

**Current Issue:** Claude Code settings.json doesn't support a "brand" field

**Options:**
1. Store logo URL in Accounts table (already exists: `logo_url` field)
2. Display logo in app based on account settings
3. No Claude Code settings changes needed - this is app-level branding

---

## Copilot Usage Context (From User)

**Important Note:**
> "Keep in mind we want to use co-pilot to prepare for the sales approach. Co-pilot isn't complete yet. I will do that after our audit."

**Implications:**
- Copilot should be used **proactively** (prepare for calls) not just **reactively** (during calls)
- Example use cases:
  - Rep about to call a prospect: "I'm calling [Company] about [problem]. How should I approach this using [methodology]?"
  - Prep for discovery: "Give me 5 SPIN Implication questions for a prospect struggling with [pain]"
  - Deal review: "Run a MEDDPICC audit on this deal - here's what I know so far..."

---

## Next Steps (After Audit)

1. **Create Intent Files:**
   - Convert each methodology prompt into structured intents
   - Ensure each intent has 3-5 sample utterances
   - Write 2-3 response templates per intent

2. **Update Copilot API:**
   - Load methodology from account settings
   - Select appropriate prompt and intents
   - Use methodology-specific system message for Claude

3. **Test Each Methodology:**
   - Verify coaching voice is distinct
   - Ensure advice matches methodology philosophy
   - Validate that responses don't feel repetitive across methodologies

4. **Create Hybrid Options (Future):**
   - Some teams use multiple methodologies
   - Example: "MEDDPICC + Challenger" for enterprise sales
   - Allow custom methodology combinations

---

## Files Created

```
/lib/methodologies/
├── README.md                       (this file)
├── spin-selling-prompt.md          ✅ Complete
├── gap-selling-prompt.md           ✅ Complete
├── meddpicc-prompt.md              ✅ Complete
├── sandler-selling-prompt.md       (reference: see Challenger example)
├── challenger-selling-prompt.md    (reference: user provided)
│
└── /intents/ (to be created)
    ├── sandler-intents.json        (exists as sales-copilot-intents.json)
    ├── challenger-intents.json     (to be created)
    ├── spin-intents.json           (to be created)
    ├── gap-intents.json            (to be created)
    └── meddpicc-intents.json       (to be created)
```

---

## Quality Checklist

Each methodology prompt includes:
- ✅ Distinct coaching personality (not just renamed)
- ✅ Methodology-specific frameworks (not generic)
- ✅ Unique diagnostic questions
- ✅ Different language patterns
- ✅ Failure modes and when to use
- ✅ Success metrics that matter for that methodology
- ✅ Response format that fits the coaching style
- ✅ Real differentiation (not just terminology swaps)

---

## Research Sources

All prompts built from authoritative sources:
- **SPIN:** Neil Rackham's 35,000-call research (1988)
- **Gap:** Keenan's "Gap Selling" (2018)
- **MEDDPICC:** PTC research (1996), MEDDIC Academy
- **Sandler:** David Sandler methodology (1960s-70s)
- **Challenger:** CEB research, 6,000 sales reps (2011)

See individual prompt files for detailed source citations.
