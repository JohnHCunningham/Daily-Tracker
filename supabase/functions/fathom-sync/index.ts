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
const FATHOM_OAUTH_TOKEN_URL = "https://fathom.video/external/v1/oauth2/token";
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
  default_summary?: string | FathomSummary;
  calendar_invitees?: Array<{ name: string; email: string }>;
  recorded_by?: { name: string; email: string };
  recording_start_time?: string;
  recording_end_time?: string;
  meeting_type?: string;
  transcript_language?: string;
  crm_matches?: Record<string, unknown>;
}

interface FathomTranscriptSegment {
  speaker?: {
    display_name?: string;
    matched_calendar_invitee_email?: string;
  };
  text?: string;
  timestamp?: string;
}

interface FathomSummary {
  template_name?: string;
  markdown_formatted?: string;
}

async function refreshFathomToken(supabase: any, connection: any): Promise<{ token: string; type: "oauth" } | null> {
  if (!FATHOM_CLIENT_ID || !FATHOM_CLIENT_SECRET || !connection.refresh_token) {
    return null;
  }

  const response = await fetch(FATHOM_OAUTH_TOKEN_URL, {
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

function getFathomHeaders(credential: { token: string; type: "oauth" | "api_key" }): Record<string, string> {
  return credential.type === "oauth"
    ? { "Authorization": `Bearer ${credential.token}` }
    : { "X-Api-Key": credential.token };
}

// Fetch meetings from Fathom API
async function fetchFathomMeetings(credential: { token: string; type: "oauth" | "api_key" }): Promise<FathomMeeting[]> {
  try {
    const headers = getFathomHeaders(credential);
    const params = new URLSearchParams({ limit: "25" });

    // Fathom's OAuth apps cannot use include_transcript/include_summary on /meetings.
    // API-key connections can, so keep that path for older direct API-key setups.
    if (credential.type === "api_key") {
      params.set("include_transcript", "true");
      params.set("include_summary", "true");
      params.set("include_crm_matches", "true");
    }

    const response = await fetch(
      `${FATHOM_API_BASE}/meetings?${params.toString()}`,
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

async function fetchRecordingTranscript(
  credential: { token: string; type: "oauth" | "api_key" },
  recordingId: number
): Promise<FathomTranscriptSegment[]> {
  try {
    const response = await fetch(
      `${FATHOM_API_BASE}/recordings/${recordingId}/transcript`,
      { headers: getFathomHeaders(credential) }
    );

    if (!response.ok) {
      console.error(`Failed to fetch Fathom transcript for ${recordingId}:`, await response.text());
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.transcript) ? data.transcript : [];
  } catch (e) {
    console.error(`Error fetching Fathom transcript for ${recordingId}:`, e);
    return [];
  }
}

async function fetchRecordingSummary(
  credential: { token: string; type: "oauth" | "api_key" },
  recordingId: number
): Promise<FathomSummary | null> {
  try {
    const response = await fetch(
      `${FATHOM_API_BASE}/recordings/${recordingId}/summary`,
      { headers: getFathomHeaders(credential) }
    );

    if (!response.ok) {
      console.error(`Failed to fetch Fathom summary for ${recordingId}:`, await response.text());
      return null;
    }

    const data = await response.json();
    return data.summary || null;
  } catch (e) {
    console.error(`Error fetching Fathom summary for ${recordingId}:`, e);
    return null;
  }
}

function normalizeTranscriptSegments(transcript: FathomMeeting["transcript"] | FathomTranscriptSegment[]): FathomTranscriptSegment[] {
  if (Array.isArray(transcript)) return transcript;
  if (typeof transcript === "string" && transcript.trim()) {
    return [{ text: transcript.trim() }];
  }
  return [];
}

function formatTranscriptManuscript(segments: FathomTranscriptSegment[]): string | null {
  const lines = segments
    .map((segment) => {
      const speaker = segment.speaker?.display_name || segment.speaker?.matched_calendar_invitee_email || "Speaker";
      const timestamp = segment.timestamp ? `[${segment.timestamp}] ` : "";
      const text = segment.text?.trim();
      if (!text) return null;
      return `${timestamp}${speaker}: ${text}`;
    })
    .filter(Boolean);

  return lines.length > 0 ? lines.join("\n") : null;
}

function formatSummary(summary: FathomMeeting["default_summary"] | FathomSummary | null): string | null {
  if (!summary) return null;
  if (typeof summary === "string") return summary;
  return summary.markdown_formatted || null;
}

// Sync meetings to Supabase
async function syncMeetings(
  supabase: any,
  meetings: FathomMeeting[],
  credential: { token: string; type: "oauth" | "api_key" },
  account_id: string
): Promise<{ synced: number; withTranscripts: number }> {
  if (meetings.length === 0) return { synced: 0, withTranscripts: 0 };

  const records = [];
  let withTranscripts = 0;

  for (const meeting of meetings) {
    // Calculate duration from start/end times if available
    let durationMinutes = null;
    if (meeting.recording_start_time && meeting.recording_end_time) {
      const start = new Date(meeting.recording_start_time).getTime();
      const end = new Date(meeting.recording_end_time).getTime();
      durationMinutes = Math.round((end - start) / 60000);
    }

    // Extract participant emails
    const participants = meeting.calendar_invitees?.map(p => p.email) || [];
    const inlineTranscript = normalizeTranscriptSegments(meeting.transcript);
    const transcriptSegments = inlineTranscript.length > 0
      ? inlineTranscript
      : await fetchRecordingTranscript(credential, meeting.recording_id);
    const transcript = formatTranscriptManuscript(transcriptSegments);
    if (transcript) withTranscripts++;

    const summary = meeting.default_summary
      ? meeting.default_summary
      : await fetchRecordingSummary(credential, meeting.recording_id);

    records.push({
      account_id: account_id,
      rep_email: meeting.recorded_by?.email || "unknown@example.com",
      call_date: meeting.created_at,
      duration_minutes: durationMinutes,
      participants: participants,
      transcript,
      transcript_segments: transcriptSegments,
      transcript_source: "fathom_recording_transcript",
      ai_summary: formatSummary(summary),
      recording_url: meeting.share_url || meeting.url || null,
      channel: "video_call",
      source_provider: "fathom",
      source_call_id: meeting.recording_id.toString(),
      source_url: meeting.url || `https://fathom.video/calls/${meeting.recording_id}`,
      provider_metadata: {
        title: meeting.title || meeting.meeting_title || null,
        meeting_type: meeting.meeting_type || null,
        transcript_language: meeting.transcript_language || null,
        recorded_by: meeting.recorded_by || null,
        calendar_invitees: meeting.calendar_invitees || [],
        crm_matches: meeting.crm_matches || null,
        summary_source: summary ? "fathom_secondary_context" : null,
      },
    });
  }

  const { error } = await supabase
    .from("Synced_Conversations")
    .upsert(records, { onConflict: "account_id,source_provider,source_call_id" });

  if (error) {
    console.error("Error syncing Fathom meetings:", error);
    return { synced: 0, withTranscripts: 0 };
  }

  return { synced: records.length, withTranscripts };
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
    const { synced: syncedCount, withTranscripts } = await syncMeetings(supabase, meetings, credential, account_id);

    // Update sync status
    await updateSyncStatus(supabase, syncedCount, account_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Fathom sync completed",
        results: {
          meetings_fetched: meetings.length,
          meetings_synced: syncedCount,
          transcripts_synced: withTranscripts,
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
