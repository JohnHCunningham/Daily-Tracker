import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthorizedAccountContext } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface HubSpotActivity {
  id: string;
  properties: {
    hs_timestamp?: string;
    hs_call_title?: string;
    hs_call_duration?: string;
    hs_email_subject?: string;
    hs_meeting_title?: string;
    hs_task_subject?: string;
    hubspot_owner_id?: string;
  };
}

// Get HubSpot access token from database
async function getHubSpotToken(supabase: any, account_id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("API_Connections")
    .select("access_token, token_expires_at")
    .eq("account_id", account_id)
    .eq("provider", "hubspot")
    .eq("connection_status", "active")
    .single();

  if (error || !data) {
    console.error("No HubSpot connection found:", error);
    return null;
  }

  // Check if token is expired
  if (new Date(data.token_expires_at) < new Date()) {
    console.error("HubSpot token expired");
    return null;
  }

  return data.access_token;
}

// Get owner email from HubSpot
async function getOwnerEmail(accessToken: string, ownerId: string): Promise<string> {
  try {
    const response = await fetch(`https://api.hubapi.com/crm/v3/owners/${ownerId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      const owner = await response.json();
      return owner.email || "unknown@example.com";
    }
  } catch (e) {
    console.error("Error fetching owner:", e);
  }
  return "unknown@example.com";
}

// Fetch activities from HubSpot
async function fetchHubSpotActivities(
  accessToken: string,
  objectType: string
): Promise<HubSpotActivity[]> {
  try {
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${objectType}?limit=100`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch ${objectType}:`, await response.text());
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (e) {
    console.error(`Error fetching ${objectType}:`, e);
    return [];
  }
}

// Sync activities to Supabase
async function syncActivities(
  supabase: any,
  activities: HubSpotActivity[],
  activityType: string,
  accessToken: string,
  account_id: string
): Promise<number> {
  if (activities.length === 0) return 0;

  const records = [];
  for (const activity of activities) {
    const repEmail = activity.properties.hubspot_owner_id
      ? await getOwnerEmail(accessToken, activity.properties.hubspot_owner_id)
      : "unknown@example.com";

    const metadata: any = { hubspot_id: activity.id };
    if (activityType === "call") {
      metadata.title = activity.properties.hs_call_title;
      metadata.duration = activity.properties.hs_call_duration;
    } else if (activityType === "email") {
      metadata.subject = activity.properties.hs_email_subject;
    } else if (activityType === "meeting") {
      metadata.title = activity.properties.hs_meeting_title;
    } else if (activityType === "task") {
      metadata.subject = activity.properties.hs_task_subject;
    }

    records.push({
      account_id: account_id,
      rep_email: repEmail,
      activity_date: activity.properties.hs_timestamp?.split("T")[0] || new Date().toISOString().split("T")[0],
      activity_type: activityType,
      count: 1,
      metadata,
      source_provider: "hubspot",
      source_id: activity.id,
      source_url: `https://app.hubspot.com/contacts/${activityType}s/${activity.id}`,
    });
  }

  const { error } = await supabase
    .from("Synced_Activities")
    .upsert(records, { onConflict: "account_id,source_provider,source_id" });

  if (error) {
    console.error(`Error syncing ${activityType}:`, error);
    return 0;
  }

  return records.length;
}

// Update last sync time
async function updateSyncStatus(supabase: any, activitiesSynced: number, account_id: string) {
  await supabase
    .from("API_Connections")
    .update({
      last_successful_sync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("account_id", account_id)
    .eq("provider", "hubspot");

  // Log the sync
  await supabase.from("Integration_Sync_Log").insert({
    account_id: account_id,
    provider: "hubspot",
    sync_status: "completed",
    activities_synced: activitiesSynced,
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

    // Get HubSpot token
    const accessToken = await getHubSpotToken(supabase, account_id);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "No active HubSpot connection found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      calls: { fetched: 0, synced: 0 },
      emails: { fetched: 0, synced: 0 },
      meetings: { fetched: 0, synced: 0 },
      tasks: { fetched: 0, synced: 0 },
    };

    // Sync calls
    const calls = await fetchHubSpotActivities(accessToken, "calls");
    results.calls.fetched = calls.length;
    results.calls.synced = await syncActivities(supabase, calls, "call", accessToken, account_id);

    // Sync emails
    const emails = await fetchHubSpotActivities(accessToken, "emails");
    results.emails.fetched = emails.length;
    results.emails.synced = await syncActivities(supabase, emails, "email", accessToken, account_id);

    // Sync meetings
    const meetings = await fetchHubSpotActivities(accessToken, "meetings");
    results.meetings.fetched = meetings.length;
    results.meetings.synced = await syncActivities(supabase, meetings, "meeting", accessToken, account_id);

    // Sync tasks
    const tasks = await fetchHubSpotActivities(accessToken, "tasks");
    results.tasks.fetched = tasks.length;
    results.tasks.synced = await syncActivities(supabase, tasks, "task", accessToken, account_id);

    const totalSynced = results.calls.synced + results.emails.synced +
                        results.meetings.synced + results.tasks.synced;

    // Update sync status
    await updateSyncStatus(supabase, totalSynced, account_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sync completed",
        results,
        totalSynced,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
