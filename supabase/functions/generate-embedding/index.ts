// ============================================
// GENERATE EMBEDDING EDGE FUNCTION
// Generates embeddings with caching for RAG system
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateEmbedding,
  generateEmbeddingsBatch,
} from "../_shared/rag-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const INTERNAL_BEARER = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

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
    const { text, texts } = body;

    // Validate input
    if (!text && !texts) {
      return new Response(
        JSON.stringify({
          error: "Either 'text' (string) or 'texts' (string[]) is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // Single text embedding
    if (text) {
      const result = await generateEmbedding(text, supabase, OPENAI_API_KEY);

      return new Response(
        JSON.stringify({
          success: true,
          embedding: result.embedding,
          cached: result.cached,
          model: result.model,
          dimensions: result.embedding.length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Batch text embeddings
    if (texts && Array.isArray(texts)) {
      if (texts.length > 100) {
        return new Response(
          JSON.stringify({
            error: "Maximum 100 texts per batch request",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const results = await generateEmbeddingsBatch(
        texts,
        supabase,
        OPENAI_API_KEY
      );

      return new Response(
        JSON.stringify({
          success: true,
          embeddings: results.map((r) => ({
            embedding: r.embedding,
            cached: r.cached,
          })),
          model: results[0]?.model || "text-embedding-3-small",
          count: results.length,
          cachedCount: results.filter((r) => r.cached).length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid request format" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Embedding generation error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Embedding generation failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
