// ============================================
// RAG SEARCH EDGE FUNCTION
// Semantic search over Sandler Knowledge Base
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ragSearch,
  findScriptsForWeakness,
  buildRAGContext,
  buildCoachingContext,
  RAGSearchResult,
} from "../_shared/rag-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const INTERNAL_API_KEY = Deno.env.get("INTERNAL_API_KEY") || SUPABASE_SERVICE_ROLE_KEY;
const INTERNAL_BEARER = `Bearer ${INTERNAL_API_KEY}`;

interface SearchRequest {
  query: string;
  contentTypes?: string[];
  components?: string[];
  weaknessTags?: string[];
  situationTags?: string[];
  matchThreshold?: number;
  matchCount?: number;
  includeContext?: boolean;
  methodology?: string;
}

interface WeaknessScriptsRequest {
  component: string;
  limit?: number;
  methodology?: string;
}

interface CoachingContextRequest {
  weakAreas: string[];
  transcript?: string;
  methodology?: string;
  methodologyLabel?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.headers.get("Authorization") !== INTERNAL_BEARER) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { action = "search" } = body;

    // Validate OpenAI API key
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Route to appropriate action
    switch (action) {
      case "search":
        return await handleSearch(body, supabase);

      case "scripts_for_weakness":
        return await handleScriptsForWeakness(body, supabase);

      case "coaching_context":
        return await handleCoachingContext(body, supabase);

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown action: ${action}. Valid actions: search, scripts_for_weakness, coaching_context`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("RAG search error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "RAG search failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Handle semantic search request
 */
async function handleSearch(
  body: SearchRequest,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const {
    query,
    contentTypes,
    components,
    weaknessTags,
    situationTags,
    matchThreshold = 0.5,
    matchCount = 5,
    includeContext = false,
    methodology,
  } = body;

  if (!query) {
    return new Response(
      JSON.stringify({ error: "'query' is required for search" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const results = await ragSearch(supabase, OPENAI_API_KEY, {
    query,
    contentTypes,
    components,
    weaknessTags,
    situationTags,
    matchThreshold,
    matchCount,
    methodology,
  });

  const response: {
    success: boolean;
    results: RAGSearchResult[];
    count: number;
    context?: string;
  } = {
    success: true,
    results,
    count: results.length,
  };

  // Optionally include pre-built context string
  if (includeContext) {
    response.context = buildRAGContext(results);
  }

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Handle scripts for weakness lookup (no embedding needed)
 */
async function handleScriptsForWeakness(
  body: WeaknessScriptsRequest,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const { component, limit = 3, methodology } = body;

  if (!component) {
    return new Response(
      JSON.stringify({ error: "'component' is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const scripts = await findScriptsForWeakness(supabase, component, limit, methodology);

  return new Response(
    JSON.stringify({
      success: true,
      scripts,
      count: scripts.length,
      component,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Handle coaching context generation
 */
async function handleCoachingContext(
  body: CoachingContextRequest,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const { weakAreas, transcript, methodology, methodologyLabel } = body;

  if (!weakAreas || !Array.isArray(weakAreas) || weakAreas.length === 0) {
    return new Response(
      JSON.stringify({
        error: "'weakAreas' array is required with at least one element",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const context = await buildCoachingContext(
    supabase,
    OPENAI_API_KEY,
    weakAreas,
    transcript,
    methodology,
    methodologyLabel
  );

  return new Response(
    JSON.stringify({
      success: true,
      context,
      weakAreas,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
