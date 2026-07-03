export interface MethodologyComponent {
  key: string;
  name: string;
  description: string;
  strongSignals: string[];
  weakSignals: string[];
}

export interface MethodologyConfig {
  id: string;
  label: string;
  expertRole: string;
  coachingPrinciples: string;
  components: MethodologyComponent[];
}

export const METHODOLOGY_CONFIGS: Record<string, MethodologyConfig> = {
  sandler: {
    id: "sandler",
    label: "Sandler",
    expertRole: "Sandler Selling System expert coach",
    coachingPrinciples:
      "Score for equal business stature, upfront contracts, pain discovery, budget and decision clarity, fulfillment tied to pain, post-sell, and no free consulting.",
    components: [
      {
        key: "bonding_rapport",
        name: "Bonding & Rapport",
        description: "Genuine connection and trust before the business discussion.",
        strongSignals: ["common ground", "curiosity", "trust", "rapport", "honest"],
        weakSignals: ["jumped straight to business", "guarded", "awkward", "canned"],
      },
      {
        key: "upfront_contract",
        name: "Upfront Contract",
        description: "Clear time, agenda, mutual expectations, and possible outcomes.",
        strongSignals: ["agenda", "time", "next steps", "sound fair", "does that work"],
        weakSignals: ["no agenda", "unclear next step", "surprised by questions"],
      },
      {
        key: "pain_funnel",
        name: "Pain Funnel",
        description: "Surface pain is developed into business and emotional impact.",
        strongSignals: ["tell me more", "impact", "costing", "frustrating", "what else", "why"],
        weakSignals: ["surface level", "jumped to solution", "did not quantify"],
      },
      {
        key: "budget_step",
        name: "Budget Step",
        description: "Money, investment, affordability, and ROI are discussed before solutioning.",
        strongSignals: ["budget", "investment", "cost", "roi", "worth", "price"],
        weakSignals: ["avoided money", "pricing only at end", "no budget"],
      },
      {
        key: "decision_step",
        name: "Decision Step",
        description: "Decision process, stakeholders, criteria, and timeline are mapped.",
        strongSignals: ["decision", "stakeholder", "criteria", "timeline", "who else", "approval"],
        weakSignals: ["assumed authority", "no stakeholder map", "no timeline"],
      },
      {
        key: "fulfillment",
        name: "Fulfillment",
        description: "Solution is presented only against confirmed pain and fit.",
        strongSignals: ["based on what you said", "relevant", "solve", "address", "fit"],
        weakSignals: ["feature dump", "generic demo", "oversold"],
      },
      {
        key: "post_sell",
        name: "Post-Sell",
        description: "Buyer's remorse is prevented and next steps are concrete.",
        strongSignals: ["next step", "confirm", "concern", "follow up", "date"],
        weakSignals: ["vague next steps", "no commitment", "rushed close"],
      },
      {
        key: "no_free_consulting",
        name: "No Free Consulting",
        description: "Expertise is protected and detailed solving is reserved for commitment.",
        strongSignals: ["next step", "scope", "proposal", "commitment", "fit"],
        weakSignals: ["gave away solution", "free consulting", "picked your brain"],
      },
    ],
  },
  challenger: {
    id: "challenger",
    label: "Challenger",
    expertRole: "Challenger Sale expert coach",
    coachingPrinciples:
      "Score for teaching with commercial insight, reframing assumptions, tailoring to stakeholders, constructive tension, and taking control of the buying process.",
    components: [
      {
        key: "commercial_insight",
        name: "Commercial Insight",
        description: "The rep teaches a non-obvious business insight tied to customer value.",
        strongSignals: ["insight", "research", "data", "trend", "what we see", "benchmark"],
        weakSignals: ["generic pitch", "no insight", "feature-led"],
      },
      {
        key: "reframe",
        name: "Reframe",
        description: "The rep challenges the customer's current view of the problem.",
        strongSignals: ["different way", "what if", "assumption", "root cause", "reframe"],
        weakSignals: ["accepted premise", "order taker", "no challenge"],
      },
      {
        key: "rational_drowning",
        name: "Rational Drowning",
        description: "The rep builds urgency by showing the cost of staying the same.",
        strongSignals: ["cost", "risk", "impact", "missed", "status quo", "delay"],
        weakSignals: ["no urgency", "soft impact", "no consequence"],
      },
      {
        key: "emotional_impact",
        name: "Emotional Impact",
        description: "The rep connects the insight to personal or organizational pressure.",
        strongSignals: ["frustrating", "pressure", "stress", "visibility", "board", "team"],
        weakSignals: ["purely technical", "no personal stake", "flat"],
      },
      {
        key: "tailoring",
        name: "Tailoring",
        description: "Message is adapted to stakeholder role, priorities, and language.",
        strongSignals: ["cfo", "ceo", "vp", "team", "priority", "for your role"],
        weakSignals: ["same message", "no stakeholder lens", "generic"],
      },
      {
        key: "constructive_control",
        name: "Constructive Control",
        description: "The rep confidently guides next steps and handles pushback without becoming pushy.",
        strongSignals: ["recommend", "next step", "let's", "timeline", "push back"],
        weakSignals: ["deferred", "lost control", "maybe", "send information"],
      },
    ],
  },
  spin: {
    id: "spin",
    label: "SPIN Selling",
    expertRole: "SPIN Selling expert coach",
    coachingPrinciples:
      "Score for the quality and sequence of Situation, Problem, Implication, and Need-Payoff questions. The buyer should discover explicit need before the rep presents.",
    components: [
      {
        key: "situation_questions",
        name: "Situation Questions",
        description: "The rep gathers necessary context without over-interrogating.",
        strongSignals: ["current process", "how do you", "what are you using", "how many", "today"],
        weakSignals: ["too many basics", "no context", "assumed context"],
      },
      {
        key: "problem_questions",
        name: "Problem Questions",
        description: "The rep uncovers dissatisfaction, difficulty, or gaps.",
        strongSignals: ["challenge", "problem", "difficulty", "frustration", "what is not working"],
        weakSignals: ["no problem", "surface only", "feature-led"],
      },
      {
        key: "implication_questions",
        name: "Implication Questions",
        description: "The rep expands consequences so the problem becomes urgent.",
        strongSignals: ["impact", "cost", "what happens", "affect", "consequence", "if this continues"],
        weakSignals: ["no consequence", "small pain", "no urgency"],
      },
      {
        key: "need_payoff_questions",
        name: "Need-Payoff Questions",
        description: "The rep helps the buyer articulate value in their own words.",
        strongSignals: ["would it help", "what would it mean", "benefit", "value", "how would that change"],
        weakSignals: ["rep stated value", "no buyer-owned value", "premature pitch"],
      },
      {
        key: "question_sequence",
        name: "Question Sequence",
        description: "Questions progress from context to problem to implication to payoff.",
        strongSignals: ["context", "problem", "impact", "value", "before we show"],
        weakSignals: ["jumped to demo", "out of order", "presented too early"],
      },
      {
        key: "explicit_need",
        name: "Explicit Need",
        description: "The buyer clearly states a desire for capability, change, or solution.",
        strongSignals: ["we need", "we want", "it would help", "we have to", "that would solve"],
        weakSignals: ["implied need only", "no commitment", "weak desire"],
      },
    ],
  },
  gap: {
    id: "gap",
    label: "Gap Selling",
    expertRole: "Gap Selling expert coach",
    coachingPrinciples:
      "Score for diagnosing Current State, Future State, root cause, impact, gap value, and whether the rep avoids prescribing before diagnosis.",
    components: [
      {
        key: "current_state",
        name: "Current State",
        description: "The rep clearly diagnoses the customer's present reality.",
        strongSignals: ["today", "current", "right now", "process", "problem"],
        weakSignals: ["unclear current state", "assumed", "vague"],
      },
      {
        key: "future_state",
        name: "Future State",
        description: "The rep defines what better looks like in the buyer's terms.",
        strongSignals: ["future", "ideal", "better", "goal", "where you want"],
        weakSignals: ["no future state", "vendor-defined outcome", "unclear goal"],
      },
      {
        key: "root_cause",
        name: "Root Cause",
        description: "The rep investigates why the problem exists, not just symptoms.",
        strongSignals: ["why", "cause", "what drives", "source", "underneath"],
        weakSignals: ["symptom only", "no root cause", "assumed cause"],
      },
      {
        key: "business_impact",
        name: "Business Impact",
        description: "The rep quantifies operational, financial, or strategic impact.",
        strongSignals: ["cost", "lost", "time", "revenue", "risk", "impact"],
        weakSignals: ["no impact", "not quantified", "soft pain"],
      },
      {
        key: "gap_value",
        name: "Gap Value",
        description: "The rep connects the size of the gap to business value.",
        strongSignals: ["gap", "difference", "value", "worth", "delta", "from-to"],
        weakSignals: ["no gap value", "feature value", "unquantified"],
      },
      {
        key: "diagnose_before_prescribe",
        name: "Diagnose Before Prescribe",
        description: "The rep resists pitching until the diagnosis is complete.",
        strongSignals: ["before I recommend", "understand first", "diagnose", "tell me more"],
        weakSignals: ["pitched early", "solution before diagnosis", "prescribed"],
      },
    ],
  },
  meddpicc: {
    id: "meddpicc",
    label: "MEDDPICC",
    expertRole: "MEDDPICC enterprise sales coach",
    coachingPrinciples:
      "Score the full deal qualification evidence for Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, and Competition.",
    components: [
      { key: "metrics", name: "Metrics", description: "Quantified business outcomes and success measures.", strongSignals: ["metric", "roi", "increase", "reduce", "percent", "revenue", "cost"], weakSignals: ["no metric", "soft value", "unquantified"] },
      { key: "economic_buyer", name: "Economic Buyer", description: "Access to the person with budget authority.", strongSignals: ["economic buyer", "budget owner", "cfo", "ceo", "sign off", "approve"], weakSignals: ["no EB", "blocked", "unknown buyer"] },
      { key: "decision_criteria", name: "Decision Criteria", description: "Known technical, business, and vendor selection criteria.", strongSignals: ["criteria", "requirements", "must have", "evaluate", "scorecard"], weakSignals: ["unknown criteria", "not ranked", "vague fit"] },
      { key: "decision_process", name: "Decision Process", description: "Known steps, stakeholders, and timeline for approval.", strongSignals: ["process", "timeline", "steps", "committee", "approval", "procurement"], weakSignals: ["unknown process", "no timeline", "single-threaded"] },
      { key: "paper_process", name: "Paper Process", description: "Legal, procurement, security, and signature process are mapped.", strongSignals: ["legal", "procurement", "security", "msa", "paper", "signature"], weakSignals: ["paper unknown", "legal surprise", "procurement risk"] },
      { key: "identify_pain", name: "Identify Pain", description: "Clear business pain with urgency and consequence.", strongSignals: ["pain", "problem", "impact", "urgent", "risk", "cost"], weakSignals: ["weak pain", "nice to have", "no urgency"] },
      { key: "champion", name: "Champion", description: "A person with influence who sells for you internally.", strongSignals: ["champion", "advocate", "sponsor", "will introduce", "sell internally"], weakSignals: ["coach only", "no power", "no internal seller"] },
      { key: "competition", name: "Competition", description: "Named competitors, internal alternatives, and status quo are understood.", strongSignals: ["competitor", "alternative", "status quo", "build internally", "do nothing"], weakSignals: ["unknown competition", "ignored status quo", "no differentiation"] },
    ],
  },
};

export function getMethodologyConfig(methodology: string | null | undefined): MethodologyConfig {
  const normalized = methodology?.trim().toLowerCase() || "sandler";
  return METHODOLOGY_CONFIGS[normalized] || METHODOLOGY_CONFIGS.sandler;
}

export function buildMethodologySystemPrompt(
  config: MethodologyConfig,
  lensInstruction: string,
  escalationInstruction: string,
  priorContext: string,
): string {
  const componentLines = config.components
    .map((component, index) =>
      `${index + 1}. ${component.name} (${component.key}) - ${component.description}`
    )
    .join("\n");

  const scoreShape = config.components
    .map((component) =>
      `    "${component.key}": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" }`
    )
    .join(",\n");

  return `You are a ${config.expertRole}. Analyze sales call transcripts and score them against ${config.label}.

Methodology principles:
${config.coachingPrinciples}

Score each component 1-10 where:
- 1-3: Component was absent or poorly executed
- 4-6: Partially present, needs significant improvement
- 7-8: Solid execution with minor gaps
- 9-10: Masterful execution

Components to score:
${componentLines}

Return JSON with this exact structure:
{
  "scores": {
${scoreShape}
  },
  "done_well": ["specific thing with evidence", ...],
  "missing": ["specific step skipped with consequence", ...],
  "weak": ["attempted but poorly executed with why", ...],
  "suggestions": ["specific, actionable coaching point", ...],
  "scripts": ["exact words to say in a specific situation", ...],
  "commitments": ["specific action item as imperative sentence", ...]
}

Also extract 2-4 specific, concrete ACTION ITEMS the rep should complete before their next call. Each must be something they can DO, not a mindset shift.

Be direct. No platitudes. Every suggestion must be specific enough to use on the next call.${lensInstruction}${escalationInstruction}${priorContext}`;
}

/**
 * Build a RAG-enhanced system prompt by injecting accumulated coaching knowledge
 * into the prompt BEFORE GPT-4 analyzes the call. The RAG becomes the lens through
 * which the AI evaluates the transcript — not an appendix added after.
 */
export function buildRAGEnhancedSystemPrompt(
  config: MethodologyConfig,
  lensInstruction: string,
  escalationInstruction: string,
  priorContext: string,
  ragKnowledge: string,
): string {
  const componentLines = config.components
    .map((component, index) =>
      `${index + 1}. ${component.name} (${component.key}) - ${component.description}`
    )
    .join("\n");

  const scoreShape = config.components
    .map((component) =>
      `    "${component.key}": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" }`
    )
    .join(",\n");

  return `You are a ${config.expertRole}. Analyze sales call transcripts and score them against ${config.label}.

COACHING KNOWLEDGE — accumulated experience from hundreds of calls:
${ragKnowledge}

Use the knowledge above as your lens. When you see patterns that match known pitfalls, call them out by name. When the rep does something aligned with best practices, reinforce it. The knowledge base represents real patterns — use it to make your analysis sharper and more specific.

Score each component 1-10 where:
- 1-3: Component was absent or poorly executed
- 4-6: Partially present, needs significant improvement
- 7-8: Solid execution with minor gaps
- 9-10: Masterful execution

Components to score:
${componentLines}

Return JSON with this exact structure:
{
  "scores": {
${scoreShape}
  },
  "done_well": ["specific thing with evidence", ...],
  "missing": ["specific step skipped with consequence", ...],
  "weak": ["attempted but poorly executed with why", ...],
  "suggestions": ["specific, actionable coaching point", ...],
  "scripts": ["exact words to say in a specific situation", ...],
  "commitments": ["specific action item as imperative sentence", ...]
}

Also extract 2-4 specific, concrete ACTION ITEMS the rep should complete before their next call. Each must be something they can DO, not a mindset shift.

Be direct. No platitudes. Every suggestion must be specific enough to use on the next call.${lensInstruction}${escalationInstruction}${priorContext}`;
}

export function componentNameByKey(config: MethodologyConfig): Record<string, string> {
  return Object.fromEntries(config.components.map((component) => [component.key, component.name]));
}

export function fallbackAnalyzeTranscript(
  config: MethodologyConfig,
  transcript: string,
  existingSummary = "",
): {
  overallScore: number;
  overallGrade: string;
  scores: Array<{
    component: string;
    score: number;
    maxScore: number;
    indicators: string[];
    missingElements: string[];
    suggestedLanguage: string[];
    coachingPoints: string[];
  }>;
  topStrengths: string[];
  priorityImprovements: string[];
  immediateActions: string[];
  suggestedScripts: Array<{
    situation: string;
    context: string;
    script: string;
    whyItWorks: string;
  }>;
} {
  const text = `${transcript} ${existingSummary}`.toLowerCase();
  const scores = config.components.map((component) => {
    const strongHits = component.strongSignals.filter((signal) => text.includes(signal.toLowerCase()));
    const weakHits = component.weakSignals.filter((signal) => text.includes(signal.toLowerCase()));
    const score = Math.max(1, Math.min(10, 5 + strongHits.length - weakHits.length));

    return {
      component: component.name,
      score,
      maxScore: 10,
      indicators: strongHits.length
        ? [`Found evidence for: ${strongHits.slice(0, 3).join(", ")}`]
        : [],
      missingElements: score < 7
        ? [`Limited evidence of ${component.name}: ${component.description}`]
        : [],
      suggestedLanguage: [],
      coachingPoints: score < 7
        ? [`Strengthen ${component.name} in the next call.`]
        : [],
    };
  });

  const overallScore = Math.round(
    (scores.reduce((sum, score) => sum + score.score, 0) / scores.length) * 10
  ) / 10;

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const weak = [...scores].sort((a, b) => a.score - b.score).filter((score) => score.score < 7);
  const lowest = weak[0] || sorted[sorted.length - 1];

  return {
    overallScore,
    overallGrade: getGrade(overallScore),
    scores,
    topStrengths: sorted.slice(0, 2).filter((score) => score.score >= 7).map((score) =>
      `${score.component}: ${score.indicators[0] || "Good execution"}`
    ),
    priorityImprovements: weak.slice(0, 2).map((score) =>
      `${score.component}: ${score.missingElements[0] || "Needs attention"}`
    ),
    immediateActions: lowest
      ? [`Before the next call, prepare one question or script that specifically strengthens ${lowest.component}.`]
      : [],
    suggestedScripts: lowest
      ? [{
          situation: `Improving ${lowest.component}`,
          context: config.label,
          script: `Before I recommend anything, help me understand ${lowest.component.toLowerCase()} more clearly.`,
          whyItWorks: `It forces the conversation back into the ${config.label} discipline instead of drifting into generic selling.`,
        }]
      : [],
  };
}

export function generateMethodologyCoachingFromAnalysis(
  config: MethodologyConfig,
  analysis: ReturnType<typeof fallbackAnalyzeTranscript>,
): string {
  const weakAreas = analysis.scores
    .filter((score) => score.score < 7)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const strength = analysis.scores.find((score) => score.score >= 7);
  let coaching = `CALL SCORE: ${analysis.overallScore}/10 (${analysis.overallGrade})\n`;
  coaching += `METHODOLOGY: ${config.label}\n\n`;

  if (strength) {
    coaching += `WHAT WORKED\n`;
    coaching += `${strength.component}: ${strength.indicators[0] || "Good execution"}\n\n`;
  }

  if (weakAreas.length > 0) {
    coaching += `FOCUS AREAS\n\n`;
    weakAreas.forEach((area) => {
      coaching += `${area.component} (${area.score}/10)\n`;
      if (area.missingElements[0]) coaching += `Issue: ${area.missingElements[0]}\n`;
      coaching += `\n`;
    });
  }

  if (analysis.suggestedScripts.length > 0) {
    const script = analysis.suggestedScripts[0];
    coaching += `TRY THIS NEXT CALL\n\n`;
    coaching += `When: ${script.situation}\n`;
    coaching += `Say: "${script.script}"\n\n`;
    coaching += `Why it works: ${script.whyItWorks}\n\n`;
  }

  if (analysis.immediateActions.length > 0) {
    coaching += `ONE THING TO DO\n`;
    coaching += `${analysis.immediateActions[0]}\n`;
  }

  return coaching;
}

function getGrade(score: number): string {
  if (score >= 9) return "A+";
  if (score >= 8.5) return "A";
  if (score >= 8) return "A-";
  if (score >= 7.5) return "B+";
  if (score >= 7) return "B";
  if (score >= 6.5) return "B-";
  if (score >= 6) return "C+";
  if (score >= 5.5) return "C";
  if (score >= 5) return "C-";
  if (score >= 4) return "D";
  return "F";
}
