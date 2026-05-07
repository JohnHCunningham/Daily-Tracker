import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeTranscript, generateCoachingFromAnalysis, SANDLER_COMPONENTS } from "./sandler-methodology.ts";
import {
  ragSearch,
  buildCoachingContext,
  normalizeComponentName,
} from "../_shared/rag-utils.ts";
import { getAuthorizedAccountContext } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// ─── Coaching Lenses ───
// Each lens frames the same weakness from a different angle so reps
// never receive the same style of coaching twice in a row.
const COACHING_LENSES = [
  "script",     // "Here's exactly what to say next time"
  "question",   // "Ask yourself this before the next call"
  "pattern",    // "Here's the pattern — you do X when Y happens"
  "analogy",    // "Think of it like..."
  "contrast",   // "Compare what you said vs. what the prospect needed to hear"
] as const;

type CoachingLens = typeof COACHING_LENSES[number];

const LENS_INSTRUCTIONS: Record<CoachingLens, string> = {
  script: `Frame every suggestion as EXACT SCRIPTS — give the rep specific words and phrases they can use verbatim on their next call. Format: "When [situation], say: '[exact script]'"`,
  question: `Frame every suggestion as SELF-REFLECTION QUESTIONS — instead of telling the rep what to do, ask probing questions that help them discover the gap themselves. Format: "Before your next call, ask yourself: '[question]'"`,
  pattern: `Frame every suggestion as PATTERN RECOGNITION — show the rep the behavioral pattern you observed across this call. Name the trigger, the habitual response, and the better alternative. Format: "Pattern: When [trigger], you tend to [habit]. Instead, [better approach]."`,
  analogy: `Frame every suggestion using ANALOGIES and METAPHORS — connect the sales concept to something familiar outside of sales so it clicks at a deeper level. Make the comparison vivid and memorable.`,
  contrast: `Frame every suggestion as SIDE-BY-SIDE CONTRASTS — show what the rep actually said or did, then show what the prospect needed to hear instead. Format: "What happened: '[actual quote]' → What to try: '[better approach]'"`,
};

// ─── Escalation Tiers ───
// The more times a weakness recurs, the more direct the coaching becomes.
function getEscalationTier(timesFlagged: number): number {
  if (timesFlagged <= 1) return 1;
  if (timesFlagged <= 3) return 2;
  return 3;
}

const ESCALATION_INSTRUCTIONS: Record<number, string> = {
  1: `This appears to be a new area for improvement. Use an encouraging, developmental tone — "Here's something to try next time."`,
  2: `This weakness has appeared 2-3 times before. Be more direct: "This is becoming a pattern. Here's what needs to change." Don't sugarcoat it, but stay constructive.`,
  3: `This weakness has persisted across 4+ calls. Be frank and urgent: "This is the single biggest thing holding back your results. Let's focus here." Provide a specific drill or practice exercise, not just advice.`,
};

// ─── Pick Next Lens ───
// Deterministic rotation: find which lens was used last for this rep's
// weakest component and pick the next one in the cycle.
function pickNextLens(lastUsedLens: string | null): CoachingLens {
  if (!lastUsedLens) return COACHING_LENSES[0];
  const lastIndex = COACHING_LENSES.indexOf(lastUsedLens as CoachingLens);
  if (lastIndex === -1) return COACHING_LENSES[0];
  return COACHING_LENSES[(lastIndex + 1) % COACHING_LENSES.length];
}

// ─── GPT-4 Deep Analysis ───
async function analyzeWithGPT4(
  transcript: string,
  priorSuggestions: string[],
  lens: CoachingLens,
  escalationTier: number
): Promise<{
  scores: Record<string, { score: number; evidence: string; status: string }>;
  done_well: string[];
  missing: string[];
  weak: string[];
  suggestions: string[];
  scripts: string[];
  commitments: string[];
}> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  // Build non-repetition context
  let priorContext = "";
  if (priorSuggestions.length > 0) {
    priorContext = `\n\nIMPORTANT — PRIOR COACHING ALREADY GIVEN (DO NOT REPEAT THESE OR PARAPHRASE THEM):\n${priorSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nThe rep has already received the above. Generate completely FRESH suggestions that approach the problem from a different angle.`;
  }

  // Build lens + escalation instructions
  const lensInstruction = `\n\nCOACHING STYLE FOR THIS SESSION:\n${LENS_INSTRUCTIONS[lens]}`;
  const escalationInstruction = `\n\nTONE CALIBRATION:\n${ESCALATION_INSTRUCTIONS[escalationTier]}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a Sandler Selling System expert coach. Analyze sales call transcripts and score them against the 8 Sandler components. Be specific, cite evidence from the transcript, and provide actionable coaching.

Score each component 1-10 where:
- 1-3: Component was absent or poorly executed
- 4-6: Partially present, needs significant improvement
- 7-8: Solid execution with minor gaps
- 9-10: Masterful execution

Components to score:
1. Bonding & Rapport - Genuine connection before business
2. Upfront Contract - Clear expectations for the conversation
3. Pain Funnel - Deep emotional/business pain uncovered
4. Budget Step - Honest money conversation before solution
5. Decision Step - Mapped decision process, stakeholders, timeline
6. Fulfillment - Solution tied to stated pain, not feature dumping
7. Post-Sell - Prevented buyer's remorse, clear next steps
8. No Free Consulting - Protected expertise, maintained boundaries

Return JSON with this exact structure:
{
  "scores": {
    "bonding_rapport": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" },
    "upfront_contract": { ... },
    "pain_funnel": { ... },
    "budget_step": { ... },
    "decision_step": { ... },
    "fulfillment": { ... },
    "post_sell": { ... },
    "no_free_consulting": { ... }
  },
  "done_well": ["specific thing with evidence", ...],
  "missing": ["specific step skipped with consequence", ...],
  "weak": ["attempted but poorly executed with why", ...],
  "suggestions": ["specific, actionable coaching point", ...],
  "scripts": ["exact words to say in a specific situation", ...],
  "commitments": ["specific action item as imperative sentence", ...]
}

Also extract 2-4 specific, concrete ACTION ITEMS the rep should complete before their next call. Each must be something they can DO — not a mindset shift. Format as imperative sentences (e.g. "Practice the Pain Funnel opening on your next 3 calls").

Be direct. No platitudes. Every suggestion must be specific enough to use on the next call.${lensInstruction}${escalationInstruction}${priorContext}`
        },
        {
          role: "user",
          content: `Analyze this sales call transcript:\n\n${transcript.substring(0, 12000)}`
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

// ─── Load Prior Suggestions with Lens Info ───
async function loadPriorSuggestions(
  supabase: any,
  userId: string,
  limit = 20
): Promise<{
  texts: string[];
  lastLensByComponent: Record<string, string>;
  maxTimesFlagged: number;
}> {
  const { data } = await supabase
    .from("Coaching_Suggestions_Log")
    .select("suggestion_text, weakness_pattern, coaching_lens, times_flagged")
    .eq("user_id", userId)
    .order("last_flagged_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) {
    return { texts: [], lastLensByComponent: {}, maxTimesFlagged: 0 };
  }

  const texts = data.map((r: any) => r.suggestion_text);

  // Build map of last lens used per component
  const lastLensByComponent: Record<string, string> = {};
  const seen = new Set<string>();
  for (const row of data) {
    if (row.weakness_pattern && !seen.has(row.weakness_pattern)) {
      lastLensByComponent[row.weakness_pattern] = row.coaching_lens || "script";
      seen.add(row.weakness_pattern);
    }
  }

  // Find the highest times_flagged for escalation
  const maxTimesFlagged = Math.max(...data.map((r: any) => r.times_flagged || 1));

  return { texts, lastLensByComponent, maxTimesFlagged };
}

// ─── Log New Suggestions with Lens ───
async function logSuggestions(
  supabase: any,
  accountId: string,
  userId: string,
  callId: string,
  suggestions: string[],
  components: string[],
  lens: CoachingLens
) {
  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];
    const component = components[i] || "general";

    // Check if this weakness pattern exists for this user
    const { data: existing } = await supabase
      .from("Coaching_Suggestions_Log")
      .select("id, times_flagged")
      .eq("user_id", userId)
      .eq("weakness_pattern", component)
      .limit(1);

    if (existing && existing.length > 0) {
      const newTimesFlagged = existing[0].times_flagged + 1;
      await supabase
        .from("Coaching_Suggestions_Log")
        .update({
          suggestion_text: suggestion,
          times_flagged: newTimesFlagged,
          escalation_tier: getEscalationTier(newTimesFlagged),
          coaching_lens: lens,
          last_flagged_at: new Date().toISOString(),
          call_id: callId,
        })
        .eq("id", existing[0].id);
    } else {
      await supabase.from("Coaching_Suggestions_Log").insert({
        account_id: accountId,
        user_id: userId,
        call_id: callId,
        suggestion_text: suggestion,
        component,
        weakness_pattern: component,
        coaching_lens: lens,
        escalation_tier: 1,
      });
    }
  }
}

// ─── Main Handler ───
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const use_rag = body.use_rag !== false;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const auth = await getAuthorizedAccountContext(req);
    if ("error" in auth) {
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Batch Mode: query-only (fan-out is handled by run_daily_coaching_pipeline in DB) ───
    // This mode now only returns the list of unanalyzed calls for monitoring/debugging.
    // The DB function dispatches individual analyze-call invocations via pg_net.
    if (body.mode === "batch") {
      const batchAccountId = auth.internal ? body.account_id : auth.accountId;
      if (!batchAccountId) {
        return new Response(
          JSON.stringify({ error: "account_id is required for batch mode" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!auth.internal && body.account_id && body.account_id !== auth.accountId) {
        return new Response(
          JSON.stringify({ error: "Account scope mismatch" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: unanalyzed, error: fetchErr } = await supabase
        .from("Synced_Conversations")
        .select("id, call_date, rep_email")
        .eq("account_id", batchAccountId)
        .is("analyzed_at", null)
        .not("transcript", "is", null)
        .order("call_date", { ascending: false })
        .limit(20);

      return new Response(
        JSON.stringify({
          success: true,
          mode: "batch_query",
          message: "Batch fan-out is handled by run_daily_coaching_pipeline(). This endpoint lists pending calls.",
          pending_calls: unanalyzed || [],
          count: unanalyzed?.length || 0,
          error: fetchErr?.message || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Single Call Mode ───
    const call_id = body.call_id || body.conversation_id;

    if (!call_id) {
      return new Response(
        JSON.stringify({ error: "call_id is required (or use mode: 'batch' with account_id)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the call
    const { data: call, error: callError } = await supabase
      .from("Synced_Conversations")
      .select("*")
      .eq("id", call_id)
      .eq("account_id", auth.accountId)
      .single();

    if (callError || !call) {
      return new Response(
        JSON.stringify({ error: "Call not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transcript = call.transcript || call.ai_summary || "";
    if (!transcript) {
      return new Response(
        JSON.stringify({ error: "No transcript available for analysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the rep user ID for non-repetition
    let repUserId: string | null = null;
    if (call.rep_email) {
      const { data: repUser } = await supabase
        .from("Users")
        .select("auth_id")
        .eq("email", call.rep_email)
        .eq("account_id", call.account_id)
        .single();
      repUserId = repUser?.auth_id || null;
    }

    // Load prior coaching suggestions with lens history
    const prior = repUserId
      ? await loadPriorSuggestions(supabase, repUserId)
      : { texts: [], lastLensByComponent: {}, maxTimesFlagged: 0 };

    // Determine which lens to use next
    // Use the weakest component's last lens to pick the next one
    // (we don't know the weakest yet, so use the most recent component's last lens)
    const mostRecentComponent = Object.keys(prior.lastLensByComponent)[0] || null;
    const lastUsedLens = mostRecentComponent
      ? prior.lastLensByComponent[mostRecentComponent]
      : null;
    const nextLens = pickNextLens(lastUsedLens);

    // Determine escalation tier
    const escalationTier = getEscalationTier(prior.maxTimesFlagged);

    // Try GPT-4 deep analysis first, fall back to keyword analysis
    let gptAnalysis: any = null;
    let keywordAnalysis = analyzeTranscript(transcript, call.ai_summary || "");
    let coaching: string;
    let methodologyScores: Record<string, number> = {};

    if (OPENAI_API_KEY) {
      try {
        gptAnalysis = await analyzeWithGPT4(transcript, prior.texts, nextLens, escalationTier);

        // Build methodology_scores from GPT-4 output
        const componentNameMap: Record<string, string> = {
          bonding_rapport: "Bonding & Rapport",
          upfront_contract: "Upfront Contract",
          pain_funnel: "Pain Funnel",
          budget_step: "Budget Step",
          decision_step: "Decision Step",
          fulfillment: "Fulfillment",
          post_sell: "Post-Sell",
          no_free_consulting: "No Free Consulting",
        };

        for (const [key, data] of Object.entries(gptAnalysis.scores)) {
          const name = componentNameMap[key] || key;
          methodologyScores[name] = (data as any).score;
        }

        // Build rich coaching content
        const lensLabel = {
          script: "Scripts & Language",
          question: "Self-Reflection",
          pattern: "Pattern Recognition",
          analogy: "Analogies & Insights",
          contrast: "Side-by-Side Contrast",
        }[nextLens];

        coaching = `📊 SANDLER ANALYSIS\n\n`;

        // Done well
        if (gptAnalysis.done_well.length > 0) {
          coaching += `✅ WHAT YOU DID WELL\n`;
          gptAnalysis.done_well.forEach((item: string) => {
            coaching += `• ${item}\n`;
          });
          coaching += `\n`;
        }

        // Missing
        if (gptAnalysis.missing.length > 0) {
          coaching += `❌ WHAT WAS MISSING\n`;
          gptAnalysis.missing.forEach((item: string) => {
            coaching += `• ${item}\n`;
          });
          coaching += `\n`;
        }

        // Weak
        if (gptAnalysis.weak.length > 0) {
          coaching += `⚠️ NEEDS IMPROVEMENT\n`;
          gptAnalysis.weak.forEach((item: string) => {
            coaching += `• ${item}\n`;
          });
          coaching += `\n`;
        }

        // Suggestions — tagged with lens type
        if (gptAnalysis.suggestions.length > 0) {
          coaching += `🎯 COACHING — ${lensLabel}${escalationTier >= 3 ? ' (Recurring Focus Area)' : escalationTier >= 2 ? ' (Pattern Detected)' : ''}\n`;
          gptAnalysis.suggestions.forEach((item: string, i: number) => {
            coaching += `${i + 1}. ${item}\n`;
          });
          coaching += `\n`;
        }

        // Scripts
        if (gptAnalysis.scripts.length > 0) {
          coaching += `💬 SCRIPTS TO PRACTICE\n`;
          gptAnalysis.scripts.forEach((item: string) => {
            coaching += `• "${item}"\n`;
          });
        }

        // Commitments
        if (gptAnalysis.commitments && gptAnalysis.commitments.length > 0) {
          coaching += `\n📋 YOUR COMMITMENTS\n`;
          gptAnalysis.commitments.forEach((item: string, i: number) => {
            coaching += `${i + 1}. ${item}\n`;
          });
        }

        // Log suggestions with lens for non-repetition tracking
        if (repUserId && gptAnalysis.suggestions.length > 0) {
          const weakComponents = Object.entries(gptAnalysis.scores)
            .filter(([_, data]) => (data as any).status === 'weak' || (data as any).status === 'missing')
            .map(([key]) => key);

          await logSuggestions(
            supabase,
            call.account_id,
            repUserId,
            call_id,
            gptAnalysis.suggestions,
            weakComponents,
            nextLens
          );
        }

      } catch (gptError) {
        console.warn("GPT-4 analysis failed, using keyword fallback:", gptError);
        gptAnalysis = null;
      }
    }

    // Fallback to keyword analysis if GPT-4 failed
    if (!gptAnalysis) {
      keywordAnalysis.scores.forEach(s => {
        methodologyScores[s.component] = s.score;
      });
      const repName = call.rep_email?.split("@")[0].replace(/[._]/g, " ") || "Rep";
      const callDate = new Date(call.call_date).toLocaleDateString();
      coaching = generateCoachingFromAnalysis(keywordAnalysis, repName, callDate);
    }

    // RAG enhancement for weak areas
    let ragScripts: any[] = [];
    const weakAreas = Object.entries(methodologyScores)
      .filter(([_, score]) => score < 7)
      .sort(([_, a], [__, b]) => a - b)
      .slice(0, 3)
      .map(([name]) => name);

    if (use_rag && OPENAI_API_KEY && weakAreas.length > 0) {
      try {
        const weakestComponent = weakAreas[0];
        const scriptResults = await ragSearch(supabase, OPENAI_API_KEY, {
          query: `Sales script for ${weakestComponent} improvement`,
          contentTypes: ["script", "manager_approved"],
          components: [normalizeComponentName(weakestComponent)],
          matchCount: 3,
          matchThreshold: 0.4,
        });

        ragScripts = scriptResults.map((r: any) => ({
          title: r.chunk_title,
          text: r.chunk_text,
          situation: r.situation_tags,
        }));

        if (ragScripts.length > 0) {
          coaching += `\n\n---\nRECOMMENDED SCRIPTS\n\n`;
          ragScripts.forEach((script: any, i: number) => {
            coaching += `${i + 1}. ${script.title}\n${script.text}\n\n`;
          });
        }
      } catch (ragError) {
        console.warn("RAG retrieval failed:", ragError);
      }
    }

    // Update the call record
    await supabase
      .from("Synced_Conversations")
      .update({
        methodology_scores: methodologyScores,
        ai_summary: gptAnalysis
          ? `Done well: ${gptAnalysis.done_well.join('; ')}. Missing: ${gptAnalysis.missing.join('; ')}. Weak: ${gptAnalysis.weak.join('; ')}.`
          : call.ai_summary,
        analyzed_at: new Date().toISOString(),
        coaching_generated: true,
      })
      .eq("id", call_id);

    // Auto-generate coaching message for leader approval
    const overallScore = Object.values(methodologyScores).length > 0
      ? (Object.values(methodologyScores).reduce((a, b) => a + b, 0) / Object.values(methodologyScores).length).toFixed(1)
      : "N/A";
    const callDate = new Date(call.call_date).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });

    // Find the manager for this rep's account
    const { data: manager } = await supabase
      .from("Users")
      .select("id, auth_id, email")
      .eq("account_id", call.account_id)
      .in("role", ["admin", "manager", "coach"])
      .limit(1)
      .single();

    const { data: insertedMsg } = await supabase.from("Coaching_Messages").insert({
      from_user_id: manager?.id || null,
      to_user_id: repUserId ? (await supabase.from("Users").select("id").eq("auth_id", repUserId).single()).data?.id : null,
      account_id: call.account_id,
      call_id,
      coaching_lens: nextLens,
      subject: `Sandler Analysis: ${callDate} (Score: ${overallScore}/10)`,
      message_body: coaching!,
      rep_email: call.rep_email,
      manager_email: manager?.email || null,
      coaching_content: coaching!,
      methodology: "Sandler",
      status: "generated",
      generated_at: new Date().toISOString(),
    }).select('id').single();

    // Insert commitments if available
    if (insertedMsg?.id && gptAnalysis?.commitments && gptAnalysis.commitments.length > 0) {
      const commitmentRows = gptAnalysis.commitments.map((text: string) => ({
        account_id: call.account_id,
        coaching_message_id: insertedMsg.id,
        rep_email: call.rep_email,
        commitment_text: text,
        status: 'open',
      }));
      await supabase.from("Coaching_Commitments").insert(commitmentRows);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scores: methodologyScores,
        coaching: coaching!,
        gpt4_powered: !!gptAnalysis,
        rag_enhanced: ragScripts.length > 0,
        coaching_lens: nextLens,
        escalation_tier: escalationTier,
        call_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
