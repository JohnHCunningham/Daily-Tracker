/**
 * SANDLER KNOWLEDGE BASE SEEDING SCRIPT
 *
 * This script parses Sandler methodology content and seeds the RAG knowledge base.
 *
 * Run with: npx ts-node scripts/seed-knowledge-base.ts
 * Or with Deno: deno run --allow-net --allow-env --allow-read scripts/seed-knowledge-base.ts
 *
 * Required environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY
 */

// Types
interface Chunk {
  content_type: string;
  component_name: string | null;
  chunk_title: string;
  chunk_text: string;
  situation_tags: string[];
  weakness_tags: string[];
  source_file: string;
  chunk_index: number;
}

interface SuggestedLanguage {
  situation: string;
  script: string;
  whyItWorks: string;
}

interface ComponentData {
  name: string;
  description: string;
  weight: number;
  indicators: {
    excellent: string[];
    good: string[];
    needsWork: string[];
  };
  suggestedLanguage: SuggestedLanguage[];
}

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || Deno?.env?.get?.("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || Deno?.env?.get?.("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || Deno?.env?.get?.("OPENAI_API_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error("Missing required environment variables:");
  console.error("  SUPABASE_URL:", SUPABASE_URL ? "set" : "MISSING");
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING");
  console.error("  OPENAI_API_KEY:", OPENAI_API_KEY ? "set" : "MISSING");
  process.exit?.(1) || Deno?.exit?.(1);
}

// ============================================
// SANDLER METHODOLOGY DATA
// (Extracted from sandler-methodology.ts)
// ============================================

const SANDLER_COMPONENTS: Record<string, ComponentData> = {
  BONDING_RAPPORT: {
    name: "Bonding & Rapport",
    description: "Building genuine connection and trust before business discussion",
    weight: 0.10,
    indicators: {
      excellent: [
        "Found genuine common ground (not forced small talk)",
        "Matched prospect's communication style and pace",
        "Used prospect's name naturally throughout",
        "Showed genuine curiosity about their world",
        "Created 'OK to be honest' atmosphere"
      ],
      good: [
        "Made personal connection attempt",
        "Showed interest in prospect beyond the deal",
        "Listened more than talked initially"
      ],
      needsWork: [
        "Jumped straight to business",
        "Forced or awkward rapport attempts",
        "Talked about self rather than prospect",
        "Used canned icebreakers"
      ]
    },
    suggestedLanguage: [
      {
        situation: "Opening a cold call",
        script: "Hi [Name], I'm not sure if we should even be talking, but I came across [specific thing about their company] and got curious about how you're handling [relevant challenge]. Do you have a moment to see if there's a fit, or should I circle back?",
        whyItWorks: "Lowers resistance by being direct about uncertainty, shows research, gives them control"
      },
      {
        situation: "Building rapport in discovery",
        script: "Before we dive in, I'm curious - how did you end up in [their role]? What drew you to [their industry]?",
        whyItWorks: "People love talking about their journey; creates genuine connection beyond the transaction"
      },
      {
        situation: "When prospect seems guarded",
        script: "I get the sense you've been through this process before and maybe didn't have the best experience. Would it help if I shared what typically goes wrong in these conversations so we can avoid that?",
        whyItWorks: "Acknowledges their skepticism, positions you as different, creates safety"
      },
      {
        situation: "Matching their energy",
        script: "[If they're direct] Let me cut to the chase... [If they're analytical] I've got some data I think you'll find interesting... [If they're friendly] I've been looking forward to this chat...",
        whyItWorks: "Mirroring communication style builds unconscious rapport"
      }
    ]
  },
  UPFRONT_CONTRACT: {
    name: "Upfront Contract",
    description: "Setting clear expectations for the conversation including time, agenda, and possible outcomes",
    weight: 0.15,
    indicators: {
      excellent: [
        "Confirmed time available",
        "Set clear agenda with prospect input",
        "Established mutual expectations",
        "Gave permission for 'no' - made it safe to decline",
        "Clarified next steps options upfront",
        "Got verbal agreement to the contract"
      ],
      good: [
        "Mentioned agenda",
        "Confirmed time",
        "Discussed possible outcomes"
      ],
      needsWork: [
        "No clear agenda set",
        "Didn't confirm time available",
        "Prospect seemed surprised by questions",
        "No discussion of what happens after the call"
      ]
    },
    suggestedLanguage: [
      {
        situation: "Starting a discovery call",
        script: "[Name], I have us down for 30 minutes. Does that still work? Great. Here's what I was thinking - I'd like to learn more about what's happening with [their challenge], you can ask me anything about how we work, and at the end we can both decide if it makes sense to continue or not. If it's not a fit, totally fine to say so - I'd rather know than have us both waste time. Sound fair?",
        whyItWorks: "Covers time, agenda, and outcomes. The 'permission to say no' reduces pressure and paradoxically increases engagement"
      },
      {
        situation: "When they want to 'just see a demo'",
        script: "I can definitely show you the product. But I've found that demos are only useful when I understand what you're trying to solve. Otherwise I'm just clicking through screens. Can we spend 10 minutes on your situation first, then I can show you the parts that actually matter to you?",
        whyItWorks: "Reframes the demo request without saying no, positions you as consultative"
      },
      {
        situation: "Mid-call reset when going off track",
        script: "Hey, I want to make sure we're using your time well. We started talking about X but we've gone to Y. Which is more important for you right now?",
        whyItWorks: "Shows respect for their time, gives them control, gets conversation back on track"
      },
      {
        situation: "When they have limited time",
        script: "I only have you for 15 minutes, so let me ask the one question that matters most: What would need to be true for this to be worth your time to explore further?",
        whyItWorks: "Cuts to the chase, respects time constraint, identifies their real criteria"
      },
      {
        situation: "Setting up the 'no' possibility",
        script: "At the end of this, there are really only three outcomes: One, you love it and want to move forward. Two, it's not for you and you tell me that. Three, you need to think about it - and if that happens, I'll ask what specifically you need to think about so I can help. Does that work?",
        whyItWorks: "Pre-handles the 'think about it' objection while making 'no' acceptable"
      }
    ]
  },
  PAIN_FUNNEL: {
    name: "Pain Funnel",
    description: "Uncovering deep emotional pain and its business/personal impact through questioning",
    weight: 0.25,
    indicators: {
      excellent: [
        "Moved from surface problem to root cause",
        "Uncovered emotional impact (frustration, fear, stress)",
        "Quantified the pain in dollars, time, or opportunity cost",
        "Connected business pain to personal impact",
        "Used 'tell me more' and 'what else' effectively",
        "Let silence do the work after tough questions",
        "Prospect self-discovered the urgency"
      ],
      good: [
        "Asked about challenges",
        "Some follow-up questions",
        "Touched on impact"
      ],
      needsWork: [
        "Surface-level problem discussion only",
        "Jumped to solution too quickly",
        "Didn't quantify pain",
        "Missed emotional cues",
        "Filled silences instead of letting prospect think"
      ]
    },
    suggestedLanguage: [
      {
        situation: "Opening the pain conversation",
        script: "When you think about [area you help with], what's the thing that frustrates you most? Not the thing you're supposed to say, but the thing that actually keeps you up at night?",
        whyItWorks: "The 'not supposed to say' reframe often gets the real answer instead of the corporate answer"
      },
      {
        situation: "Going deeper - Level 1",
        script: "Tell me more about that...",
        whyItWorks: "Simple but powerful. Shows interest without leading. Let them fill the silence."
      },
      {
        situation: "Going deeper - Level 2",
        script: "How long has this been going on? ...And what have you tried so far to fix it?",
        whyItWorks: "Establishes duration (longer = more urgent) and shows that previous attempts failed"
      },
      {
        situation: "Going deeper - Level 3 (Quantification)",
        script: "If you had to put a number on this - what is this costing you? In deals lost, time wasted, opportunities missed?",
        whyItWorks: "Forces them to do the math. Their number is always more compelling than yours."
      },
      {
        situation: "Going deeper - Level 4 (Personal Impact)",
        script: "How is this affecting you personally? Beyond the business impact, what does this mean for you?",
        whyItWorks: "People buy emotionally and justify logically. This uncovers the emotional driver."
      },
      {
        situation: "Going deeper - Level 5 (Future Pain)",
        script: "What happens if you don't solve this? Not just next quarter, but a year from now?",
        whyItWorks: "Projects the pain forward, makes status quo feel more risky than change"
      },
      {
        situation: "When they give a vague answer",
        script: "Help me understand what you mean by [their vague term]. Can you give me a specific example?",
        whyItWorks: "Vague answers = vague pain = no urgency. Specifics create clarity and commitment."
      },
      {
        situation: "When they downplay the problem",
        script: "It sounds like it's not that big a deal. Should we even be having this conversation?",
        whyItWorks: "Reverse psychology. If they correct you and defend the severity, they sell themselves."
      },
      {
        situation: "Summarizing their pain",
        script: "Let me make sure I understand. You're dealing with [specific problem] which is costing you [quantified impact], and if this continues, [future consequence]. You've tried [their attempts] but those didn't work because [reason]. Is that right?",
        whyItWorks: "Shows you listened, confirms pain, and hearing it summarized often increases their urgency"
      }
    ]
  },
  BUDGET: {
    name: "Budget Step",
    description: "Having an honest money conversation before presenting solutions",
    weight: 0.15,
    indicators: {
      excellent: [
        "Discussed investment before presenting solution",
        "Explored budget range and flexibility",
        "Connected investment to pain/value",
        "Addressed money honestly without being pushy",
        "Qualified that they can actually afford a solution",
        "Discussed ROI in their terms"
      ],
      good: [
        "Mentioned pricing",
        "Asked about budget",
        "Discussed general investment level"
      ],
      needsWork: [
        "Avoided money conversation",
        "Only discussed price at the end",
        "Didn't qualify financial capability",
        "Let prospect avoid budget question"
      ]
    },
    suggestedLanguage: [
      {
        situation: "Introducing the budget conversation",
        script: "Before I show you anything, let's talk about money so neither of us wastes time. Is that okay?",
        whyItWorks: "Frames budget discussion as helpful, not pushy. Gets permission to discuss."
      },
      {
        situation: "Asking about budget directly",
        script: "What kind of investment have you set aside to solve this problem?",
        whyItWorks: "Assumes they have budget (positive framing), uses 'investment' not 'spend'"
      },
      {
        situation: "When they say 'no budget set'",
        script: "That's fine. Let me ask it differently - if this solved [their specific pain], what would that be worth to you? What would a good solution reasonably cost?",
        whyItWorks: "Shifts from 'what's allocated' to 'what's it worth' - often unlocks real numbers"
      },
      {
        situation: "When they deflect with 'depends on what you show me'",
        script: "I get that. Here's my concern though - I could show you a $10K solution or a $100K solution. Both solve the problem differently. Rather than waste your time, help me understand what ballpark makes sense for you.",
        whyItWorks: "Shows respect for their time, makes it practical rather than manipulative"
      },
      {
        situation: "Connecting budget to pain",
        script: "You mentioned this is costing you roughly [their number] per [time period]. If we could solve that, would an investment of [your range] make sense?",
        whyItWorks: "Uses their own pain quantification to justify the investment"
      },
      {
        situation: "Testing budget ceiling",
        script: "Is that a hard ceiling, or if we could demonstrate clear ROI, is there flexibility?",
        whyItWorks: "Separates stated budget from real budget without being confrontational"
      },
      {
        situation: "When budget is too low",
        script: "I appreciate your honesty. With that budget, I'm not sure we're the right fit - we could do [limited option], but it wouldn't really solve [their main pain]. What would it take to find more budget if we could show the value?",
        whyItWorks: "Honest about mismatch, opens door to finding more budget, positions you as premium"
      }
    ]
  },
  DECISION: {
    name: "Decision Step",
    description: "Understanding how decisions are made, who's involved, and what the process looks like",
    weight: 0.15,
    indicators: {
      excellent: [
        "Identified all decision makers and influencers",
        "Understood the decision process and timeline",
        "Uncovered potential blockers or competitors",
        "Got access to or path to other stakeholders",
        "Understood personal win for each stakeholder",
        "Mapped the decision criteria"
      ],
      good: [
        "Asked about decision process",
        "Identified some stakeholders",
        "Discussed timeline"
      ],
      needsWork: [
        "Assumed they could decide alone",
        "Didn't ask about others involved",
        "No discussion of decision timeline",
        "Didn't uncover evaluation criteria"
      ]
    },
    suggestedLanguage: [
      {
        situation: "Opening the decision conversation",
        script: "Walk me through how a decision like this typically gets made at [company]. Who else would need to be involved?",
        whyItWorks: "Assumes there are others (usually true), 'walk me through' gets the process"
      },
      {
        situation: "When they say 'I make the decision'",
        script: "Got it, you're the final call. Typically though, who would you want to consult or get input from before pulling the trigger?",
        whyItWorks: "Validates their authority while uncovering hidden influencers"
      },
      {
        situation: "Understanding stakeholder concerns",
        script: "When you bring this to [other stakeholder], what questions do you think they'll have? What would they need to see?",
        whyItWorks: "Gets you prep for the next conversation, shows you're thinking ahead"
      },
      {
        situation: "Getting access to decision makers",
        script: "It sounds like [name] will have important input. What would it take to get 15 minutes with them so I can answer their questions directly? That way you don't have to be the messenger.",
        whyItWorks: "Positions access as helping them, not serving you"
      },
      {
        situation: "Understanding timeline",
        script: "What's driving your timeline? Is there an event, a deadline, or something else that's creating urgency?",
        whyItWorks: "Uncovers real drivers vs arbitrary dates"
      },
      {
        situation: "Uncovering competitors",
        script: "Who else are you talking to about this? ...What do you like about their approach?",
        whyItWorks: "Direct question often gets honest answer, follow-up shows you're not afraid"
      },
      {
        situation: "Mapping decision criteria",
        script: "When you evaluate options, what are the three things that matter most? If you had to rank them?",
        whyItWorks: "Gets explicit criteria you can address, ranking shows priorities"
      },
      {
        situation: "Understanding the 'no decision' risk",
        script: "What happens if you just don't do anything? Is that an option?",
        whyItWorks: "Your biggest competitor is often 'do nothing' - this surfaces that risk"
      }
    ]
  },
  FULFILLMENT: {
    name: "Fulfillment (Solution Presentation)",
    description: "Presenting only solutions that directly address stated pain, not feature dumping",
    weight: 0.10,
    indicators: {
      excellent: [
        "Only showed features that mapped to stated pain",
        "Connected each point back to their specific situation",
        "Checked for understanding throughout",
        "Didn't oversell or feature dump",
        "Asked 'how does this compare to what you expected?'",
        "Let them visualize using the solution"
      ],
      good: [
        "Presented relevant solution",
        "Referenced their situation",
        "Checked understanding"
      ],
      needsWork: [
        "Generic presentation not tailored to their pain",
        "Feature dumping without connection to value",
        "Talked more than listened during presentation",
        "Didn't check if solution matched expectations"
      ]
    },
    suggestedLanguage: [
      {
        situation: "Transitioning to solution",
        script: "Based on what you've told me about [pain 1], [pain 2], and [pain 3], let me show you specifically how we'd address each of those. I'm only going to show you what's relevant - stop me if I miss something important.",
        whyItWorks: "Shows you listened, sets up focused presentation, invites their input"
      },
      {
        situation: "Connecting feature to pain",
        script: "Remember when you mentioned [specific pain]? This is how we solve that... [brief explanation]. How does that land for you?",
        whyItWorks: "Direct connection to their words, immediate check-in prevents monologue"
      },
      {
        situation: "Checking alignment",
        script: "I want to pause here. Is this what you expected, or different?",
        whyItWorks: "Surfaces objections early, shows you care about fit not just closing"
      },
      {
        situation: "Helping them visualize",
        script: "Imagine it's 90 days from now and this is working. What would be different in your day-to-day?",
        whyItWorks: "Gets them to sell themselves on the future state"
      },
      {
        situation: "When they ask about a feature you didn't mention",
        script: "We do have that. I didn't bring it up because it didn't seem relevant to [their main pain]. Is it important to you? Tell me more about why.",
        whyItWorks: "Shows restraint, uncovers potential new pain"
      }
    ]
  },
  POST_SELL: {
    name: "Post-Sell",
    description: "Preventing buyer's remorse and setting up successful next steps",
    weight: 0.05,
    indicators: {
      excellent: [
        "Validated their decision",
        "Addressed potential second thoughts proactively",
        "Set clear next steps with dates",
        "Confirmed commitment verbally",
        "Discussed what could go wrong and how to handle"
      ],
      good: [
        "Discussed next steps",
        "Thanked them for decision",
        "Provided timeline"
      ],
      needsWork: [
        "Rushed to close without validation",
        "Vague next steps",
        "Didn't address potential concerns",
        "Left them hanging after agreement"
      ]
    },
    suggestedLanguage: [
      {
        situation: "After they agree to move forward",
        script: "Great. Before we formalize this, I want to check in - is there anything nagging at you? Any concerns we haven't addressed? I'd rather know now than have this fall apart later.",
        whyItWorks: "Surfaces hidden objections, shows you care about fit not just the sale"
      },
      {
        situation: "Preventing buyer's remorse",
        script: "Between now and when we get started, you might have second thoughts - that's normal. What would help you feel confident about this decision?",
        whyItWorks: "Normalizes doubt, gets them to articulate what they need"
      },
      {
        situation: "Setting next steps",
        script: "Here's what happens next: [specific step 1] by [date], then [step 2]. I'll send you an email confirming all this in the next hour. Does that work?",
        whyItWorks: "Specific, time-bound, documented - reduces confusion and delays"
      },
      {
        situation: "Reinforcing their decision",
        script: "I think you're making a good call. Based on what you told me about [their main pain], doing nothing wasn't really an option. You'll look back on this as a turning point.",
        whyItWorks: "Validates decision, references their own reasoning, creates positive anticipation"
      }
    ]
  },
  NO_FREE_CONSULTING: {
    name: "No Free Consulting",
    description: "Not giving away solutions before commitment - maintaining professional boundaries",
    weight: 0.05,
    indicators: {
      excellent: [
        "Didn't solve their problem in the call",
        "Positioned expertise as valuable",
        "Redirected 'how would you do it' to next steps",
        "Maintained consultative stance not order-taker"
      ],
      good: [
        "Limited solution details until commitment",
        "Showed expertise without giving playbook"
      ],
      needsWork: [
        "Gave away the full solution",
        "Acted as free consultant",
        "Answered detailed 'how' questions without commitment"
      ]
    },
    suggestedLanguage: [
      {
        situation: "When they ask 'how would you solve this?'",
        script: "Great question. I have some ideas, but I'd be doing you a disservice giving you a half-baked answer without really understanding your situation. That's what the next step would be for. Would you like to set that up?",
        whyItWorks: "Positions your expertise as valuable, creates reason for next meeting"
      },
      {
        situation: "When they want detailed specs without commitment",
        script: "I could send over a detailed proposal, but honestly, proposals take me significant time to do right. Before I invest that effort, can we confirm this is actually something you're moving forward on?",
        whyItWorks: "Sets boundary without being rude, qualifies commitment"
      },
      {
        situation: "When they're picking your brain",
        script: "I'm happy to share more about our approach. Just so I understand - is this academic interest, or are you actively looking to solve this?",
        whyItWorks: "Direct qualification without accusation"
      }
    ]
  }
};

// ============================================
// OBJECTION HANDLING DATA
// (Key objections from OBJECTION-HANDLING-GUIDE.md)
// ============================================

const OBJECTION_CHUNKS: Chunk[] = [
  {
    content_type: "objection",
    component_name: null,
    chunk_title: "The Fathom Objection - Response",
    chunk_text: `When prospect says: "You can't compete with Fathom - they have billions behind them."

WRONG Response: "We're better than Fathom" or "We can do everything Fathom does"

RIGHT Response: "I'm not competing with Fathom. I'm making Fathom more valuable for Sandler clients."

Full breakdown:
1. Acknowledge: "You're right - I can't compete with Fathom on video infrastructure. That's not what I'm building."

2. Reframe: Think of it like:
- Fathom = X-ray machine (billions to build, works for everyone)
- My product = Radiologist (specialized interpretation, personalized treatment)

3. The difference:
- Fathom's AI: Generic prompts → generic summaries
- My AI: Sandler-specific prompts → Sandler coaching (scores Upfront Contract, Pain Funnel, etc.)

4. Why Fathom won't compete: They serve everyone - HR, support, sales. If they optimize for Sandler, MEDDIC users complain. You can specialize because you ONLY serve Sandler clients.`,
    situation_tags: ["objection_handling", "competitor"],
    weakness_tags: [],
    source_file: "OBJECTION-HANDLING-GUIDE.md",
    chunk_index: 1
  },
  {
    content_type: "objection",
    component_name: null,
    chunk_title: "Too Many Tools Objection - Response",
    chunk_text: `When prospect says: "Our reps already use too many tools. They don't need another one."

Response: "I'm the ANTI-tool. I make the tools you already paid for more valuable."

Key points:
- Zero additional work for reps
- Integration layer, not another standalone tool
- Reps keep using Fathom and HubSpot
- They just receive better coaching from data those tools already capture

What happens WITHOUT your product:
1. Make call on Zoom/Fathom
2. Manually log call in CRM
3. Type notes
4. Wait for Friday 1:1
5. Generic coaching

What happens WITH your product:
1. Make call (same as before)
2. Everything else happens automatically
3. Wake up to specific coaching in email`,
    situation_tags: ["objection_handling", "tools"],
    weakness_tags: [],
    source_file: "OBJECTION-HANDLING-GUIDE.md",
    chunk_index: 2
  },
  {
    content_type: "objection",
    component_name: null,
    chunk_title: "We Already Have Coaching Objection - Response",
    chunk_text: `When prospect says: "Our managers already do weekly 1:1s. We have a coaching culture."

Response: "You're right - great coaching requires human judgment. That's why managers approve every AI-generated message. I'm not replacing coaching. I'm making coaching SCALABLE."

The Time Math:
Current state (10 reps):
- 10 reps × 30-minute 1:1 = 5 hours/week
- Prep time (listen to calls, notes) = 3-4 hours
- Total: 8-9 hours/week on coaching

With AI coaching:
- AI analyzes all calls overnight = 0 minutes
- Manager reviews 10 coaching drafts = 30 minutes
- Edits and sends = 15 minutes
- Total: 45 minutes/week

That's 8 hours back per week = 416 hours/year.

The Hybrid Approach:
- Daily AI coaching: Tactical, specific, immediate
- Weekly 1:1s: Strategic, relationship, career development

Use AI for tactical coaching (scales to 100 reps). Use human for strategic coaching (doesn't scale).`,
    situation_tags: ["objection_handling", "coaching"],
    weakness_tags: [],
    source_file: "OBJECTION-HANDLING-GUIDE.md",
    chunk_index: 3
  },
  {
    content_type: "objection",
    component_name: null,
    chunk_title: "Too Expensive Objection - Response",
    chunk_text: `When prospect says: "$299/user/month? That's expensive."

Response: "Let me show you why it's actually too cheap."

ROI Calculation:
What you pay: $299/user/month × 10 reps = $36K/year

What you get:
1. Manager time savings: 8 hours/week × $60/hour × 52 weeks = $24,960/year
2. Performance improvement: 10% improvement × $50K/rep × 10 reps = $50,000/year
3. Training ROI preservation: $50K training stays at 80% vs 20% = $30,000/year
4. Avoid ONE turnover: $80,000/year saved

Total value: $184,960/year minimum
Your ROI: 5.1x

Compare to alternatives:
- Do nothing: 80% training forgotten, $150K+ lost revenue
- Hire full-time coach: $130K/year, can only coach 8-10 reps
- My product: $3,588/year per rep, scales infinitely

I'm 72% cheaper than a human coach and scale infinitely.`,
    situation_tags: ["objection_handling", "pricing", "budget"],
    weakness_tags: ["budget"],
    source_file: "OBJECTION-HANDLING-GUIDE.md",
    chunk_index: 4
  },
  {
    content_type: "objection",
    component_name: null,
    chunk_title: "Will It Really Work Objection - Response",
    chunk_text: `When prospect says: "How do I know the AI coaching will actually improve performance?"

Response: "That's why we track everything. Let me show you how we prove ROI."

The Measurement System:
Before: Baseline metrics, Sandler scores, manager coaching hours
During: Read rate, acknowledgment rate, behavioral change, performance change
After 90 days: Performance delta, time saved, ROI calculation

The Accountability Loop:
1. AI generates coaching (automatic)
2. Manager reviews and sends (human approval)
3. Rep receives notification (email + in-app)
4. System tracks when rep reads it (timestamp)
5. Rep can acknowledge or ask questions (engagement)
6. Manager sees if rep read it (accountability)

90-Day Performance Guarantee:
If after 90 days you can't measure improvement, full refund. No questions asked.

You'll KNOW if it's working within 30 days. Zero risk to you.`,
    situation_tags: ["objection_handling", "proof", "roi"],
    weakness_tags: [],
    source_file: "OBJECTION-HANDLING-GUIDE.md",
    chunk_index: 5
  },
  {
    content_type: "objection",
    component_name: null,
    chunk_title: "Let Me Think About It Objection - Response",
    chunk_text: `When prospect says: "This sounds interesting. Let me think about it."

Response: "I understand. But let me show you what waiting costs."

The Cost of Delay (per month):
- Lost manager time: 32 hours × $60 = $1,920
- Lost performance: 5% underperformance × $500K quota × 10 reps = $25,000
- Training drift: Effectiveness drops 10% per month

Total cost of waiting 3 months: $80K-100K
Cost to start today: $9K for 3 months

The question isn't 'Should we do this?' The question is 'Can we afford NOT to?'

Alternative close:
"Every day you wait, your Sandler training is decaying. The ROI clock is ticking. Let's start with a 30-day pilot - prove it works, then expand. What's the risk?"`,
    situation_tags: ["objection_handling", "closing", "stall"],
    weakness_tags: [],
    source_file: "OBJECTION-HANDLING-GUIDE.md",
    chunk_index: 6
  }
];

// ============================================
// BEST PRACTICES DATA
// (From SANDLER-REVENUE-FACTORY-START-HERE.md)
// ============================================

const BEST_PRACTICE_CHUNKS: Chunk[] = [
  {
    content_type: "best_practice",
    component_name: null,
    chunk_title: "Daily Coaching Loop Best Practice",
    chunk_text: `The Coaching Accountability Loop:

1. Make calls as normal (Zoom/Fathom and HubSpot activity logging)
2. System automatically syncs calls overnight
3. AI analyzes using Sandler methodology
4. AI generates coaching draft
5. Manager reviews, edits if needed, clicks "Send"
6. Rep receives coaching via email + in-app
7. Manager sees when rep reads it
8. Rep acknowledges or asks questions
9. Loop closed - coaching delivered, tracked, acknowledged

Key timing:
- 6 AM: Automated sync pulls yesterday's calls
- 8 AM: AI analysis generates coaching drafts
- 9 AM: Manager reviews and sends (30 seconds per rep)
- Throughout day: Reps read (3-5 minutes)

This creates daily micro-coaching instead of weekly batch coaching. Habits form faster, skills improve incrementally, and managers save 8+ hours per week.`,
    situation_tags: ["workflow", "coaching"],
    weakness_tags: [],
    source_file: "SANDLER-REVENUE-FACTORY-START-HERE.md",
    chunk_index: 1
  },
  {
    content_type: "best_practice",
    component_name: null,
    chunk_title: "Sandler Methodology Scoring System",
    chunk_text: `How Sandler Methodology Scoring Works:

Each call is scored 0-10 on 8 components:

1. Bonding & Rapport (10% weight)
   - Genuine connection before business
   - Matched communication style

2. Upfront Contract (15% weight)
   - Clear agenda with time
   - Permission to say no
   - Mutual expectations

3. Pain Funnel (25% weight - highest!)
   - Surface → root cause
   - Emotional impact uncovered
   - Pain quantified in dollars/time

4. Budget Step (15% weight)
   - Money discussed before solution
   - Budget range explored
   - Investment connected to pain

5. Decision Step (15% weight)
   - Decision makers identified
   - Process and timeline mapped
   - Competitors uncovered

6. Fulfillment (10% weight)
   - Features tied to stated pain
   - No feature dumping
   - Checked for understanding

7. Post-Sell (5% weight)
   - Buyer's remorse addressed
   - Clear next steps with dates

8. No Free Consulting (5% weight)
   - Expertise protected
   - Solutions after commitment

Overall Grade: Weighted average A+ through F`,
    situation_tags: ["methodology", "scoring"],
    weakness_tags: [],
    source_file: "SANDLER-REVENUE-FACTORY-START-HERE.md",
    chunk_index: 2
  },
  {
    content_type: "best_practice",
    component_name: null,
    chunk_title: "Multi-Channel Coverage Advantage",
    chunk_text: `Multi-Channel Coverage - Competitive Advantage:

Most tools (Gong, Chorus, Fathom) only capture Zoom calls = ~20% of sales conversations.

Full coverage captures:
- Zoom calls (Fathom API)
- Video calls and CRM activity (Fathom/HubSpot)
- In-person meetings (voice note summaries)
- SMS quick logs (text-based logging)
= 90%+ of all sales conversations

Why this matters:
- Phone calls are often warmer leads
- In-person meetings close higher-value deals
- Coaching from ALL touchpoints gives complete picture

Marketing message: "Don't just coach from Zoom calls. Coach from EVERY sales conversation."`,
    situation_tags: ["competitive_advantage", "integration"],
    weakness_tags: [],
    source_file: "SANDLER-REVENUE-FACTORY-START-HERE.md",
    chunk_index: 3
  }
];

// ============================================
// CHUNKING FUNCTIONS
// ============================================

function chunkComponents(): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const [key, component] of Object.entries(SANDLER_COMPONENTS)) {
    // Chunk 1: Component overview with indicators
    const overviewText = `${component.name}

Description: ${component.description}

Weight in overall score: ${(component.weight * 100).toFixed(0)}%

What EXCELLENT looks like:
${component.indicators.excellent.map(i => `- ${i}`).join('\n')}

What GOOD looks like:
${component.indicators.good.map(i => `- ${i}`).join('\n')}

What NEEDS WORK looks like:
${component.indicators.needsWork.map(i => `- ${i}`).join('\n')}`;

    chunks.push({
      content_type: "component",
      component_name: key,
      chunk_title: `${component.name} - Overview & Indicators`,
      chunk_text: overviewText,
      situation_tags: ["scoring", "analysis"],
      weakness_tags: [key.toLowerCase()],
      source_file: "sandler-methodology.ts",
      chunk_index: chunkIndex++
    });

    // Chunk 2-N: Individual scripts
    for (const script of component.suggestedLanguage) {
      const scriptText = `SITUATION: ${script.situation}

SCRIPT: "${script.script}"

WHY IT WORKS: ${script.whyItWorks}`;

      // Determine situation tags from script content
      const situationTags: string[] = [];
      const lower = script.situation.toLowerCase();
      if (lower.includes("cold call")) situationTags.push("cold_call");
      if (lower.includes("discovery")) situationTags.push("discovery");
      if (lower.includes("demo")) situationTags.push("demo");
      if (lower.includes("budget")) situationTags.push("budget_discussion");
      if (lower.includes("objection") || lower.includes("concern")) situationTags.push("objection_handling");
      if (lower.includes("close") || lower.includes("forward")) situationTags.push("closing");
      if (lower.includes("pain")) situationTags.push("pain_exploration");
      if (lower.includes("decision")) situationTags.push("decision_process");
      if (situationTags.length === 0) situationTags.push("general");

      chunks.push({
        content_type: "script",
        component_name: key,
        chunk_title: `${component.name} - ${script.situation}`,
        chunk_text: scriptText,
        situation_tags: situationTags,
        weakness_tags: [key.toLowerCase()],
        source_file: "sandler-methodology.ts",
        chunk_index: chunkIndex++
      });
    }
  }

  return chunks;
}

// ============================================
// EMBEDDING GENERATION
// ============================================

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text.trim().toLowerCase(),
      model: "text-embedding-3-small",
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || "Unknown"}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function clearKnowledgeBase(): Promise<void> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/Sandler_Knowledge_Base?is_active=eq.true`,
    {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
    }
  );

  if (!response.ok) {
    console.warn("Warning: Could not clear existing records (table may not exist yet)");
  }
}

async function insertChunk(chunk: Chunk, embedding: number[]): Promise<void> {
  const record = {
    content_type: chunk.content_type,
    component_name: chunk.component_name,
    chunk_title: chunk.chunk_title,
    chunk_text: chunk.chunk_text,
    situation_tags: chunk.situation_tags,
    weakness_tags: chunk.weakness_tags,
    embedding: `[${embedding.join(",")}]`,
    source_file: chunk.source_file,
    chunk_index: chunk.chunk_index,
    is_active: true,
  };

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/Sandler_Knowledge_Base`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(record),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert chunk: ${error}`);
  }
}

// ============================================
// MAIN SEEDING FUNCTION
// ============================================

async function seedKnowledgeBase(): Promise<void> {
  console.log("=".repeat(60));
  console.log("SANDLER KNOWLEDGE BASE SEEDER");
  console.log("=".repeat(60));

  // Collect all chunks
  const componentChunks = chunkComponents();
  const allChunks = [
    ...componentChunks,
    ...OBJECTION_CHUNKS,
    ...BEST_PRACTICE_CHUNKS,
  ];

  console.log(`\nTotal chunks to process: ${allChunks.length}`);
  console.log(`  - Component chunks: ${componentChunks.length}`);
  console.log(`  - Objection chunks: ${OBJECTION_CHUNKS.length}`);
  console.log(`  - Best practice chunks: ${BEST_PRACTICE_CHUNKS.length}`);

  // Clear existing data
  console.log("\nClearing existing knowledge base...");
  await clearKnowledgeBase();

  // Process chunks
  console.log("\nProcessing chunks...\n");

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    const progress = `[${i + 1}/${allChunks.length}]`;

    try {
      // Generate embedding
      process.stdout?.write?.(`${progress} Embedding: ${chunk.chunk_title.substring(0, 50)}...`);
      const embedding = await generateEmbedding(chunk.chunk_text);

      // Insert into database
      await insertChunk(chunk, embedding);

      console.log(" ✓");
      successCount++;

      // Rate limiting - OpenAI allows ~3000 RPM for embeddings
      if (i < allChunks.length - 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (error) {
      console.log(` ✗ Error: ${(error as Error).message}`);
      errorCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SEEDING COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log(`  Total:   ${allChunks.length}`);

  if (errorCount > 0) {
    console.log("\n⚠️  Some chunks failed. Run the schema migration first if you haven't.");
  } else {
    console.log("\n✅ Knowledge base ready for RAG queries!");
  }
}

// Run the seeder
seedKnowledgeBase().catch(console.error);
