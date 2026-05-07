import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthorizedAccountContext } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AIRCALL_API_BASE = "https://api.aircall.io/v1";

interface AircallCall {
  id: number;
  direct_link: string;
  started_at: number;
  answered_at: number | null;
  ended_at: number | null;
  duration: number;
  direction: string;
  status: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  contact: {
    id: number;
    phone_number: string;
    first_name: string;
    last_name: string;
  } | null;
  recording: string | null;
  voicemail: string | null;
  asset: string | null;
  raw_digits: string;
  number: {
    digits: string;
    name: string;
  };
}

// Get Aircall credentials from database.
// The UI stores a single Basic-auth payload in api_key for new connections.
// Older rows may still have raw api_key/api_secret values.
async function getAircallCredentials(supabase: any, account_id: string): Promise<{ authHeader: string } | null> {
  const { data, error } = await supabase
    .from("API_Connections")
    .select("api_key, api_secret, connection_status")
    .eq("account_id", account_id)
    .eq("provider", "aircall")
    .eq("connection_status", "active")
    .single();

  if (error || !data) {
    console.error("No Aircall connection found:", error);
    return null;
  }

  if (data.api_key && data.api_secret) {
    return {
      authHeader: createAuthHeader(data.api_key, data.api_secret),
    };
  }

  if (data.api_key) {
    return {
      authHeader: data.api_key.startsWith("Basic ") ? data.api_key : `Basic ${data.api_key}`,
    };
  }

  console.error("Aircall connection is missing stored credentials");
  return null;
}

// Create Basic Auth header
function createAuthHeader(apiId: string, apiToken: string): string {
  const credentials = btoa(`${apiId}:${apiToken}`);
  return `Basic ${credentials}`;
}

// Fetch calls from Aircall API
async function fetchAircallCalls(authHeader: string): Promise<AircallCall[]> {
  try {
    // Get calls from the last 30 days
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

    const response = await fetch(
      `${AIRCALL_API_BASE}/calls?from=${thirtyDaysAgo}&per_page=50`,
      {
        headers: {
          "Authorization": authHeader,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch Aircall calls:", await response.text());
      return [];
    }

    const data = await response.json();
    return data.calls || [];
  } catch (e) {
    console.error("Error fetching Aircall calls:", e);
    return [];
  }
}

// Sync calls to Supabase
async function syncCalls(
  supabase: any,
  calls: AircallCall[],
  account_id: string
): Promise<{ synced: number; withRecordings: number }> {
  if (calls.length === 0) return { synced: 0, withRecordings: 0 };

  let withRecordings = 0;

  const records = calls.map((call) => {
    const hasRecording = !!call.recording;
    if (hasRecording) withRecordings++;

    // Calculate duration in minutes
    const durationMinutes = call.duration ? Math.round(call.duration / 60) : null;

    // Get participants
    const participants = [];
    if (call.user?.email) participants.push(call.user.email);
    if (call.contact?.phone_number) participants.push(call.contact.phone_number);

    return {
      account_id: account_id,
      rep_email: call.user?.email || "unknown@example.com",
      call_date: new Date(call.started_at * 1000).toISOString(),
      duration_minutes: durationMinutes,
      participants: participants,
      transcript: null, // Requires AI Assist add-on
      ai_summary: null, // Requires AI Assist add-on
      recording_url: call.recording || null,
      channel: "phone",
      source_provider: "aircall",
      source_call_id: call.id.toString(),
      source_url: call.direct_link,
    };
  });

  const { error } = await supabase
    .from("Synced_Conversations")
    .upsert(records, { onConflict: "account_id,source_provider,source_call_id" });

  if (error) {
    console.error("Error syncing Aircall calls:", error);
    return { synced: 0, withRecordings: 0 };
  }

  return { synced: records.length, withRecordings };
}

// Update sync status
async function updateSyncStatus(supabase: any, callsSynced: number, account_id: string) {
  await supabase
    .from("API_Connections")
    .update({
      last_successful_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", account_id)
    .eq("provider", "aircall");

  // Log the sync
  await supabase.from("Integration_Sync_Log").insert({
    account_id: account_id,
    provider: "aircall",
    sync_status: "completed",
    conversations_synced: callsSynced,
    sync_completed_at: new Date().toISOString(),
  });
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await getAuthorizedAccountContext(req);
    if ("error" in auth) {
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const account_id = auth.accountId;

    // Get Aircall credentials
    const credentials = await getAircallCredentials(supabase, account_id);
    if (!credentials) {
      return new Response(
        JSON.stringify({ error: "No active Aircall connection found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch and sync calls
    const calls = await fetchAircallCalls(credentials.authHeader);
    const { synced, withRecordings } = await syncCalls(supabase, calls, account_id);

    // Update sync status
    await updateSyncStatus(supabase, synced, account_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Aircall sync completed",
        results: {
          calls_fetched: calls.length,
          calls_synced: synced,
          with_recordings: withRecordings,
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Aircall sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
