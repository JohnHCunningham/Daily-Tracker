// ============================================
// SANDLER SELLING SYSTEM - COMPREHENSIVE METHODOLOGY
// Deep analysis framework with suggested language
// ============================================

export interface SandlerScore {
  component: string;
  score: number; // 1-10
  maxScore: number;
  indicators: string[];
  missingElements: string[];
  suggestedLanguage: string[];
  coachingPoints: string[];
}

export interface SandlerAnalysis {
  overallScore: number;
  overallGrade: string;
  scores: SandlerScore[];
  topStrengths: string[];
  priorityImprovements: string[];
  immediateActions: string[];
  suggestedScripts: SuggestedScript[];
}

export interface SuggestedScript {
  situation: string;
  context: string;
  script: string;
  whyItWorks: string;
}

// ============================================
// SANDLER COMPONENTS & SCORING RUBRICS
// ============================================

export const SANDLER_COMPONENTS = {
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
// ANALYSIS FUNCTIONS
// ============================================

export function analyzeTranscript(transcript: string, existingSummary?: string): SandlerAnalysis {
  const scores: SandlerScore[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  // Analyze each component
  for (const [key, component] of Object.entries(SANDLER_COMPONENTS)) {
    const score = scoreComponent(key, transcript, existingSummary);
    scores.push(score);
    totalWeightedScore += score.score * component.weight;
    totalWeight += component.weight;
  }

  const overallScore = Math.round((totalWeightedScore / totalWeight) * 10) / 10;
  const overallGrade = getGrade(overallScore);

  // Identify strengths and improvements
  const sortedByScore = [...scores].sort((a, b) => b.score - a.score);
  const topStrengths = sortedByScore
    .slice(0, 2)
    .filter(s => s.score >= 7)
    .map(s => `${s.component}: ${s.indicators[0] || 'Good execution'}`);

  const priorityImprovements = sortedByScore
    .slice(-2)
    .filter(s => s.score < 7)
    .map(s => `${s.component}: ${s.missingElements[0] || 'Needs attention'}`);

  // Get suggested scripts for weak areas
  const suggestedScripts: SuggestedScript[] = [];
  const weakComponents = scores.filter(s => s.score < 6);
  for (const weak of weakComponents.slice(0, 3)) {
    const component = Object.values(SANDLER_COMPONENTS).find(c => c.name === weak.component);
    if (component?.suggestedLanguage) {
      const script = component.suggestedLanguage[Math.floor(Math.random() * component.suggestedLanguage.length)];
      suggestedScripts.push(script);
    }
  }

  // Generate immediate actions
  const immediateActions = generateImmediateActions(scores, transcript);

  return {
    overallScore,
    overallGrade,
    scores,
    topStrengths,
    priorityImprovements,
    immediateActions,
    suggestedScripts
  };
}

function scoreComponent(componentKey: string, transcript: string, summary?: string): SandlerScore {
  const component = SANDLER_COMPONENTS[componentKey as keyof typeof SANDLER_COMPONENTS];
  const text = (transcript + ' ' + (summary || '')).toLowerCase();

  let score = 1; // Start at 1 — no credit for absence. Keyword matches pull it up.
  const indicators: string[] = [];
  const missingElements: string[] = [];
  const suggestedLanguage: string[] = [];
  const coachingPoints: string[] = [];

  // Component-specific analysis
  switch (componentKey) {
    case 'UPFRONT_CONTRACT':
      if (text.includes('agenda') || text.includes('here\'s what i was thinking')) { score += 1; indicators.push('Set agenda'); }
      if (text.includes('minutes') || text.includes('time')) { score += 1; indicators.push('Confirmed time'); }
      if (text.includes('okay to say no') || text.includes('not a fit') || text.includes('no is okay')) { score += 2; indicators.push('Gave permission for no'); }
      if (text.includes('next steps') || text.includes('end of this')) { score += 1; indicators.push('Discussed outcomes'); }
      if (!text.includes('agenda')) { missingElements.push('No clear agenda set'); }
      if (!text.includes('no is okay') && !text.includes('not a fit')) { missingElements.push('Did not give permission for "no"'); }
      break;

    case 'PAIN_FUNNEL':
      if (text.includes('tell me more') || text.includes('help me understand')) { score += 1; indicators.push('Used deepening questions'); }
      if (text.includes('how long') || text.includes('how often')) { score += 1; indicators.push('Explored duration/frequency'); }
      if (text.includes('what does that cost') || text.includes('impact') || text.includes('costing you')) { score += 2; indicators.push('Quantified pain'); }
      if (text.includes('personally') || text.includes('mean for you')) { score += 2; indicators.push('Uncovered personal impact'); }
      if (text.includes('if this continues') || text.includes('what happens if')) { score += 1; indicators.push('Explored future consequences'); }
      if (!text.includes('tell me more') && !text.includes('help me understand')) { missingElements.push('Surface-level questioning only'); }
      if (!text.includes('cost') && !text.includes('impact') && !text.includes('affect')) { missingElements.push('Pain not quantified'); }
      break;

    case 'BUDGET':
      if (text.includes('budget') || text.includes('investment') || text.includes('set aside')) { score += 2; indicators.push('Discussed budget'); }
      if (text.includes('what would that be worth') || text.includes('worth to you')) { score += 2; indicators.push('Connected to value'); }
      if (text.includes('ballpark') || text.includes('range')) { score += 1; indicators.push('Explored budget range'); }
      if (!text.includes('budget') && !text.includes('investment') && !text.includes('cost')) { missingElements.push('No budget discussion'); }
      break;

    case 'DECISION':
      if (text.includes('decision') || text.includes('who else')) { score += 1; indicators.push('Asked about decision process'); }
      if (text.includes('stakeholder') || text.includes('involved') || text.includes('sign off')) { score += 2; indicators.push('Identified stakeholders'); }
      if (text.includes('timeline') || text.includes('when')) { score += 1; indicators.push('Discussed timeline'); }
      if (text.includes('criteria') || text.includes('what matters most')) { score += 1; indicators.push('Explored decision criteria'); }
      if (!text.includes('who else') && !text.includes('decision')) { missingElements.push('Did not map decision process'); }
      break;

    case 'BONDING_RAPPORT':
      if (text.includes('curious') || text.includes('interested')) { score += 1; indicators.push('Showed genuine interest'); }
      if (text.match(/\b(name)\b.*\b(name)\b/)) { score += 1; indicators.push('Used prospect name'); }
      // Check for forced small talk vs genuine connection
      if (text.includes('weather') || text.includes('sports')) { score -= 1; missingElements.push('Relied on generic small talk'); }
      break;

    case 'FULFILLMENT':
      if (text.includes('you mentioned') || text.includes('remember when you said')) { score += 2; indicators.push('Connected to their stated pain'); }
      if (text.includes('how does that') || text.includes('what do you think')) { score += 1; indicators.push('Checked for understanding'); }
      if (text.includes('show you everything') || text.includes('all our features')) { score -= 2; missingElements.push('Feature dumping detected'); }
      break;

    case 'POST_SELL':
      if (text.includes('next step') || text.includes('here\'s what happens')) { score += 2; indicators.push('Set clear next steps'); }
      if (text.includes('concern') || text.includes('second thought')) { score += 2; indicators.push('Addressed potential doubts'); }
      break;

    case 'NO_FREE_CONSULTING':
      if (text.includes('that\'s what the next step') || text.includes('deep dive')) { score += 2; indicators.push('Protected expertise'); }
      if (text.includes('here\'s exactly how') && text.includes('would do it')) { score -= 2; missingElements.push('Gave away solution'); }
      break;
  }

  // Clamp score
  score = Math.max(1, Math.min(10, score));

  // Add relevant coaching points based on missing elements
  if (missingElements.length > 0) {
    const componentData = SANDLER_COMPONENTS[componentKey as keyof typeof SANDLER_COMPONENTS];
    if (componentData.suggestedLanguage) {
      const relevantScript = componentData.suggestedLanguage[0];
      coachingPoints.push(`Try this: "${relevantScript.script.substring(0, 100)}..."`);
    }
  }

  return {
    component: component.name,
    score,
    maxScore: 10,
    indicators,
    missingElements,
    suggestedLanguage,
    coachingPoints
  };
}

function getGrade(score: number): string {
  if (score >= 9) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8) return 'A-';
  if (score >= 7.5) return 'B+';
  if (score >= 7) return 'B';
  if (score >= 6.5) return 'B-';
  if (score >= 6) return 'C+';
  if (score >= 5.5) return 'C';
  if (score >= 5) return 'C-';
  if (score >= 4) return 'D';
  return 'F';
}

function generateImmediateActions(scores: SandlerScore[], transcript: string): string[] {
  const actions: string[] = [];

  // Find the lowest scoring component
  const lowest = scores.reduce((min, s) => s.score < min.score ? s : min, scores[0]);

  // Generate specific actions based on weak areas
  const component = Object.values(SANDLER_COMPONENTS).find(c => c.name === lowest.component);
  if (component && component.suggestedLanguage.length > 0) {
    const randomScript = component.suggestedLanguage[Math.floor(Math.random() * component.suggestedLanguage.length)];
    actions.push(`PRACTICE THIS: In your next call when ${randomScript.situation.toLowerCase()}, try: "${randomScript.script.substring(0, 150)}..."`);
  }

  // Add general improvements based on patterns
  if (scores.find(s => s.component === 'Pain Funnel')?.score < 6) {
    actions.push('PAIN DEPTH: Before presenting anything, ask "What else?" at least three times to go deeper on pain.');
  }

  if (scores.find(s => s.component === 'Upfront Contract')?.score < 6) {
    actions.push('CONTROL: Start every call with "Here\'s what I was thinking for our time together..." to set the frame.');
  }

  if (scores.find(s => s.component === 'Budget Step')?.score < 6) {
    actions.push('MONEY: Ask about budget BEFORE showing solutions. "What have you set aside to solve this?" is not rude, it\'s respectful of their time.');
  }

  return actions.slice(0, 3);
}

// ============================================
// EXPORT COACHING GENERATION
// ============================================

export function generateCoachingFromAnalysis(analysis: SandlerAnalysis, repName: string, callDate: string): string {
  // Find top 2 weak areas
  const weakAreas = analysis.scores
    .filter(s => s.score < 7)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  // Find 1 strength
  const strength = analysis.scores.find(s => s.score >= 7);

  let coaching = `📊 CALL SCORE: ${analysis.overallScore}/10 (${analysis.overallGrade})\n\n`;

  // One strength - keep it brief
  if (strength) {
    coaching += `✅ WHAT WORKED\n`;
    coaching += `${strength.component}: ${strength.indicators[0] || 'Good execution'}\n\n`;
  }

  // Focus areas - be specific
  if (weakAreas.length > 0) {
    coaching += `🎯 FOCUS AREAS\n\n`;
    weakAreas.forEach(area => {
      coaching += `${area.component} (${area.score}/10)\n`;
      if (area.missingElements[0]) {
        coaching += `Issue: ${area.missingElements[0]}\n`;
      }
      coaching += `\n`;
    });
  }

  // One suggested script - the most impactful
  if (analysis.suggestedScripts.length > 0) {
    const script = analysis.suggestedScripts[0];
    coaching += `💬 TRY THIS NEXT CALL\n\n`;
    coaching += `When: ${script.situation}\n`;
    coaching += `Say: "${script.script}"\n\n`;
    coaching += `Why it works: ${script.whyItWorks}\n\n`;
  }

  // One immediate action
  if (analysis.immediateActions.length > 0) {
    coaching += `⚡ ONE THING TO DO\n`;
    coaching += `${analysis.immediateActions[0]}\n`;
  }

  return coaching;
}
