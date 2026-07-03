// ============================================
// METHODOLOGY SEED DATA
// Knowledge base chunks for all supported methodologies.
// Each methodology gets: component overviews, indicators,
// scripts for common situations, and best practices.
// ============================================

export interface MethodologyChunk {
  content_type: string;
  component_name: string | null;
  chunk_title: string;
  chunk_text: string;
  situation_tags: string[];
  weakness_tags: string[];
  source_file: string;
  chunk_index: number;
  methodology: string;
}

/**
 * Build knowledge base chunks for a specific methodology.
 * Returns an array of chunks ready for embedding and insertion.
 */
export function buildMethodologyChunks(methodology: string): MethodologyChunk[] {
  switch (methodology) {
    case "challenger": return buildChallengerChunks();
    case "spin": return buildSPINChunks();
    case "gap": return buildGapChunks();
    case "meddic": return buildMEDDPICCChunks();
    case "meddpicc": return buildMEDDPICCChunks();
    default: return [];
  }
}

// ============================================
// CHALLENGER SALE
// ============================================

function buildChallengerChunks(): MethodologyChunk[] {
  const m = "challenger";
  const chunks: MethodologyChunk[] = [];
  let i = 0;

  // Component overviews
  const components: Array<{name: string; desc: string; principles: string}> = [
    {
      name: "Commercial Insight",
      desc: "Teaching a non-obvious business insight tied to customer value. The rep leads with research, data, or a trend the customer hasn't considered, reframing how they see their own business.",
      principles: "Lead with insight before product. Use data, benchmarks, and market trends. The insight must be novel — if the customer already knows it, it's not teaching."
    },
    {
      name: "Reframe",
      desc: "Challenging the customer's current assumptions about their problem. The rep pushes back on the customer's existing view and introduces a different, more productive way to think about the issue.",
      principles: "Don't accept the customer's framing at face value. Ask: 'What if the real problem isn't X but Y?' Use pattern recognition from other clients to expose blind spots."
    },
    {
      name: "Rational Drowning",
      desc: "Building urgency by quantifying the cost of inaction. The rep shows what the customer loses by staying the same — revenue, market share, time, competitive position.",
      principles: "Numbers make pain real. Calculate the cost of the status quo: per day, per month, per year. Connect the insight to concrete business metrics the customer cares about."
    },
    {
      name: "Emotional Impact",
      desc: "Connecting the business case to personal and organizational pressure. The rep helps the buyer feel the weight of the problem at a human level — stress, missed promotions, team frustration.",
      principles: "Business pain has a human face. Ask about personal stakes: 'What does this mean for your team? For your own goals this quarter?' Surface the emotional cost of doing nothing."
    },
    {
      name: "Tailoring",
      desc: "Adapting the message to each stakeholder's role, priorities, and language. A CFO conversation sounds different from an end-user conversation — same insight, different frame.",
      principles: "Map stakeholders before the call. Research each person's priorities. Speak their language: financial for finance, operational for ops, strategic for executives."
    },
    {
      name: "Constructive Control",
      desc: "Confidently guiding next steps without being pushy. The rep recommends a path forward, handles objections directly, and maintains momentum while respecting the buyer's process.",
      principles: "Be prescriptive about next steps: 'Based on what we've discussed, here's what I recommend.' Handle pushback as a signal to refine, not retreat. Keep the deal moving."
    }
  ];

  for (const c of components) {
    const key = c.name.toUpperCase().replace(/\s+/g, "_");
    chunks.push({
      content_type: "component",
      component_name: key,
      chunk_title: `${c.name} — Overview & Principles`,
      chunk_text: `${c.desc}\n\nCore Principles:\n${c.principles}`,
      situation_tags: ["discovery", "pitch", "strategy"],
      weakness_tags: [key.toLowerCase()],
      source_file: "challenger-methodology",
      chunk_index: i++,
      methodology: m,
    });
  }

  // Scripts for common Challenger situations
  const scripts: Array<{title: string; text: string; situation: string[]; weakness: string[]}> = [
    {
      title: "Leading with Commercial Insight",
      text: "Before we talk about solutions, I want to share something we've noticed across 200 companies in your space. The top performers are doing something counterintuitive with [area]. They've moved away from [old approach] toward [new approach]. The result: [specific metric improvement]. Does that match what you're seeing, or is it different for you?",
      situation: ["discovery", "first_call"],
      weakness: ["commercial_insight"]
    },
    {
      title: "Reframing the Customer's Problem",
      text: "I appreciate you framing it that way. But here's what's interesting — when we dug into this with other [industry] leaders, they initially saw it the same way. But the root cause wasn't X at all. It was Y. What if the real issue isn't [their framing], but [reframe]? Here's why I ask...",
      situation: ["discovery", "objection"],
      weakness: ["reframe"]
    },
    {
      title: "Rational Drowning — Cost of Status Quo",
      text: "Let me put some numbers around what staying the same is costing you. Based on what you've shared, you're losing approximately [X] per [period] because of [problem]. Over 12 months, that's [annual cost]. And that doesn't include [secondary impact]. Most of our clients didn't realize the gap was that wide until we mapped it out. What's your reaction to that?",
      situation: ["discovery", "pricing", "follow_up"],
      weakness: ["rational_drowning"]
    },
    {
      title: "Surfacing Emotional Impact",
      text: "Beyond the numbers, I'm curious — what does this problem look like from a personal standpoint? What does your team experience day-to-day because of this? Are there conversations you're tired of having? I ask because the business case is clear, but the human impact is what actually drives change.",
      situation: ["discovery", "needs_analysis"],
      weakness: ["emotional_impact"]
    },
    {
      title: "Stakeholder-Specific Tailoring",
      text: "I've been thinking about how this applies to your specific role. As [title], your priorities are probably [X, Y, Z]. Here's how the insight connects: [tailored explanation]. Meanwhile, your [other stakeholder] will care more about [different angle]. I'd recommend we frame this differently depending on who we're talking to.",
      situation: ["multi_stakeholder", "presentation"],
      weakness: ["tailoring"]
    },
    {
      title: "Taking Constructive Control",
      text: "Based on everything we've discussed, here's what I recommend as a next step: [specific action] with [specific people] by [specific date]. The reason: [why this sequence matters]. Does that make sense, or would you approach it differently?",
      situation: ["closing", "next_steps"],
      weakness: ["constructive_control"]
    }
  ];

  for (const s of scripts) {
    const key = s.weakness[0].toUpperCase();
    chunks.push({
      content_type: "script",
      component_name: key,
      chunk_title: s.title,
      chunk_text: s.text,
      situation_tags: s.situation,
      weakness_tags: s.weakness,
      source_file: "challenger-scripts",
      chunk_index: i++,
      methodology: m,
    });
  }

  // Best practices
  chunks.push({
    content_type: "best_practice",
    component_name: null,
    chunk_title: "Challenger Sale — Core Discipline",
    chunk_text: "The Challenger doesn't just build relationships — they teach. The rep must arrive with an insight the customer hasn't considered. Three rules: (1) Lead with insight, not discovery questions. (2) Reframe before diagnosing — make the customer see the problem differently. (3) Build constructive tension — push back respectfully when the customer's framing is limiting. The goal is to be the rep who makes the customer smarter in every interaction.",
    situation_tags: ["discovery", "strategy"],
    weakness_tags: [],
    source_file: "challenger-best-practices",
    chunk_index: i++,
    methodology: m,
  });

  // ============================================
  // 5-STEP CALL FLOW — the execution sequence
  // ============================================

  const processSteps: Array<{step: number; name: string; rule: string; what_to_do: string; pitfall: string}> = [
    {
      step: 1,
      name: "The Warm-Up",
      rule: "Prove you understand their challenges before anything else. No product mention.",
      what_to_do: "Open by naming a specific challenge their industry/role faces — something they'll recognize immediately. Show you've done your homework. Ask: 'Is this what you're seeing?' The goal is credibility through understanding, not rapport through small talk.",
      pitfall: "Leading with 'tell me about your business' or generic discovery. The customer did their research; respect that. Asking basic questions signals you didn't prepare."
    },
    {
      step: 2,
      name: "Reframe",
      rule: "Challenge their current assumptions about the problem. Still no product mention.",
      what_to_do: "Once you've identified a real pain point, push back on how they're thinking about it. 'Most companies see this as an X problem, but our data shows it's actually a Y problem.' Use pattern recognition from other clients to expose blind spots. The goal is to make them think differently, not to tell them they're wrong.",
      pitfall: "Accepting the customer's framing at face value. If they think the problem is price, and you don't challenge that, you're stuck in a price conversation. The reframe has to land before you move on."
    },
    {
      step: 3,
      name: "Rational Drowning + Emotional Impact",
      rule: "Quantify the cost of inaction, then connect it to personal stakes.",
      what_to_do: "First: put numbers on the status quo — 'Based on what you shared, this is costing you roughly $X per month in [metric].' Make it concrete and specific to their business. Then: connect to human impact — 'What does this mean for your team? For your own goals?' The combination of data + personal stakes creates urgency that benefits alone can't.",
      pitfall: "Staying abstract. 'This could impact revenue' doesn't move anyone. 'Your team is losing roughly 12 hours per week on this — that's a full-time rep's capacity' — that moves them. Also: don't skip the emotional piece. Data convinces the brain; personal stakes move the decision."
    },
    {
      step: 4,
      name: "A New Way",
      rule: "Paint the solution vision — what good looks like — without mentioning your product.",
      what_to_do: "Now that they see the problem differently and feel the cost of inaction, describe what solving it looks like. 'Here's what top performers in your space are doing differently...' Focus on the outcome and the process change, not the tool. Help them envision their world after the problem is solved. The goal is desire for change, not desire for your product.",
      pitfall: "Jumping to product too early. If you introduce your solution here, you lose the teaching position. The customer needs to want the outcome before they evaluate how to get there. Also: don't skip the behavior change conversation — 'Here's what would need to change about how your team operates.'"
    },
    {
      step: 5,
      name: "Your Solution",
      rule: "Present your product as the answer to the vision they now want.",
      what_to_do: "Only now — after they've been reframed, quantified the pain, felt the stakes, and envisioned the solution — do you introduce your product. 'That solution you just described? We built exactly that. Here's how it maps to what you need.' The conversation has been about them the entire time; your product is the natural conclusion, not the opening pitch.",
      pitfall: "Presenting features instead of mapping to their specific reframe. The customer doesn't care about your platform — they care about whether it solves the problem you just spent 4 steps making real. Also: don't dilute the close with caveats. If you've done steps 1-4 right, step 5 is straightforward."
    }
  ];

  for (const step of processSteps) {
    chunks.push({
      content_type: "process",
      component_name: `STEP_${step.step}_${step.name.toUpperCase().replace(/\s+/g, "_")}`,
      chunk_title: `Step ${step.step}: ${step.name} — ${step.rule}`,
      chunk_text: `WHAT TO DO:\n${step.what_to_do}\n\nWHAT TO AVOID:\n${step.pitfall}`,
      situation_tags: ["call_structure", "process"],
      weakness_tags: ["process_flow", `step_${step.step}`],
      source_file: "challenger-process-flow",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // REP TYPE DIAGNOSTIC — coaching by rep profile
  // ============================================

  const repTypes: Array<{type: string; profile: string; coaching_focus: string; practice: string}> = [
    {
      type: "The Hard Worker",
      profile: "Self-motivated, coachable, won't give up on deals. But tends to outwork problems rather than out-think them — more effort on the wrong things.",
      coaching_focus: "They'll adopt Challenger quickly if given structure. The risk is they'll do the motions without the insight. Coach them on preparation depth — don't just follow the script, arrive with a real insight.",
      practice: "Before each call: write down one non-obvious insight about the prospect's business. Not a fact — an insight. Something they may not have considered. Review with manager before the call."
    },
    {
      type: "The Relationship Builder",
      profile: "Strong emotional connection with prospects, generous with time, builds internal champions. But avoids tension — won't challenge the customer even when the customer is wrong.",
      coaching_focus: "The hardest transition. They equate 'challenging' with 'being difficult.' Reframe: challenging the customer's thinking IS service — you're helping them see what they're missing. Not spending time on rapport isn't rushing; it's respecting the customer's intelligence.",
      practice: "In the next call, when the customer says something you disagree with, say: 'That's how most people see it. But here's what's interesting — when we looked at this across 50 companies in your space, the data told a different story.' Practice delivering this without apologizing."
    },
    {
      type: "The Lone Wolf",
      profile: "High performer on instinct, trusts their gut, doesn't follow process. Gets results but can't be replicated or scaled. The team can't learn from them because even they can't explain what they do.",
      coaching_focus: "Don't try to reform them — they'll resist. Instead, ask them to articulate what they do naturally. 'You just handled that objection brilliantly — walk me through what you were thinking.' Turn their instinct into a model others can learn from.",
      practice: "Record one of their calls. Have them narrate their own decision points: 'Why did you ask that question there? What told you to push back instead of agreeing?' Extract the pattern so it becomes teachable."
    },
    {
      type: "The Problem Solver",
      profile: "Detail-oriented, thorough, genuinely wants to find the best solution. But gets stuck in diagnosis — keeps gathering information instead of taking control of the conversation.",
      coaching_focus: "They're closest to Challenger naturally — they already think in terms of problems and solutions. The gap is assertiveness. They need to learn when to stop diagnosing and start leading. 'You've found the problem. Now tell them what it means.'",
      practice: "Set a timer in the next discovery call: 15 minutes to diagnose, then you must deliver a reframe. 'Based on what you've told me, here's what I think is really going on...' Practice making a assertion before you have 100% of the data."
    }
  ];

  for (const rt of repTypes) {
    const key = rt.type.toUpperCase().replace(/\s+/g, "_");
    chunks.push({
      content_type: "diagnostic",
      component_name: key,
      chunk_title: `Rep Profile: ${rt.type} — Coaching Approach`,
      chunk_text: `PROFILE:\n${rt.profile}\n\nCOACHING FOCUS:\n${rt.coaching_focus}\n\nPRACTICE EXERCISE:\n${rt.practice}`,
      situation_tags: ["coaching", "rep_development", "manager"],
      weakness_tags: [key.toLowerCase()],
      source_file: "challenger-rep-types",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // ANTI-PATTERNS — what experienced reps learn to avoid
  // ============================================

  const pitfalls: Array<{component: string; pattern: string; why_it_fails: string; fix: string}> = [
    {
      component: "COMMERCIAL_INSIGHT",
      pattern: "Leading with a generic statistic instead of a tailored insight.",
      why_it_fails: "Customers can smell a rehearsed stat. 'Companies in your industry are seeing 20% growth' means nothing if it's not connected to THEIR specific situation.",
      fix: "Research one specific thing about this prospect before the call. Reference their recent earnings call, a hire they made, a competitor move. Make the insight theirs."
    },
    {
      component: "REFRAME",
      pattern: "Reframing too aggressively before establishing credibility.",
      why_it_fails: "If the customer doesn't trust that you understand their world, challenging their thinking feels like arrogance, not insight. They dig in.",
      fix: "The warm-up must land first. They need to think 'this person gets it' before they'll accept 'you're thinking about this wrong.' Sequence matters."
    },
    {
      component: "RATIONAL_DROWNING",
      pattern: "Using generic ROI calculators instead of their actual numbers.",
      why_it_fails: "A spreadsheet that says 'you could save $500K' without connecting to their actual P&L is easy to dismiss. It feels like a sales tactic.",
      fix: "Use their numbers. 'You mentioned your team spends 15 hours a week on manual reporting. At your average rep cost, that's roughly $X per month.' If you don't have their numbers, ask for them before the call."
    },
    {
      component: "EMOTIONAL_IMPACT",
      pattern: "Skipping emotional impact entirely — staying in rational-drowning mode.",
      why_it_fails: "B2B buyers are humans. Decisions get made when the rational case AND the personal stakes align. Numbers alone don't create urgency — personal consequence does.",
      fix: "After quantifying, ask: 'What happens to your team if this doesn't get fixed this year?' Let them articulate the human cost. Don't fill the silence."
    },
    {
      component: "TAILORING",
      pattern: "Same pitch to every stakeholder — one-size-fits-all messaging.",
      why_it_fails: "The CFO and the end-user care about completely different things. If you can't speak to each stakeholder's specific priorities, you lose the ones you didn't tailor for.",
      fix: "Map stakeholders before the call. For each person: what's their primary metric? What keeps them up at night? What language do they use? Tailor the insight to their frame."
    },
    {
      component: "CONSTRUCTIVE_CONTROL",
      pattern: "Controlling the process without buy-in — dictating next steps instead of recommending them.",
      why_it_fails: "Constructive control isn't steamrolling. If the customer doesn't agree with the path, they'll nod along and then go silent after the call.",
      fix: "Frame next steps as a recommendation, not a demand. 'Based on everything we've discussed, here's what I'd suggest as a next step. Does that make sense to you?' The question at the end is the difference between control and coercion."
    }
  ];

  for (const p of pitfalls) {
    chunks.push({
      content_type: "pitfall",
      component_name: p.component,
      chunk_title: `Anti-Pattern: ${p.pattern}`,
      chunk_text: `WHAT GOES WRONG:\n${p.pattern}\n\nWHY IT FAILS:\n${p.why_it_fails}\n\nHOW TO FIX IT:\n${p.fix}`,
      situation_tags: ["troubleshooting", "coaching", "call_review"],
      weakness_tags: [p.component.toLowerCase()],
      source_file: "challenger-pitfalls",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // METHODOLOGY COMPARISON — for managers evaluating fit
  // ============================================

  const comparisons: Array<{vs: string; challenger_stance: string; when_to_use: string}> = [
    {
      vs: "SPIN Selling",
      challenger_stance: "SPIN uses questions to uncover needs the customer already has. Challenger teaches the customer about needs they didn't know they had. SPIN works when the problem is clear; Challenger works when the customer doesn't know what they don't know.",
      when_to_use: "Use Challenger over SPIN when: (1) your solution addresses problems customers haven't articulated yet, (2) the status quo bias is strong and questions alone won't create urgency, (3) you're selling against 'do nothing' more than against competitors."
    },
    {
      vs: "Solution Selling",
      challenger_stance: "Solution Selling uncovers needs through discovery, then positions your solution. Challenger inverts this — you teach first, then the customer discovers their own needs through the teaching. Solution Selling reacts to what customers tell you; Challenger shapes what customers think.",
      when_to_use: "Use Challenger over Solution Selling when: (1) customers come to calls with strong but incomplete assumptions, (2) the buying process is complex and multi-stakeholder, (3) your differentiation isn't obvious from a feature comparison."
    },
    {
      vs: "Consultative Selling",
      challenger_stance: "Consultative Selling builds trust through deep relationships and being a helpful advisor. Challenger builds trust through insight — the rep earns credibility by making the customer smarter in every interaction. Same goal (trusted advisor), different path (insight vs. rapport).",
      when_to_use: "Use Challenger over Consultative when: (1) sales cycles are compressed and you can't spend months building relationships, (2) the customer has already done extensive research, (3) you're selling into teams where the primary contact can't be the relationship anchor for every stakeholder."
    }
  ];

  for (const comp of comparisons) {
    const key = comp.vs.toUpperCase().replace(/\s+/g, "_");
    chunks.push({
      content_type: "comparison",
      component_name: key,
      chunk_title: `Challenger vs. ${comp.vs}`,
      chunk_text: `CHALLENGER STANCE:\n${comp.challenger_stance}\n\nWHEN TO USE CHALLENGER:\n${comp.when_to_use}`,
      situation_tags: ["methodology_selection", "strategy", "manager"],
      weakness_tags: [],
      source_file: "challenger-comparisons",
      chunk_index: i++,
      methodology: m,
    });
  }

  return chunks;
}

// ============================================
// SPIN SELLING
// ============================================

function buildSPINChunks(): MethodologyChunk[] {
  const m = "spin";
  const chunks: MethodologyChunk[] = [];
  let i = 0;

  const components: Array<{name: string; desc: string; principles: string}> = [
    {
      name: "Situation Questions",
      desc: "Gathering necessary context without over-interrogating. These questions establish the current environment — facts, processes, systems, and numbers the rep needs to understand before going deeper.",
      principles: "Do your homework first — don't ask what you can Google. Keep situation questions tight: 2-3 focused fact-finding questions max. The goal is context, not interrogation."
    },
    {
      name: "Problem Questions",
      desc: "Uncovering dissatisfaction, difficulty, or gaps in the current state. The rep probes for where the customer is struggling, frustrated, or falling short of their goals.",
      principles: "Ask about what's not working, not what they want. Probe for difficulty: 'What makes that challenging?' Surface latent dissatisfaction the customer may not have articulated."
    },
    {
      name: "Implication Questions",
      desc: "Expanding the consequences so the problem becomes urgent. The rep explores the ripple effects — what happens if the problem continues, who else is affected, what does it cost.",
      principles: "Follow every problem with 'and what does that lead to?' Quantify the domino effect. Connect operational problems to business outcomes. Make the cost of inaction explicit."
    },
    {
      name: "Need-Payoff Questions",
      desc: "Helping the buyer articulate value in their own words. Instead of telling the customer why they need a solution, the rep asks questions that let the buyer describe the benefit themselves.",
      principles: "Ask: 'If you could solve this, what would it mean?' Let the buyer paint the picture. Never state a benefit the buyer hasn't first described. The buyer's own words create conviction."
    },
    {
      name: "Question Sequence",
      desc: "Questions progress from context (Situation) to problem (Problem) to consequence (Implication) to value (Need-Payoff). The rep resists jumping ahead or presenting too early.",
      principles: "Never present before the buyer sees explicit need. The sequence matters: S → P → I → N. Resist the urge to pitch — if the buyer hasn't articulated need, they're not ready."
    },
    {
      name: "Explicit Need",
      desc: "The buyer clearly states a desire for capability, change, or solution. This is the signal that the rep can now present — the buyer has said 'we need this' in their own words.",
      principles: "Listen for statements like 'we need,' 'we want,' 'it would help if,' 'we have to change.' Implied need ('I'm frustrated with...') is not enough — wait for explicit need before presenting."
    }
  ];

  for (const c of components) {
    const key = c.name.toUpperCase().replace(/\s+/g, "_");
    chunks.push({
      content_type: "component",
      component_name: key,
      chunk_title: `SPIN — ${c.name}`,
      chunk_text: `${c.desc}\n\nKey Principles:\n${c.principles}`,
      situation_tags: ["discovery", "needs_analysis"],
      weakness_tags: [key.toLowerCase()],
      source_file: "spin-methodology",
      chunk_index: i++,
      methodology: m,
    });
  }

  const scripts: Array<{title: string; text: string; situation: string[]; weakness: string[]}> = [
    {
      title: "SPIN — Problem Question That Works",
      text: "You mentioned your team is doing [current process]. What's the biggest frustration or bottleneck with that approach right now? Where does it break down most often?",
      situation: ["discovery", "first_call"],
      weakness: ["problem_questions"]
    },
    {
      title: "SPIN — Implication Question Sequence",
      text: "You mentioned [problem]. Let me ask: what does that cost you in terms of [time/revenue/team morale]? And if this continues for another six months, what's the impact on [key metric]? Who else in the organization feels the ripple effects?",
      situation: ["discovery", "needs_analysis"],
      weakness: ["implication_questions"]
    },
    {
      title: "SPIN — Need-Payoff That Creates Ownership",
      text: "If you could wave a magic wand and fix [problem] completely, what would that look like? What would change for your team? For you personally? And what would solving this be worth to the business?",
      situation: ["discovery", "closing"],
      weakness: ["need_payoff_questions"]
    },
    {
      title: "SPIN — Full Sequence Framework",
      text: "Situation: 'Tell me about your current [process/team/tool].' → Problem: 'What's the biggest challenge with that?' → Implication: 'What does that challenge cost you?' → Need-Payoff: 'If you could solve it, what would that mean?' — Don't present until the buyer gives you explicit need.",
      situation: ["discovery", "first_call"],
      weakness: ["question_sequence"]
    },
    {
      title: "SPIN — Testing for Explicit Need Before Presenting",
      text: "Before I share how we might help, I want to make sure I've understood correctly. You're telling me that [problem] is costing you [impact], and if you could solve it, you'd see [benefit]. Is that right? And solving this is a priority for you right now?",
      situation: ["closing", "presentation"],
      weakness: ["explicit_need"]
    },
    {
      title: "SPIN — Efficient Situation Questions",
      text: "I've done some research on your company, so I won't ask you to repeat the basics. Two quick context questions: first, how does [specific process] work today? And second, roughly how many [people/transactions/deals] does that involve per [period]?",
      situation: ["first_call", "discovery"],
      weakness: ["situation_questions"]
    }
  ];

  for (const s of scripts) {
    const key = s.weakness[0].toUpperCase();
    chunks.push({
      content_type: "script",
      component_name: key,
      chunk_title: s.title,
      chunk_text: s.text,
      situation_tags: s.situation,
      weakness_tags: s.weakness,
      source_file: "spin-scripts",
      chunk_index: i++,
      methodology: m,
    });
  }

  chunks.push({
    content_type: "best_practice",
    component_name: null,
    chunk_title: "SPIN Selling — The Golden Rule",
    chunk_text: "The fundamental SPIN discipline: never present your solution until the buyer has articulated explicit need. Implied need ('I'm frustrated') is not enough. You must hear the buyer say, in their own words, that they want or need the capability you offer. The entire SPIN sequence (Situation → Problem → Implication → Need-Payoff) exists to get you to that moment. Jump the gun and you've become a product pitcher, not a SPIN seller.",
    situation_tags: ["discovery", "strategy"],
    weakness_tags: [],
    source_file: "spin-best-practices",
    chunk_index: i++,
    methodology: m,
  });

  // ============================================
  // SPIN CALL STAGES — the four-stage call structure
  // Based on Rackham's research across 35,000+ observed calls.
  // Distinct from the S-P-I-N question types — this is the call arc.
  // ============================================

  const spinCallStages: Array<{stage: number; name: string; rule: string; what_to_do: string; pitfall: string; script: string}> = [
    {
      stage: 1,
      name: "Opening",
      rule: "Gain the right to ask questions. Brief, customer-focused, no product pitch.",
      what_to_do: "Connect with the buyer's context. State an agenda that prioritizes their needs. Secure permission to ask questions. 'Thanks for the time — given your role leading sales at [company], I'm interested in how you're approaching [topic] today.' The goal is permission to investigate, not to impress.",
      pitfall: "Monologuing about your company or product in the first 90 seconds. The buyer agreed to a conversation, not a presentation. Every minute you spend talking about yourself is a minute you're not learning about them.",
      script: "'My goal today is to understand how you're currently handling [area] — what's working, what's not — and then we can see if it makes sense to explore how teams use [solution] to help. Does that agenda work, or is there anything you want to make sure we cover?'"
    },
    {
      stage: 2,
      name: "Investigating",
      rule: "The core of SPIN. Uncover and develop buyer needs using S-P-I-N questions. Top performers spend disproportionate time here.",
      what_to_do: "Use Situation questions to confirm context (minimal — do homework first). Move quickly to Problem questions to surface dissatisfaction. Then Implication questions to magnify the cost of inaction. Finally Need-Payoff questions to let the buyer articulate the value of solving. The progression matters: facts → pains → consequences → desired outcomes.",
      pitfall: "Spending too long on Situation questions (interrogation) or skipping Implication entirely (jumping from Problem to solution). Without Implication, problems feel manageable. The Investigating stage is where deals are won or lost — don't rush it.",
      script: "Problem: 'Where do you see coaching breaking down — consistency, quality of feedback, or follow-through?' Implication: 'When coaching is inconsistent, how does that show up in new hire ramp time or win rates?' Need-Payoff: 'If you could make coaching measurable across the team, what would success look like six months from now?'"
    },
    {
      stage: 3,
      name: "Demonstrating Capability",
      rule: "Map solution capabilities to explicit needs the buyer has voiced. Not a generic feature tour.",
      what_to_do: "Only demonstrate features that directly address needs the buyer articulated during Investigating. For each capability: 'Earlier you mentioned [explicit need] — here's how [feature] addresses that.' Use the buyer's own words from the Need-Payoff stage. If you can't link a feature to something they said, skip it.",
      pitfall: "Defaulting to a standard demo deck. The buyer doesn't care about your platform — they care about whether it solves the specific problems they just described. A 3-feature demo tied to their needs beats a 20-feature tour tied to your product roadmap.",
      script: "'You mentioned that coaching quality varies a lot by manager. Here's how OCC standardizes coaching checklists so every rep gets best-practice conversations regardless of who their manager is.'"
    },
    {
      stage: 4,
      name: "Obtaining Commitment",
      rule: "Secure agreement to a specific next step. Not a forced close — a natural progression.",
      what_to_do: "In complex B2B, 'commitment' means advancing the deal: involving additional stakeholders, running a pilot, co-defining success criteria. Frame as a recommendation: 'Based on everything we've discussed, here's what I'd suggest as a next step.' The commitment should feel like the logical conclusion of the Investigating stage — not a pivot to sales mode.",
      pitfall: "Pushing for a close when the buyer hasn't articulated explicit need. If you skipped Implication or Need-Payoff, the commitment conversation will feel premature. Also: accepting 'send me information' as a commitment. That's a deflection, not a next step.",
      script: "'Given what we've discussed, would it make sense to loop in your enablement lead and run a working session on what a 30-day pilot might look like? What outcomes would we need to see for you to feel confident scaling across the org?'"
    }
  ];

  for (const stage of spinCallStages) {
    const key = `SPIN_STAGE_${stage.stage}`;
    chunks.push({
      content_type: "process",
      component_name: key,
      chunk_title: `SPIN Stage ${stage.stage}: ${stage.name} — ${stage.rule}`,
      chunk_text: `WHAT TO DO:\n${stage.what_to_do}\n\nMICRO-SCRIPT:\n${stage.script}\n\nWHAT TO AVOID:\n${stage.pitfall}`,
      situation_tags: ["call_structure", "process"],
      weakness_tags: ["process_flow", `stage_${stage.stage}`],
      source_file: "spin-call-stages",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // S-P-I-N QUESTION PROGRESSION — the four question types as a sequence
  // ============================================

  const spinQuestionFlow: Array<{step: number; type: string; definition: string; examples: string; modern_note: string}> = [
    {
      step: 1,
      type: "Situation",
      definition: "Fact-finding about current context: systems, processes, team, metrics. Creates a baseline but adds limited buyer value if overused.",
      examples: "'What tools are you currently using to manage your sales pipeline?' 'How is coaching structured across your managers and reps today?'",
      modern_note: "Minimize live Situation questions. Do pre-call research first. Only ask what you couldn't learn from LinkedIn, their website, or previous interactions. Overuse signals you didn't prepare."
    },
    {
      step: 2,
      type: "Problem",
      definition: "Probing for difficulties, dissatisfactions, and gaps where the current state falls short. Surfaces issues that can be developed into explicit needs.",
      examples: "'Where do you see coaching breaking down — consistency, quality, or follow-through?' 'What obstacles are you facing in hitting your targets?'",
      modern_note: "Map to common SaaS pains: low win rates, long cycles, poor pipeline hygiene, under-coached reps. Use industry-specific problem patterns to show you understand their world."
    },
    {
      step: 3,
      type: "Implication",
      definition: "Exploring the downstream consequences of problems: operational, financial, strategic, personal. This is what turns 'we should fix this' into 'we MUST fix this.'",
      examples: "'How does inconsistent coaching show up in new hire ramp time?' 'What's the ripple effect on forecast accuracy when managers coach differently?'",
      modern_note: "The most skipped and most powerful question type. Rackham's research: Implication questions are the strongest predictor of success in complex deals. Link every problem to 2-3 implication angles: financial, operational, strategic."
    },
    {
      step: 4,
      type: "Need-Payoff",
      definition: "Getting the buyer to articulate the value of solving the problem in their own words. Their description of the payoff creates conviction — your description creates skepticism.",
      examples: "'If you could make coaching measurable and consistent across the team, what would success look like six months from now?' 'Who else would benefit if you fixed this?'",
      modern_note: "This is the bridge to Demonstrating Capability. The buyer's Need-Payoff statements become your demo script. Reference their exact words when you show how your solution delivers."
    }
  ];

  for (const q of spinQuestionFlow) {
    const key = q.type.toUpperCase();
    chunks.push({
      content_type: "process",
      component_name: `SPIN_Q_${key}`,
      chunk_title: `SPIN Question Type: ${q.type} — ${q.definition.substring(0, 60)}...`,
      chunk_text: `DEFINITION:\n${q.definition}\n\nEXAMPLE QUESTIONS:\n${q.examples}\n\nMODERN ADAPTATION:\n${q.modern_note}`,
      situation_tags: ["discovery", "questioning", "process"],
      weakness_tags: [q.type.toLowerCase(), "question_sequence"],
      source_file: "spin-question-flow",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // SPIN ANTI-PATTERNS — what the 35,000-call research revealed
  // ============================================

  const spinPitfalls: Array<{component: string; pattern: string; why_it_fails: string; fix: string; research_note: string}> = [
    {
      component: "SITUATION_QUESTIONS",
      pattern: "Interrogation mode — asking 10+ Situation questions without having done pre-call research.",
      why_it_fails: "Rackham's research showed Situation questions add no value to the buyer. They tolerate a few, but too many signals you're unprepared and wasting their time. The buyer disengages.",
      fix: "Pre-call research should answer 80% of Situation questions. Ask only 2-3 to confirm key facts. Open with: 'I've looked at [research], so I won't waste your time on basics. Can you fill in one gap?'",
      research_note: "Situation questions correlate negatively with success when overused. Average reps ask more Situation questions than top performers."
    },
    {
      component: "PROBLEM_QUESTIONS",
      pattern: "Accepting surface-level answers — 'we're fine' or 'it's not a big deal' without probing deeper.",
      why_it_fails: "Top performers ask more Problem questions than average reps because they don't stop at the first answer. 'Fine' usually means 'I don't trust you enough to be honest yet' or 'I haven't thought about this deeply.'",
      fix: "Don't argue with 'fine.' Redirect with specificity: 'Most teams in your space are struggling with [specific issue]. Is that not the case for you?' Use industry pattern recognition to surface latent dissatisfaction.",
      research_note: "Problem questions are the second strongest predictor of success in complex deals. High performers surface 2-3x more problems than average reps."
    },
    {
      component: "IMPLICATION_QUESTIONS",
      pattern: "Skipping Implication entirely — identifying a problem, then immediately moving to solution or Need-Payoff.",
      why_it_fails: "This is the single most common SPIN failure. Without Implication, problems feel manageable. 'Yeah, our coaching is inconsistent. We manage.' The rep loses because the problem never became urgent. Rackham identified Implication questions as THE distinguishing factor in complex deals.",
      fix: "Rule: after every Problem question, ask at least one Implication question. 'What does that cost you?' 'How does that impact your team's ability to hit targets?' Let silence do the work. One well-placed implication question is worth five features.",
      research_note: "Implication questions are the #1 predictor of success in large B2B sales. They turn implied needs into explicit, strongly-felt needs."
    },
    {
      component: "NEED_PAYOFF_QUESTIONS",
      pattern: "Telling the buyer what the benefit would be instead of asking them to describe it themselves.",
      why_it_fails: "When you state the benefit, the buyer evaluates and can dismiss it. When they state it in their own words, they own it. 'You'd save 20 hours a week' is negotiable — 'We'd get 20 hours back' is conviction.",
      fix: "Ask: 'If this problem disappeared, what changes for your team?' Then be quiet. Whatever they describe becomes your value proposition. Reference their exact words in Demonstrating Capability.",
      research_note: "Rackham found that having the customer state the payoff is more persuasive than the seller pushing benefits, especially in multi-stakeholder complex sales."
    },
    {
      component: "QUESTION_SEQUENCE",
      pattern: "Jumping from Situation straight to Need-Payoff without passing through Problem and Implication.",
      why_it_fails: "The SPIN sequence exists because each stage psychologically prepares the buyer for the next. Skipping stages is like trying to close before discovery. The buyer isn't ready — you haven't earned the right to talk about solutions.",
      fix: "Post-call self-check: count your questions by type. If Implication = 0, you skipped the most important stage. In complex deals, consider stretching SPIN across multiple calls — Situation + early Problem in call 1, deep Implication + Need-Payoff in call 2.",
      research_note: "Complex deals often cannot compress the full S-P-I-N sequence into one meeting. Top performers adapt the pacing to the deal complexity."
    },
    {
      component: "EXPLICIT_NEED",
      pattern: "Presenting on implied need — hearing 'I'm frustrated with our process' and treating it as 'I want to buy your solution.'",
      why_it_fails: "'Frustrated' is not 'committed.' Implied need acknowledges a problem but not the willingness to solve it. Presenting here is premature — the buyer is venting, not buying. This is why the full sequence matters.",
      fix: "The test: did the buyer say 'we need' or 'we want' unprompted? If not, ask one more Implication question. Don't enter Demonstrating Capability until you hear explicit need in their language. Implied need = problem acknowledged. Explicit need = problem + desire + urgency.",
      research_note: "35,000+ calls showed: successful reps generate fewer objections by asking better questions upfront. Premature presentation creates objections that wouldn't exist if the need was properly developed."
    }
  ];

  for (const p of spinPitfalls) {
    chunks.push({
      content_type: "pitfall",
      component_name: p.component,
      chunk_title: `SPIN Anti-Pattern: ${p.pattern}`,
      chunk_text: `WHAT GOES WRONG:\n${p.pattern}\n\nWHY IT FAILS:\n${p.why_it_fails}\n\nHOW TO FIX IT:\n${p.fix}\n\nRESEARCH NOTE:\n${p.research_note}`,
      situation_tags: ["troubleshooting", "coaching", "call_review"],
      weakness_tags: [p.component.toLowerCase()],
      source_file: "spin-pitfalls",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // SPIN MODERN ADAPTATIONS — applying SPIN to SaaS and PLG
  // ============================================

  const spinAdaptations: Array<{title: string; content: string}> = [
    {
      title: "Multi-Call SPIN — Stretching the Sequence Across Interactions",
      content: "Complex B2B deals rarely compress the full S-P-I-N sequence into one meeting. Modern practice: Call 1 (Discovery) = Situation + Problem questions. Call 2 (Deep Dive) = Implication + Need-Payoff questions. Call 3 (Demo) = Demonstrating Capability tied to explicit needs. This prevents interrogation and gives the buyer time to process implications between calls."
    },
    {
      title: "Pre-Call Research — Minimizing Live Situation Questions",
      content: "Use LinkedIn, annual reports, CRM history, and product analytics to answer Situation questions before the call. The goal: arrive with 80% of context already known. Live Situation questions should only confirm or clarify, never establish baseline facts. 'I noticed you recently expanded your SDR team — how has that changed your coaching needs?' signals preparation without interrogation."
    },
    {
      title: "SPIN + Behavior Change — Combating Training Decay",
      content: "SPIN is a skill, not a script. Reps who memorize S-P-I-N as a checklist produce unnatural conversations. OCC's approach: coach specific question types as micro-skills, spaced over weeks. Week 1: practice Problem questions only. Week 2: add Implication follow-ups. Week 3: transition timing (when to move from P to I). The methodology becomes instinct through repetition, not memorization."
    }
  ];

  for (const a of spinAdaptations) {
    chunks.push({
      content_type: "best_practice",
      component_name: null,
      chunk_title: a.title,
      chunk_text: a.content,
      situation_tags: ["strategy", "modern_selling", "saas"],
      weakness_tags: [],
      source_file: "spin-adaptations",
      chunk_index: i++,
      methodology: m,
    });
  }

  return chunks;
}

function buildGapChunks(): MethodologyChunk[] {
  const m = "gap";
  const chunks: MethodologyChunk[] = [];
  let i = 0;

  const components: Array<{name: string; desc: string; principles: string}> = [
    {
      name: "Current State",
      desc: "Clearly diagnosing the customer's present reality — what's happening right now without sugarcoating. The rep maps processes, metrics, pain points, and the lived experience of the problem.",
      principles: "Get granular: 'Walk me through exactly what happens today.' Use the customer's own language to describe reality. Before you talk about better, you must nail exactly what 'now' looks like."
    },
    {
      name: "Future State",
      desc: "Defining what better looks like in the buyer's terms. The rep helps the customer articulate a concrete, measurable vision of success — not 'better results' but specific outcomes.",
      principles: "Ask: 'If this were working perfectly, what would be different?' Get specific metrics. The Future State must be the buyer's vision, not the vendor's product description."
    },
    {
      name: "Root Cause",
      desc: "Investigating why the gap exists — the underlying driver, not surface symptoms. The rep digs past 'we don't have the right tools' to the process, people, or structural issue causing the problem.",
      principles: "Ask 'why' at least three times. Distinguish cause from symptom. The root cause is almost never 'we need better software' — it's usually a process, behavior, or structural issue."
    },
    {
      name: "Business Impact",
      desc: "Quantifying the operational, financial, and strategic impact of the gap. The rep puts hard numbers on what the gap costs — revenue lost, time wasted, risk incurred.",
      principles: "Attach a dollar figure wherever possible. Calculate annual impact: per-incident cost × frequency × 12 months. Include opportunity cost, not just direct cost."
    },
    {
      name: "Gap Value",
      desc: "Connecting the size of the gap to business value. The wider the gap between Current State and Future State, the more valuable the solution. The rep makes the gap tangible.",
      principles: "Frame the gap as: 'From [current metric] to [future metric] equals [value].' The gap IS the business case. If the gap is small, the need is small. Don't inflate — be honest."
    },
    {
      name: "Diagnose Before Prescribe",
      desc: "Resisting the urge to pitch until the full diagnosis is complete. The rep stays in discovery mode until Current State, Future State, Root Cause, and Impact are all clear.",
      principles: "Never prescribe before you've diagnosed. If you catch yourself pitching, stop and ask another question. The diagnosis phase is complete when both you and the buyer see the full gap clearly."
    }
  ];

  for (const c of components) {
    const key = c.name.toUpperCase().replace(/\s+/g, "_");
    chunks.push({
      content_type: "component",
      component_name: key,
      chunk_title: `Gap Selling — ${c.name}`,
      chunk_text: `${c.desc}\n\nKey Principles:\n${c.principles}`,
      situation_tags: ["discovery", "diagnosis"],
      weakness_tags: [key.toLowerCase()],
      source_file: "gap-methodology",
      chunk_index: i++,
      methodology: m,
    });
  }

  const scripts: Array<{title: string; text: string; situation: string[]; weakness: string[]}> = [
    {
      title: "Gap Selling — Current State Diagnosis",
      text: "Before we talk about solutions, I want to understand exactly where you are today. Walk me through your current [process/team/situation] — not the ideal version, but what actually happens day to day. What's working? What breaks? Where do you feel the friction most?",
      situation: ["discovery", "first_call"],
      weakness: ["current_state"]
    },
    {
      title: "Gap Selling — Future State Vision",
      text: "Let's imagine it's 12 months from now and [problem area] is running exactly how you want it. Paint me a picture — what's different? What metrics have changed? What does your team experience that they don't experience today?",
      situation: ["discovery", "needs_analysis"],
      weakness: ["future_state"]
    },
    {
      title: "Gap Selling — Root Cause Drill",
      text: "You mentioned [symptom]. I want to go a level deeper. Why do you think that's happening? And what's driving that? What would have to be true for [symptom] to not exist anymore? I'm not looking for the software answer — I'm looking for the structural reason.",
      situation: ["discovery", "diagnosis"],
      weakness: ["root_cause"]
    },
    {
      title: "Gap Selling — Quantifying Business Impact",
      text: "Let's put some numbers on the gap. You're currently at [current state metric]. You want to be at [future state metric]. Every [period] that gap is costing you roughly [calculation]. Over a year, we're looking at [annual impact]. And that's just the direct cost — we haven't even factored in [secondary impact]. Does that sound about right?",
      situation: ["discovery", "pricing", "business_case"],
      weakness: ["business_impact"]
    },
    {
      title: "Gap Selling — Stating the Gap Value",
      text: "So here's what I'm hearing. Your Current State is [X]. Your Future State is [Y]. The gap between them is [delta], and that gap is costing you [impact]. The value of closing this gap — of moving from X to Y — is [value]. That's the business case. That's what we're solving for. Is that a fair summary?",
      situation: ["closing", "presentation"],
      weakness: ["gap_value"]
    },
    {
      title: "Gap Selling — Holding the Diagnosis Line",
      text: "I know you want to see the product — and we'll get there. But right now I'm still in diagnosis mode. The most expensive mistake I see companies make is prescribing before the diagnosis is complete. Let me ask two more questions to make sure I really understand the full picture, and then I'll show you exactly how this applies.",
      situation: ["demo_request", "objection"],
      weakness: ["diagnose_before_prescribe"]
    }
  ];

  for (const s of scripts) {
    const key = s.weakness[0].toUpperCase();
    chunks.push({
      content_type: "script",
      component_name: key,
      chunk_title: s.title,
      chunk_text: s.text,
      situation_tags: s.situation,
      weakness_tags: s.weakness,
      source_file: "gap-scripts",
      chunk_index: i++,
      methodology: m,
    });
  }

  chunks.push({
    content_type: "best_practice",
    component_name: null,
    chunk_title: "Gap Selling — The Core Philosophy",
    chunk_text: "Gap Selling isn't about features or relationships — it's about the gap between where the customer is and where they need to be. The wider the gap, the more valuable the solution. The rep's job is to diagnose that gap with precision: Current State, Future State, Root Cause, and Business Impact. Only when all four are clear — and the customer sees them clearly — does the rep present. Everything before that is diagnosis. Everything after is prescription. Mix the two and you lose credibility.",
    situation_tags: ["discovery", "strategy"],
    weakness_tags: [],
    source_file: "gap-best-practices",
    chunk_index: i++,
    methodology: m,
  });

  // ============================================
  // GAP SELLING DISCOVERY FLOW — the 6-step diagnosis sequence
  // Based on Keenan's Gap Selling: "No gap, no sale."
  // The rep diagnoses like a doctor before prescribing.
  // ============================================

  const gapDiscoverySteps: Array<{step: number; name: string; rule: string; what_to_do: string; pitfall: string; script: string}> = [
    {
      step: 1,
      name: "Establish Context & Permission",
      rule: "Get agreement to diagnose before you examine. 'Does that work?'",
      what_to_do: "Before talking about what you do, frame the conversation as diagnosis. 'I'd like to understand your world first so we can see if there's even a meaningful gap for us to help with. Does that work?' This sets the expectation that you're not pitching — you're investigating. The buyer gives permission to ask hard questions.",
      pitfall: "Leading with 'tell me about your business' or jumping straight into product context. Without permission to diagnose, probing questions feel invasive rather than professional.",
      script: "'Before we talk about solutions, I'd like to understand your current environment — what's working, what's not, and where you want to be. That way we'll both know if there's actually a gap worth closing. Does that approach work for you?'"
    },
    {
      step: 2,
      name: "Diagnose Current State",
      rule: "Facts before opinions. Specifics before generalities. Ban vague answers.",
      what_to_do: "Map their current reality: environment, processes, tools, metrics, and problems. 'Walk me through how you currently handle [area].' Push for specifics: 'How many?' 'How often?' 'What tools?' Every vague answer gets a follow-up: 'Can you give me an example?' 'When did this start?' Cover technical AND business dimensions.",
      pitfall: "Accepting 'we're doing okay' or 'it's a bit chaotic' without drilling down. Vague answers hide the gap. If the rep doesn't have numbers, processes, and timelines by the end of this stage, they haven't diagnosed — they've chatted.",
      script: "'What tools and processes are involved today? What are the key metrics you watch — things like [metric 1, metric 2]? Where are they today? What's working well, and where do you see things breaking down?'"
    },
    {
      step: 3,
      name: "Uncover Problems & Root Causes",
      rule: "Don't sell to need — diagnose the real problem behind the expressed need.",
      what_to_do: "Surface concrete problems, then dig for root causes. 'When [problem] happens, what typically causes it?' 'How often?' 'Who else is impacted?' Keenan's rule: the goal isn't to ask scripted questions — it's to obtain specific information about the problem, impact, and root cause. If the buyer gives symptoms, ask what's underneath.",
      pitfall: "Selling to expressed need instead of real problem. The buyer says 'we need better reporting' — average rep demos reporting features. Gap seller asks: 'What problem exists because your reporting is inadequate? What decisions are you making without good data?' The need is the symptom; the problem is the disease.",
      script: "'When [problem] happens, what typically causes it? How often does that happen in a typical week or month? Who else is impacted when it does? What have you tried to fix it so far?'"
    },
    {
      step: 4,
      name: "Quantify Impact & Cost of Inaction",
      rule: "Get their numbers — even rough ones. 'What is that costing you?'",
      what_to_do: "Put dollar figures, time costs, or risk exposure on every significant problem. 'Roughly how much is [problem] costing you — in lost deals, wasted hours, customer churn — each quarter? Even a ballpark helps.' Then project forward: 'If nothing changed over 12 months, what would that mean?' The cost of inaction is the urgency lever — no pressure tactics needed when the buyer sees their own math.",
      pitfall: "Staying qualitative. 'This is impacting your pipeline' doesn't move anyone. 'Based on your 22% win rate and 50 deals per quarter, inconsistent discovery is costing you roughly 4-5 lost deals per quarter — call it $200K in revenue' — that moves them. If the rep can't produce a number, even an estimate, the gap isn't quantified.",
      script: "'Roughly how much is this costing you — in lost deals, wasted hours, churn — each quarter? If nothing changed over the next twelve months, what would that mean for your team and your numbers?'"
    },
    {
      step: 5,
      name: "Design the Future State",
      rule: "Make 'good' concrete and testable. If you can't measure it, it's not a future state.",
      what_to_do: "Co-design where they want to be. 'Fast forward 12 months — what would success look like?' Get target metrics: 'Where would you want win rate to be?' Get qualitative outcomes: 'Beyond the numbers, how would you want this to feel for you and the team?' Keenan: if a year from now the buyer can't say 'yes, we achieved this,' the future state wasn't defined clearly enough.",
      pitfall: "Accepting vague outcomes like 'we want to be better at coaching.' Better how? Measured by what? If the future state isn't testable, the gap can't be quantified, and there's no way to prove the solution worked.",
      script: "'Imagine we're 12 months out and you're saying this was a success. What's different? Where would you want [metric] to be instead of [current value]? Beyond the numbers, how would you want this to feel for you and your team?'"
    },
    {
      step: 6,
      name: "Frame the Gap & Align Decision Criteria",
      rule: "State the gap explicitly and get buyer agreement. 'Did I get that right?'",
      what_to_do: "Summarize: 'So today you're at [current state]; you'd like to be at [future state]. That gap of roughly [impact] per year is what we're talking about closing. Did I capture that accurately?' Then align on how they'll decide: 'What needs to be true for you to say yes?' Map stakeholders, steps, approvals. The gap becomes the shared narrative — everything else orbits around it.",
      pitfall: "Moving to demo or proposal without explicitly stating the gap and getting agreement. If the buyer doesn't nod at the gap summary, they haven't bought into the diagnosis. Demo before gap alignment = feature pitching, not gap selling.",
      script: "'So today you're at [current state]; you'd like to be at [future state]. That gap of roughly [impact] per year is what we're talking about closing. Did I capture that accurately? What needs to be true for you to say yes to closing this?'"
    }
  ];

  for (const step of gapDiscoverySteps) {
    chunks.push({
      content_type: "process",
      component_name: `GAP_STEP_${step.step}`,
      chunk_title: `Gap Step ${step.step}: ${step.name} — ${step.rule}`,
      chunk_text: `WHAT TO DO:\n${step.what_to_do}\n\nMICRO-SCRIPT:\n${step.script}\n\nWHAT TO AVOID:\n${step.pitfall}`,
      situation_tags: ["call_structure", "process", "discovery"],
      weakness_tags: ["process_flow", `step_${step.step}`],
      source_file: "gap-discovery-flow",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // GAP SELLING ANTI-PATTERNS
  // ============================================

  const gapPitfalls: Array<{component: string; pattern: string; why_it_fails: string; fix: string}> = [
    {
      component: "CURRENT_STATE",
      pattern: "Accepting vague answers — 'we're doing okay' or 'things are a bit chaotic' — without drilling for specifics.",
      why_it_fails: "Keenan's rule: banish vague, open-ended answers. 'Okay' is not a current state — it's a conversation ender. Without concrete facts, there's no baseline to measure the gap from. The rep is guessing, not diagnosing.",
      fix: "Every vague answer gets a specific follow-up: 'Can you give me an example?' 'How often does that happen?' 'What tools are involved?' Don't move on until you have numbers, processes, or specific events."
    },
    {
      component: "FUTURE_STATE",
      pattern: "Defining the future state as 'we want to be better at X' without measurable targets.",
      why_it_fails: "If the future state isn't testable, the gap can't be quantified. 'Better coaching' means nothing. 'Win rates up from 22% to 35% with 90-day ramp instead of 6 months' — that's a future state you can prove you delivered.",
      fix: "Ask: 'If we're sitting here 12 months from now, what would you need to see to say this was worth it?' Push for metrics. If they can't articulate a measurable outcome, the gap isn't real enough to justify change."
    },
    {
      component: "ROOT_CAUSE",
      pattern: "Treating symptoms as problems — selling to the expressed need instead of diagnosing what's underneath.",
      why_it_fails: "Keenan: 'Never sell to need.' The buyer says 'we need better reporting.' Average rep demos dashboards. Gap seller asks: 'What problem exists because your reporting is inadequate? What decisions are you making without good data?' The need is the symptom. The root cause is the disease.",
      fix: "For every expressed need, ask 'why' twice. 'We need X.' → 'What problem does not having X create?' → 'And what causes that problem?' Two layers deep is usually where the real gap lives."
    },
    {
      component: "IMPACT",
      pattern: "Staying qualitative — 'this is affecting your pipeline' — instead of putting numbers on the cost of inaction.",
      why_it_fails: "'Affecting pipeline' doesn't create urgency. Numbers do. Keenan: the gap is the value. If you can't quantify what the gap is costing, the buyer has no reason to act now versus later.",
      fix: "Ask for rough numbers. 'Even a ballpark — what's this costing per quarter?' Most buyers can estimate. Then project: 'Over 12 months, that's roughly [annualized].' The buyer does the math and creates their own urgency."
    },
    {
      component: "GAP_VALUE",
      pattern: "Moving to demo or proposal without explicitly stating and getting agreement on the gap.",
      why_it_fails: "If the buyer doesn't nod at the gap summary, they haven't bought into the diagnosis. Demo before gap alignment = the rep is prescribing before the patient agrees they're sick. All objections that follow are symptoms of unaligned diagnosis.",
      fix: "Before any demo or proposal: 'So today you're at [current]; you want to be at [future]. That gap is costing roughly [impact]. Did I get that right?' Don't proceed until you hear 'yes.'"
    },
    {
      component: "NO_PRESCRIBING",
      pattern: "Prescribing the solution (demo, features, pricing) before the diagnosis is complete and agreed upon.",
      why_it_fails: "Keenan: 'No discovery, no demo.' The rep's job is doctor, not pharmacist. Prescribing before diagnosis loses credibility and turns the conversation into a feature pitch. The buyer hasn't felt the gap yet — so the solution has no value.",
      fix: "Self-check before any feature mention: (1) Do I have specific current state facts? (2) Are root causes identified? (3) Is impact quantified? (4) Is the future state defined with metrics? (5) Did the buyer agree to the gap summary? Five nos = no demo."
    }
  ];

  for (const p of gapPitfalls) {
    chunks.push({
      content_type: "pitfall",
      component_name: p.component,
      chunk_title: `Gap Anti-Pattern: ${p.pattern}`,
      chunk_text: `WHAT GOES WRONG:\n${p.pattern}\n\nWHY IT FAILS:\n${p.why_it_fails}\n\nHOW TO FIX IT:\n${p.fix}`,
      situation_tags: ["troubleshooting", "coaching", "call_review"],
      weakness_tags: [p.component.toLowerCase()],
      source_file: "gap-pitfalls",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // GAP SELLING OBJECTION HANDLING — gap-anchored reframes
  // Unique to Gap: objections are signals the gap hasn't been properly diagnosed.
  // ============================================

  const gapObjections: Array<{type: string; trigger: string; pattern: string; script: string}> = [
    {
      type: "price",
      trigger: "\"It's too expensive\" or \"We don't have budget\"",
      pattern: "Validate → Re-surface the gap → Contrast objection with cost of inaction → Recommit",
      script: "VALIDATE: \"I completely understand that budget is a real consideration. Most teams we talk to feel the same way.\"\n\nISOLATE: \"If budget weren't an issue, would this be the approach you'd choose to close the gap we identified?\"\n\nRE-ANCHOR TO GAP: \"Earlier we calculated that [problem] is costing you roughly [impact] per quarter. If we don't address it, that's about [annualized impact] over 12 months. How are you thinking about that trade-off?\""
    },
    {
      type: "status_quo",
      trigger: "\"We're happy with our current vendor\" or \"We're fine as we are\"",
      pattern: "Acknowledge → Surface latent gap → Explore what's still unaddressed",
      script: "ACKNOWLEDGE: \"That's great to hear — it sounds like things are working reasonably well.\"\n\nSURFACE LATENT GAP: \"Many of our current customers felt things were fine too until they dug into [specific problem area]. Based on what you've shared, [problem] is leading to [impact]. How are you thinking about that today?\"\n\nEXPLORE: \"If you could change one thing about how your current approach handles [problem], what would it be?\""
    },
    {
      type: "timing",
      trigger: "\"Reach out next quarter\" or \"Now is not a good time\"",
      pattern: "Accept timeline → Surface what changes → Quantify cost of delay",
      script: "ACCEPT: \"I can certainly circle back next quarter.\"\n\nDIAGNOSE: \"Typically when people want to wait, it's because there are other priorities. What's going to change between now and then that makes this a better time?\"\n\nCOST OF DELAY: \"If we wait 90 days, based on the [impact] we discussed, that's another roughly [X per quarter] in [lost revenue/wasted time]. How does that factor into your thinking?\""
    },
    {
      type: "authority",
      trigger: "\"I need to run this by my boss\" or \"The committee has to approve\"",
      pattern: "Validate process → Turn buyer into champion → Co-create the business case",
      script: "VALIDATE: \"That makes total sense — most decisions like this involve multiple stakeholders.\"\n\nCHAMPION: \"Since you're closest to [problem], what questions do you think your [boss/committee] will have about the impact, ROI, or implementation?\"\n\nCO-CREATE: \"Would it be helpful if we put together a one-page summary showing the current state, the future state you want, and the gap in between? That way you're not doing all the heavy lifting alone.\""
    },
    {
      type: "brushoff",
      trigger: "\"Just send me an email\" or \"Send me some information\"",
      pattern: "Agree to send → Qualify what matters → Convert to next step",
      script: "AGREE: \"Happy to send something over.\"\n\nQUALIFY: \"To avoid spamming you with irrelevant stuff — what's the one thing you'd need to see in that email to make it worth a 15-minute call next week?\"\n\nIf they can't specify anything: the gap isn't compelling yet. The rep learns the deal isn't real and can decide whether to invest further effort."
    }
  ];

  for (const o of gapObjections) {
    const key = o.type.toUpperCase();
    chunks.push({
      content_type: "script",
      component_name: `GAP_OBJ_${key}`,
      chunk_title: `Gap Objection: ${o.trigger} — Gap-Anchored Reframe`,
      chunk_text: `OBJECTION PATTERN (${o.pattern}):\n\n${o.script}`,
      situation_tags: ["objection", o.type, "gap_reframe"],
      weakness_tags: ["objection_handling", o.type],
      source_file: "gap-objections",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // GAP SELLING CORE VOCABULARY — the language patterns
  // ============================================

  const gapVocabulary: Array<{phrase: string; meaning: string; when_to_use: string}> = [
    {
      phrase: "\"No gap, no sale\"",
      meaning: "If there is no meaningful difference between where the prospect is and where they want to be, there is no rationale or urgency to change. The gap IS the value.",
      when_to_use: "As a self-check before any demo or proposal. If you can't articulate the gap in one sentence, you haven't earned the right to present."
    },
    {
      phrase: "\"Problems, not products\"",
      meaning: "The conversation stays anchored in business problems, not features. The product is the treatment plan, not the topic of conversation.",
      when_to_use: "Every time you feel the urge to show a feature. Ask yourself: 'Have I fully diagnosed the problem this feature solves?' If not, keep diagnosing."
    },
    {
      phrase: "\"Never sell to need\"",
      meaning: "The buyer's expressed need is often a symptom. The real problem is underneath. Diagnose the disease, not the symptom.",
      when_to_use: "When a buyer says 'we need X.' Respond with diagnosis, not demonstration. 'What problem exists because you don't have X?'"
    },
    {
      phrase: "\"Facts before opinions\"",
      meaning: "Current state must be built on objective data — numbers, processes, specific events — not the buyer's interpretations or generalizations.",
      when_to_use: "Every time a buyer gives a vague answer. 'Can you give me a specific example?' 'What did that look like in practice?'"
    },
    {
      phrase: "\"The gap is the value\"",
      meaning: "The quantified difference between current and future states IS the economic and emotional value of the change. Price objections are gap objections in disguise.",
      when_to_use: "When a buyer pushes back on price or timing. Re-anchor to the gap: 'Let's revisit what this gap is costing you.'"
    }
  ];

  for (const v of gapVocabulary) {
    chunks.push({
      content_type: "best_practice",
      component_name: null,
      chunk_title: `Gap Vocabulary: ${v.phrase}`,
      chunk_text: `MEANING:\n${v.meaning}\n\nWHEN TO USE:\n${v.when_to_use}`,
      situation_tags: ["strategy", "language", "coaching"],
      weakness_tags: [],
      source_file: "gap-vocabulary",
      chunk_index: i++,
      methodology: m,
    });
  }

  return chunks;
}

// ============================================
// MEDDPICC
// ============================================

function buildMEDDPICCChunks(): MethodologyChunk[] {
  const m = "meddpicc";
  const chunks: MethodologyChunk[] = [];
  let i = 0;

  // Start with MEDDIC base, then add Paper Process and Competition
  const components: Array<{name: string; desc: string; principles: string}> = [
    {
      name: "Metrics",
      desc: "Quantified business outcomes and success measures. Customer-defined metrics with baseline, target, and measurement plan. Revenue increase, cost reduction, efficiency gains — whatever the customer values.",
      principles: "Customer-defined, not vendor-defined. Baseline + target = gap. If you can't quantify the value, the deal isn't qualified."
    },
    {
      name: "Economic Buyer",
      desc: "The person with budget authority — typically C-suite or VP-level. The rep must verify access and influence. Without EB engagement, the deal is speculation.",
      principles: "Identify by name, not role. Verify they're involved in similar purchases. Build direct or champion-mediated access."
    },
    {
      name: "Decision Criteria",
      desc: "The formal or informal scorecard the customer uses to evaluate options — technical, business, and vendor criteria with known weighting.",
      principles: "Ask explicitly. Know the weighting. Identify where you score highest and lowest. Shape criteria early before they're locked."
    },
    {
      name: "Decision Process",
      desc: "Every step from evaluation to signature — stakeholders, gates, procurement, legal. Full timeline mapped with owner at each stage.",
      principles: "Map end-to-end. Identify every touchpoint. The most common deal-killer: a procurement step nobody mentioned until week 8."
    },
    {
      name: "Paper Process",
      desc: "Legal, procurement, security reviews, and signature logistics. The paperwork pipeline — NDAs, MSAs, security questionnaires, vendor assessments, PO requirements.",
      principles: "Start the paper process early — it's the #1 source of slipped close dates. Ask: 'What paperwork is required before we can transact?' Know who signs, how many signatures, and typical turnaround time."
    },
    {
      name: "Identify Pain",
      desc: "Clear, acknowledged, urgent business pain tied to a metric and timeline. Not interest — pressure. The customer must feel the cost of inaction.",
      principles: "Acknowledged by customer + tied to metric + urgent = qualified pain. Test: 'What happens if you do nothing for six months?'"
    },
    {
      name: "Champion",
      desc: "An internal advocate with influence who actively sells for you. Has power, has stake, has willingness. Sells when you're not in the room.",
      principles: "Power + personal stake + willingness = Champion. Test: 'Would they present our case at an executive meeting without us?'"
    },
    {
      name: "Competition",
      desc: "Named competitors, internal alternatives (build vs. buy), and the status quo — all actively understood. The rep knows who else is in the deal and how to differentiate.",
      principles: "Name every competitor in the deal. Know their strengths and weaknesses relative to you. Don't forget the toughest competitor: 'do nothing.' Map your differentiators against each."
    }
  ];

  for (const c of components) {
    const key = c.name.toUpperCase().replace(/\s+/g, "_");
    chunks.push({
      content_type: "component",
      component_name: key,
      chunk_title: `MEDDPICC — ${c.name}`,
      chunk_text: `${c.desc}\n\nQualification Standards:\n${c.principles}`,
      situation_tags: ["qualification", "enterprise_sales"],
      weakness_tags: [key.toLowerCase()],
      source_file: "meddpicc-methodology",
      chunk_index: i++,
      methodology: m,
    });
  }

  const scripts: Array<{title: string; text: string; situation: string[]; weakness: string[]}> = [
    {
      title: "MEDDPICC — Paper Process Discovery",
      text: "Let's talk about the administrative side. Beyond the business decision, what does the paperwork pipeline look like? NDAs, security reviews, procurement, legal — what's required, who's involved, and what's a realistic timeline for all of that? I want to make sure we don't hit surprises late in the process.",
      situation: ["qualification", "closing"],
      weakness: ["paper_process"]
    },
    {
      title: "MEDDPICC — Competition Mapping",
      text: "I assume you're evaluating a few options — that's healthy. Who else are you talking to? And beyond external vendors, are you also considering building this internally or just sticking with the status quo? Help me understand the full competitive landscape so I don't waste your time on things that aren't relevant to your decision.",
      situation: ["qualification", "competitive"],
      weakness: ["competition"]
    },
    {
      title: "MEDDPICC — Full Qualification Check",
      text: "Let me make sure I have the full picture. Metrics: [X]. Economic Buyer: [Y]. Decision Criteria: [A, B, C]. Decision Process: [steps]. Paper Process: [legal/procurement details]. Pain: [urgency/impact]. Champion: [name/role]. Competition: [competitors + status quo]. What am I missing?",
      situation: ["qualification", "forecast_review"],
      weakness: ["metrics", "economic_buyer", "decision_criteria", "decision_process", "paper_process", "identify_pain", "champion", "competition"]
    }
  ];

  for (const s of scripts) {
    const key = s.weakness[0].toUpperCase();
    chunks.push({
      content_type: "script",
      component_name: key,
      chunk_title: s.title,
      chunk_text: s.text,
      situation_tags: s.situation,
      weakness_tags: s.weakness,
      source_file: "meddpicc-scripts",
      chunk_index: i++,
      methodology: m,
    });
  }

  chunks.push({
    content_type: "best_practice",
    component_name: null,
    chunk_title: "MEDDPICC — The Extended Qualification Standard",
    chunk_text: "MEDDPICC extends MEDDIC with two critical additions: Paper Process (legal, procurement, security — the #1 source of slipped close dates in enterprise deals) and Competition (named competitors, internal alternatives, and the ever-present status quo). The rule is the same: every deal must score across all eight letters before it enters the committed forecast. The two new letters catch what kills enterprise deals: surprises in paperwork and blind spots in the competitive landscape. If you don't know the competition, you're selling blind. If you haven't started the paper process, your close date is fiction.",
    situation_tags: ["qualification", "forecasting", "enterprise_sales"],
    weakness_tags: [],
    source_file: "meddpicc-best-practices",
    chunk_index: i++,
    methodology: m,
  });

  // ============================================
  // MEDDPICC QUALIFICATION FLOW — the deal skeleton sequence
  // Originated at PTC in the 1990s. Each letter is a dimension
  // that must be understood before a deal enters forecast.
  // ============================================

  const meddpiccFlow: Array<{step: number; element: string; rule: string; what_to_do: string; pitfall: string; script: string}> = [
    {
      step: 1,
      element: "Metrics",
      rule: "Quantify the impact before you quantify the solution. Move from vague to specific.",
      what_to_do: "Uncover the 2-3 metrics leadership watches. Get baselines and targets. 'Where are you today vs. where you'd like to be?' Push for numbers — even rough ones. A 10-20% improvement on a known metric is more compelling than 'better visibility.' Connect every metric to a business outcome: revenue, cost, risk, or time.",
      pitfall: "Accepting 'better pipeline visibility' as a metric. Better how? Measured by what? If the rep can't state the metric in the customer's own numbers, they haven't qualified it.",
      script: "'What are the top 2-3 metrics your leadership is watching this quarter? If this works, what numbers would need to move for you to call it a win? Roughly, what would a 10-20% change in that metric mean in terms of revenue or cost?'"
    },
    {
      step: 2,
      element: "Economic Buyer",
      rule: "Know who signs the check. No economic buyer = no deal, regardless of champion enthusiasm.",
      what_to_do: "Identify the person with final budget authority — usually a VP, C-level, or BU leader. Get their name, role, and priorities. Plan access: either direct meeting or via champion. 'Who ultimately owns the budget for this? Whose priority list does this need to appear on?' If you haven't met them, the deal isn't real yet.",
      pitfall: "Assuming the champion has budget authority. Champions influence; economic buyers decide. Deals die when the champion can't get budget because the economic buyer was never engaged.",
      script: "'In other organizations, the [VP Sales / CRO] tends to be measured on these metrics. Is that true here? Would it make sense to include them in one of our upcoming conversations so we're aligned from the start?'"
    },
    {
      step: 3,
      element: "Decision Criteria",
      rule: "Know how you'll be judged. Explicit criteria beat implicit assumptions every time.",
      what_to_do: "Document the 3-5 things they'll evaluate vendors on. Ask: 'What would disqualify a solution?' 'Beyond features, what matters most — ease of rollout, ROI, user adoption?' Get weighting — not all criteria are equal. Then shape criteria to favor your strengths: 'Based on what you've shared, may I suggest adding [your differentiation]?'",
      pitfall: "Hearing only 'price and features' as criteria. That's surface-level. Dig for what's underneath: risk tolerance, change management, executive buy-in, time to value. The hidden criteria are where deals are won or lost.",
      script: "'Let's document your decision criteria together. What are the top 3-5 things you'll evaluate? What would disqualify a solution? How will you weigh price versus impact on your key metrics?'"
    },
    {
      step: 4,
      element: "Decision Process",
      rule: "Map the real buying path, not the idealized one. Surprises kill deals.",
      what_to_do: "Walk through how decisions actually get made. 'Walk me through how decisions like this usually happen here.' Get specific: stakeholders, milestones, approvals, timelines. Co-create a mutual action plan so both sides know what happens next. Ask: 'When you've bought similar tools, what slowed things down or created surprises?'",
      pitfall: "Accepting 'we'll review and get back to you' as a decision process. That's a black box. Without knowing who reviews, what they care about, and when they decide, the rep is hoping, not selling.",
      script: "'To keep things moving smoothly, let's map this out. What are the key milestones between now and a signed agreement? Who needs to be involved at each stage? When you've bought similar tools before, what created surprises or delays?'"
    },
    {
      step: 5,
      element: "Identify Pain",
      rule: "Pain is the fuel. Surface-level dissatisfaction isn't enough — implicate fully.",
      what_to_do: "Go beyond 'we have a problem with X.' Explore consequences: operational, financial, personal. 'What happens if you don't solve this in 6-12 months?' 'Who feels this most day-to-day?' 'How does this show up in your numbers?' Quantify the cost of doing nothing. The pain must be acute enough to justify the effort of change.",
      pitfall: "Stopping at the first pain statement. 'Our ramp time is too long' is a symptom. 'Our 9-month ramp is costing us roughly $150K per rep in lost productivity, and our VP is getting pressure from the board on headcount efficiency' — that's implicated pain.",
      script: "'It sounds like this isn't just about [surface issue]. What happens if you don't solve this in the next 6-12 months? How does this show up in your numbers or your team's workload? Let's quantify the cost of doing nothing so you can decide if it's really worth changing.'"
    },
    {
      step: 6,
      element: "Champion",
      rule: "A real champion has power, influence, and credibility — and sells for you when you're not there.",
      what_to_do: "Identify someone with access to the economic buyer and credibility within the organization. Test them: 'Would you be comfortable bringing your VP into a working session?' Equip them with the story, ROI narrative, and materials to sell internally. 'You'll be the one telling this story. Let's make sure it lands.' A friendly contact is not a champion.",
      pitfall: "Confusing a coach (friendly, shares information) with a champion (has influence, takes action, sells internally). A coach tells you what's happening. A champion makes things happen.",
      script: "'Who else is excited about solving this internally? When you talk about this with leadership, what resonates most? Would you be open to sharing the business case internally and getting feedback we can discuss together?'"
    },
    {
      step: 7,
      element: "Competition",
      rule: "The status quo is your biggest competitor. Know all alternatives — including 'do nothing.'",
      what_to_do: "Identify every force competing for budget and attention: direct vendors, internal builds, status quo, alternative projects. 'What other options are you considering?' 'If you didn't move forward with anyone, what would you do instead?' Understand what they like and dislike about each option. Build your differentiation strategy around their criteria.",
      pitfall: "Never asking about competition and getting surprised at the end. Or worse: only tracking direct competitors and missing that 'do nothing' is winning. The status quo kills more deals than any competitor.",
      script: "'I know you're likely looking at alternatives — it helps me tailor this if I understand where we sit. What other options are you considering? If you didn't move forward with anyone, what would you do instead? What do you like most about your current approach?'"
    },
    {
      step: 8,
      element: "Paper Process",
      rule: "Start legal and procurement early. A verbal yes means nothing until the paper is signed.",
      what_to_do: "Map the administrative path from verbal yes to signed contract. 'Once you decide to move forward, what does the paperwork process look like?' Identify: procurement review, legal, security assessment, vendor setup. Get realistic timelines. Loop in procurement early: 'We've seen deals stall for weeks in legal. Can we involve them now so we don't lose momentum?'",
      pitfall: "Waiting until the end to discuss paper process. Deals that are 'stuck in procurement' were never really closed. The paper process is the #1 source of slipped close dates in enterprise deals.",
      script: "'Once you decide to move forward, what does the paperwork process look like? Which teams review — procurement, legal, security? What's a realistic timeline from verbal yes to signed agreement? Are there standard terms we should anticipate now?'"
    }
  ];

  for (const step of meddpiccFlow) {
    const key = step.element.toUpperCase().replace(/\s+/g, "_");
    chunks.push({
      content_type: "process",
      component_name: key,
      chunk_title: `MEDDPICC Step ${step.step}: ${step.element} — ${step.rule}`,
      chunk_text: `WHAT TO DO:\n${step.what_to_do}\n\nMICRO-SCRIPT:\n${step.script}\n\nWHAT TO AVOID:\n${step.pitfall}`,
      situation_tags: ["qualification", "process", "deal_review"],
      weakness_tags: ["process_flow", key.toLowerCase()],
      source_file: "meddpicc-qualification-flow",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // MEDDPICC ANTI-PATTERNS
  // ============================================

  const meddpiccPitfalls: Array<{component: string; pattern: string; why_it_fails: string; fix: string}> = [
    {
      component: "METRICS",
      pattern: "Accepting vague outcomes like 'better visibility' or 'improved efficiency' without numbers.",
      why_it_fails: "Without specific metrics, there's no way to prove value post-sale. 'Better pipeline visibility' can't be measured. 'Win rate up from 22% to 30%' — that's a metric you can prove you delivered. Vague outcomes also make ROI impossible to calculate, which kills deals at the economic buyer level.",
      fix: "Push for baselines: 'Where are you today?' Then targets: 'Where would you need to be to call this a win?' Even rough estimates create accountability. A deal without quantified metrics isn't qualified."
    },
    {
      component: "ECONOMIC_BUYER",
      pattern: "Assuming the champion has budget authority or that 'they'll get us to the right person.'",
      why_it_fails: "Champions influence. Economic buyers decide. Deals die when the champion presents to the EB without the rep present — the EB asks questions the champion can't answer, and the deal stalls. The rep must connect with the EB directly or risk being a secondhand story.",
      fix: "Ask directly: 'Who ultimately signs off on budget for this?' Get a name and title. If the champion deflects, ask: 'When similar projects were approved, who had final sign-off?' Plan EB access before the deal advances."
    },
    {
      component: "DECISION_CRITERIA",
      pattern: "Only discussing explicit criteria (price, features) and ignoring implicit criteria (risk, politics, change management).",
      why_it_fails: "Explicit criteria get you in the evaluation. Implicit criteria determine who wins. The buyer may say 'features and price' but what they really care about is 'will my team adopt this' or 'will I look good to my board.' Missing implicit criteria means losing to a competitor who addressed them.",
      fix: "After documenting explicit criteria, ask: 'Beyond features and price, what's going to matter most when you actually implement this?' 'What would make your leadership team nervous about this decision?'"
    },
    {
      component: "DECISION_PROCESS",
      pattern: "Accepting 'we'll review internally' as a process without mapping the actual steps, stakeholders, and timeline.",
      why_it_fails: "'We'll review internally' is a black box. Deals disappear into it. Without knowing who reviews, what they care about, and when they decide, the rep can't influence the process. They're hoping, not managing.",
      fix: "Co-create a mutual action plan. 'Let's map this together: who needs to see what, in what order, and by when?' Document it. Send it. Reference it in every follow-up. A documented process with mutual accountability beats a black box every time."
    },
    {
      component: "IDENTIFY_PAIN",
      pattern: "Stopping at the first pain statement without implicating — exploring the full consequences.",
      why_it_fails: "'Our ramp time is too long' is a symptom, not implicated pain. Without exploring consequences (financial, operational, personal), the pain isn't acute enough to justify change. The buyer stays in 'nice to fix' mode instead of 'must fix.'",
      fix: "For every pain, ask: 'What does that cost you?' 'Who else is impacted?' 'If this doesn't change in 12 months, what happens?' One well-placed implication question turns a symptom into a compelling reason to act."
    },
    {
      component: "CHAMPION",
      pattern: "Confusing a friendly contact who shares information with a real champion who has influence and sells internally.",
      why_it_fails: "A coach tells you who the players are. A champion moves the ball forward when you're not in the room. Deals stall when the rep thinks they have a champion but actually just have someone who's nice to them on calls.",
      fix: "Test your champion: 'Would you be comfortable presenting our business case to your VP?' 'What pushback do you expect from your colleagues?' A real champion takes action. If they won't, they're a coach — useful but insufficient."
    },
    {
      component: "COMPETITION",
      pattern: "Only tracking direct competitors and missing 'do nothing' as the primary alternative.",
      why_it_fails: "The status quo kills more enterprise deals than any vendor. 'Do nothing' is always competing. If the rep doesn't address why change is better than staying the same, they're losing to an invisible competitor that needs no justification.",
      fix: "Always ask: 'If you didn't move forward with anyone, what would you do instead?' Also: 'What else is competing for this budget internally?' Map all alternatives, not just named vendors."
    },
    {
      component: "PAPER_PROCESS",
      pattern: "Waiting until verbal commitment to discuss legal, procurement, and security review.",
      why_it_fails: "Enterprise deals don't close at 'yes' — they close when the paper is signed. Procurement, legal, and security reviews can add 4-8 weeks. Deals that are 'stuck in procurement' at end of quarter were never properly qualified.",
      fix: "Ask about paper process early: 'Once you decide to move forward, what does the contracting process look like?' Loop in procurement before you need them. Start security questionnaires early. The close date should include paper process time."
    }
  ];

  for (const p of meddpiccPitfalls) {
    chunks.push({
      content_type: "pitfall",
      component_name: p.component,
      chunk_title: `MEDDPICC Anti-Pattern: ${p.pattern}`,
      chunk_text: `WHAT GOES WRONG:\n${p.pattern}\n\nWHY IT FAILS:\n${p.why_it_fails}\n\nHOW TO FIX IT:\n${p.fix}`,
      situation_tags: ["troubleshooting", "coaching", "deal_review"],
      weakness_tags: [p.component.toLowerCase()],
      source_file: "meddpicc-pitfalls",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // MEDDPICC OBJECTION HANDLING — objections signal MEDDIC gaps
  // ============================================

  const meddpiccObjections: Array<{type: string; trigger: string; gap: string; script: string}> = [
    {
      type: "price",
      trigger: "\"It's too expensive\" or \"We don't have budget\"",
      gap: "Likely weak Metrics (unclear ROI), insufficient Pain, or Economic Buyer not aligned.",
      script: "CLARIFY: \"I hear you. When you say too high, what are you comparing it to? Is it the total investment, how it hits this year's budget, or how it compares to alternatives?\"\n\nREVISIT METRICS: \"Earlier you mentioned [problem] is costing roughly [impact] per quarter. If we could realistically reduce that by even 20-30%, how would that change the math?\"\n\nECONOMIC BUYER: \"Who typically has flexibility to reallocate funds when something important comes up? Would it be worth reviewing this together?\""
    },
    {
      type: "timing",
      trigger: "\"Not a priority right now\" or \"Reach out next quarter\"",
      gap: "Likely Pain not fully implicated or Competition from other internal initiatives.",
      script: "EMPATHIZE: \"That makes sense — most teams have more initiatives than bandwidth. What's taking priority right now?\"\n\nCOST OF INACTION: \"If this stays as-is for another 6-12 months, what does that mean for your targets?\"\n\nREFRAME: \"Many teams felt similarly until they realized waiting meant [risk: missed targets, higher costs]. If we penciled in a checkpoint for [month/quarter], would that be reasonable?\""
    },
    {
      type: "incumbent",
      trigger: "\"We already have a solution\" or \"We're happy with our current vendor\"",
      gap: "Likely Competition not well understood or Decision Criteria not differentiated.",
      script: "RESPECT: \"Totally fair — many of our customers weren't actively looking when we first spoke. What do you like most about your current approach?\"\n\nSURFACE GAPS: \"If you could change one thing about it, what would that be? How does it stack up against where you want [metric] to be in 12-18 months?\"\n\nLOW-FRICTION NEXT STEP: \"Teams often outgrow tools that were a great fit a few years ago. Would it be worth a quick comparison so you have it in your back pocket?\""
    },
    {
      type: "think_about_it",
      trigger: "\"We need to think about it\" or \"Send me something\"",
      gap: "Likely unclear Decision Criteria/Process or Champion not equipped to sell internally.",
      script: "NORMALIZE: \"Of course — this is an important decision. So I send something useful, what will you and your team be weighing as you think this over?\"\n\nMAP PROCESS: \"Who else will you be discussing this with, and what will they care about most?\"\n\nCO-CREATE: \"How about I send a brief summary and we schedule 20 minutes to address questions once you've discussed internally?\""
    }
  ];

  for (const o of meddpiccObjections) {
    const key = o.type.toUpperCase();
    chunks.push({
      content_type: "script",
      component_name: `MEDDPICC_OBJ_${key}`,
      chunk_title: `MEDDPICC Objection: ${o.trigger} — ${o.gap}`,
      chunk_text: `UNDERLYING GAP: ${o.gap}\n\nRESPONSE PATTERN:\n${o.script}`,
      situation_tags: ["objection", o.type, "meddpicc_gap"],
      weakness_tags: ["objection_handling", o.type],
      source_file: "meddpicc-objections",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // MEDDPICC DEAL SCORING — the 0-3 scale per letter
  // ============================================

  const meddpiccScoring: Array<{element: string; scale: string}> = [
    {
      element: "Metrics",
      scale: "0 = Unknown — no metrics discussed. 1 = Emerging — vague outcomes mentioned. 2 = Solid — specific metrics with baselines identified. 3 = Strong — quantified metrics with targets, buyer confirms they're the right measures."
    },
    {
      element: "Economic Buyer",
      scale: "0 = Unknown — no idea who controls budget. 1 = Emerging — role identified but no access plan. 2 = Solid — name and title known, access planned. 3 = Strong — EB met, aligned on metrics and pain, supports the initiative."
    },
    {
      element: "Decision Criteria",
      scale: "0 = Unknown — criteria not discussed. 1 = Emerging — surface criteria mentioned (price, features). 2 = Solid — explicit and implicit criteria documented with weighting. 3 = Strong — criteria shaped to favor your strengths, buyer confirms alignment."
    },
    {
      element: "Decision Process",
      scale: "0 = Unknown — no process discussed. 1 = Emerging — buyer described process verbally. 2 = Solid — documented mutual action plan with milestones. 3 = Strong — plan actively tracked, all stakeholders identified, timeline confirmed."
    },
    {
      element: "Paper Process",
      scale: "0 = Unknown — legal/procurement never mentioned. 1 = Emerging — aware procurement exists but no details. 2 = Solid — timeline and teams identified, security review started. 3 = Strong — procurement engaged, terms aligned, timeline integrated into close date."
    },
    {
      element: "Implicate Pain",
      scale: "0 = Unknown — pain not discussed. 1 = Emerging — surface problem mentioned. 2 = Solid — consequences explored, cost of inaction quantified. 3 = Strong — pain is acute, linked to metrics, buyer acknowledges urgency to change."
    },
    {
      element: "Champion",
      scale: "0 = Unknown — no internal supporter identified. 1 = Emerging — friendly contact but influence unproven. 2 = Solid — champion has access to EB, actively selling internally. 3 = Strong — champion equipped with business case, driving internal momentum with evidence."
    },
    {
      element: "Competition",
      scale: "0 = Unknown — alternatives never discussed. 1 = Emerging — aware of named competitors. 2 = Solid — all alternatives mapped including status quo, differentiation strategy defined. 3 = Strong — competitive position validated with buyer, status quo addressed, 'do nothing' risk quantified."
    }
  ];

  for (const s of meddpiccScoring) {
    const key = s.element.toUpperCase().replace(/\s+/g, "_");
    chunks.push({
      content_type: "best_practice",
      component_name: key,
      chunk_title: `MEDDPICC Scorecard: ${s.element} — 0-3 Qualification Scale`,
      chunk_text: s.scale,
      situation_tags: ["qualification", "forecasting", "deal_review", "scoring"],
      weakness_tags: [key.toLowerCase(), "qualification"],
      source_file: "meddpicc-scoring",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // MEDDPICC 32 QUESTIONS MASTER LIST
  // From the MEDDICC Deployment Manual. Proven scripts for each pillar.
  // ============================================

  const meddpiccQuestions: Array<{element: string; purpose: string; questions: string[]}> = [
    {
      element: "Metrics",
      purpose: "Connect the solution to board-level priorities. Quantify ROI.",
      questions: [
        "\"What KPIs is your executive team tracking that this initiative could impact?\"",
        "\"If we're successful, what numbers change in your quarterly business review?\"",
        "\"What's the cost of not solving this problem monthly in lost revenue or wasted time?\"",
        "\"Of all your performance indicators, which one is taking the biggest hit right now?\""
      ]
    },
    {
      element: "Economic Buyer",
      purpose: "Identify the true veto power and financial ownership.",
      questions: [
        "\"Who ultimately owns the budget for this initiative?\"",
        "\"If everyone says yes but one person says no, whose no matters most?\"",
        "\"When it comes to [Business Area], who is the go-to person your team looks to for direction?\"",
        "\"Are you sponsoring this project personally, or is there another executive stakeholder involved?\""
      ]
    },
    {
      element: "Decision Criteria",
      purpose: "Surface deal-killing requirements early and influence them.",
      questions: [
        "\"What are your top 3 must-have capabilities?\"",
        "\"How will you evaluate and score different vendors? What is the methodology?\"",
        "\"What are the non-negotiables? What would immediately disqualify a vendor?\"",
        "\"Is there room for input on the evaluation criteria based on what we've learned from similar implementations?\""
      ]
    },
    {
      element: "Decision Process",
      purpose: "Separate activity from progression. Map the real path to yes.",
      questions: [
        "\"Walk me through every step from here to a signed agreement.\"",
        "\"Thinking about your last major software purchase, what worked and what caused delays?\"",
        "\"Who are all the people who need to give their approval for this to move forward?\"",
        "\"Once you have internal alignment, what is the typical timeline to get contracts executed?\""
      ]
    },
    {
      element: "Paper Process",
      purpose: "Prevent end-of-quarter slips by identifying procurement bottlenecks.",
      questions: [
        "\"What areas does your legal team typically focus on during negotiations?\"",
        "\"What is the typical procurement timeline from final approval to a PO being issued?\"",
        "\"Are there security assessments, audits, or compliance reviews we should plan for now?\"",
        "\"Who is the specific point of contact in procurement we will be working with?\""
      ]
    },
    {
      element: "Identify Pain",
      purpose: "Create urgency using the 3 Whys. Move beyond symptoms to financial impact.",
      questions: [
        "\"Walk me through your current process — where are the biggest bottlenecks slowing you down?\"",
        "\"Of all the people affected by this challenge, who is feeling the impact most acutely?\"",
        "\"If this problem continues for another 12 months, what is the worst-case scenario for the business?\"",
        "\"What have you tried to do about this in the past, and why did it fail to solve the core issue?\""
      ]
    },
    {
      element: "Champion",
      purpose: "Confirm the advocate has real juice — not just a friendly coach.",
      questions: [
        "\"Thinking about your team, who is most excited about the potential of solving this?\"",
        "\"Would you be comfortable introducing me to [EB Name] so I can understand their specific perspective?\"",
        "\"What steps have you taken internally so far to build support for this initiative?\"",
        "\"Every change has skeptics. Who might resist this, and how can we address their concerns together?\""
      ]
    },
    {
      element: "Competition",
      purpose: "Uncover internal projects and the ever-present status quo.",
      questions: [
        "\"To ensure I understand the landscape, who else are you looking at for this solution?\"",
        "\"If none of the vendors you're evaluating work out, what is Plan B?\"",
        "\"What is working well with your current approach that you would want to preserve?\"",
        "\"Besides us, who else are you having active conversations with about solving this?\""
      ]
    }
  ];

  for (const q of meddpiccQuestions) {
    const key = q.element.toUpperCase().replace(/\s+/g, "_");
    chunks.push({
      content_type: "script",
      component_name: key,
      chunk_title: `MEDDPICC Discovery Questions: ${q.element} — ${q.purpose}`,
      chunk_text: `PURPOSE: ${q.purpose}\n\n${q.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
      situation_tags: ["discovery", "qualification", key.toLowerCase()],
      weakness_tags: [key.toLowerCase(), "discovery_questions"],
      source_file: "meddpicc-32-questions",
      chunk_index: i++,
      methodology: m,
    });
  }

  // ============================================
  // MEDDPICC ZERO-TOLERANCE MANDATES
  // ============================================

  const meddpiccMandates: Array<{rule: string; explanation: string}> = [
    {
      rule: "No Name = No Champion",
      explanation: "If you can't name the person and describe their influence, you don't have a champion. A friendly contact who shares information but has no power is a coach, not a champion. 'A champion is not the person who does the most talking — it's the person who, when they speak, everyone else goes silent.'"
    },
    {
      rule: "No ROI = No Metrics",
      explanation: "If the prospect hasn't agreed to the dollar value of the problem, the deal is a hobby, not a project. Metrics must be prospect-confirmed, not rep-assumed. 'Better visibility' is not a metric. 'Win rate up from 22% to 30%' is."
    },
    {
      rule: "No Access = No Economic Buyer",
      explanation: "If we haven't met the person who signs the check, the forecast date is a guess. The EB must be met, not just identified. Deals where the champion 'will handle the EB' die quietly when the champion can't answer the EB's questions."
    },
    {
      rule: "No Map = No Paper Process",
      explanation: "If the legal, security, and procurement steps aren't documented, the deal will slip. Paper Process is the #1 source of slipped close dates in enterprise. A verbal yes with no paper process mapped is a hope, not a deal."
    }
  ];

  for (const m of meddpiccMandates) {
    chunks.push({
      content_type: "best_practice",
      component_name: null,
      chunk_title: `MEDDPICC Mandate: ${m.rule}`,
      chunk_text: m.explanation,
      situation_tags: ["leadership", "pipeline_review", "forecasting"],
      weakness_tags: ["qualification", "evidence_standard"],
      source_file: "meddpicc-mandates",
      chunk_index: i++,
      methodology: m,
    });
  }

  return chunks;
}
