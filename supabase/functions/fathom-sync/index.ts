import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthorizedAccountContext } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FATHOM_API_BASE = "https://api.fathom.ai/external/v1";
const FATHOM_CLIENT_ID = Deno.env.get("FATHOM_CLIENT_ID");
const FATHOM_CLIENT_SECRET = Deno.env.get("FATHOM_CLIENT_SECRET");

interface FathomMeeting {
  recording_id: number;
  title?: string;
  meeting_title?: string;
  created_at: string;
  url?: string;
  share_url?: string;
  transcript?: string;
  default_summary?: string;
  calendar_invitees?: Array<{ name: string; email: string }>;
  recorded_by?: { name: string; email: string };
  recording_start_time?: string;
  recording_end_time?: string;
}

async function refreshFathomToken(supabase: any, connection: any): Promise<{ token: string; type: "oauth" } | null> {
  if (!FATHOM_CLIENT_ID || !FATHOM_CLIENT_SECRET || !connection.refresh_token) {
    return null;
  }

  const response = await fetch(`${FATHOM_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
      client_id: FATHOM_CLIENT_ID,
      client_secret: FATHOM_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    await supabase
      .from("API_Connections")
      .update({
        connection_status: "error",
        last_error: `Fathom token refresh failed: ${body.substring(0, 500)}`,
        last_error_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);
    return null;
  }

  const tokens = await response.json();
  await supabase
    .from("API_Connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || connection.refresh_token,
      token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      connection_status: "active",
      last_error: null,
      last_error_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  return { token: tokens.access_token, type: "oauth" };
}

// Get Fathom credentials from database. OAuth access_token is preferred; api_key is kept for old connections.
async function getFathomCredential(supabase: any, account_id: string): Promise<{ token: string; type: "oauth" | "api_key" } | null> {
  const { data, error } = await supabase
    .from("API_Connections")
    .select("id, access_token, refresh_token, token_expires_at, api_key, connection_status")
    .eq("account_id", account_id)
    .eq("provider", "fathom")
    .eq("connection_status", "active")
    .single();

  if (error || !data) {
    console.error("No Fathom connection found:", error);
    return null;
  }

  if (data.access_token) {
    if (data.token_expires_at && new Date(data.token_expires_at).getTime() < Date.now() + 60_000) {
      return await refreshFathomToken(supabase, data);
    }
    return { token: data.access_token, type: "oauth" };
  }

  if (data.api_key) {
    return { token: data.api_key, type: "api_key" };
  }

  return null;
}

// Fetch meetings from Fathom API
async function fetchFathomMeetings(credential: { token: string; type: "oauth" | "api_key" }): Promise<FathomMeeting[]> {
  try {
    const headers = credential.type === "oauth"
      ? { "Authorization": `Bearer ${credential.token}` }
      : { "X-Api-Key": credential.token };

    const response = await fetch(
      `${FATHOM_API_BASE}/meetings?include_transcript=true`,
      { headers }
    );

    if (!response.ok) {
      console.error("Failed to fetch Fathom meetings:", await response.text());
      return [];
    }

    const data = await response.json();
    // Fathom returns { items: [...], next_cursor: "", limit: 10 }
    return data.items || [];
  } catch (e) {
    console.error("Error fetching Fathom meetings:", e);
    return [];
  }
}

// Sync meetings to Supabase
async function syncMeetings(
  supabase: any,
  meetings: FathomMeeting[],
  account_id: string
): Promise<number> {
  if (meetings.length === 0) return 0;

  const records = meetings.map((meeting) => {
    // Calculate duration from start/end times if available
    let durationMinutes = null;
    if (meeting.recording_start_time && meeting.recording_end_time) {
      const start = new Date(meeting.recording_start_time).getTime();
      const end = new Date(meeting.recording_end_time).getTime();
      durationMinutes = Math.round((end - start) / 60000);
    }

    // Extract participant emails
    const participants = meeting.calendar_invitees?.map(p => p.email) || [];

    return {
      account_id: account_id,
      rep_email: meeting.recorded_by?.email || "unknown@example.com",
      call_date: meeting.created_at,
      duration_minutes: durationMinutes,
      participants: participants,
      transcript: meeting.transcript || null,
      ai_summary: meeting.default_summary || null,
      recording_url: meeting.share_url || meeting.url || null,
      channel: "video_call",
      source_provider: "fathom",
      source_call_id: meeting.recording_id.toString(),
      source_url: meeting.url || `https://fathom.video/calls/${meeting.recording_id}`,
    };
  });

  const { error } = await supabase
    .from("Synced_Conversations")
    .upsert(records, { onConflict: "account_id,source_provider,source_call_id" });

  if (error) {
    console.error("Error syncing Fathom meetings:", error);
    return 0;
  }

  return records.length;
}

// Update sync status
async function updateSyncStatus(supabase: any, conversationsSynced: number, account_id: string) {
  await supabase
    .from("API_Connections")
    .update({
      last_successful_sync: new Date().toISOString(),
      connection_status: "active",
      last_error: null,
      last_error_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", account_id)
    .eq("provider", "fathom");

  // Log the sync
  await supabase.from("Integration_Sync_Log").insert({
    account_id: account_id,
    provider: "fathom",
    sync_status: "completed",
    conversations_synced: conversationsSynced,
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

    // Get Fathom credential
    const credential = await getFathomCredential(supabase, account_id);
    if (!credential) {
      return new Response(
        JSON.stringify({ error: "No active Fathom connection found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch and sync meetings
    const meetings = await fetchFathomMeetings(credential);
    const syncedCount = await syncMeetings(supabase, meetings, account_id);

    // Update sync status
    await updateSyncStatus(supabase, syncedCount, account_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Fathom sync completed",
        results: {
          meetings_fetched: meetings.length,
          meetings_synced: syncedCount,
        },
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fathom sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
