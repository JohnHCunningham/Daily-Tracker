import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthorizedAccountContext } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HUBSPOT_CLIENT_ID = Deno.env.get("HUBSPOT_CLIENT_ID");
const HUBSPOT_CLIENT_SECRET = Deno.env.get("HUBSPOT_CLIENT_SECRET");

interface HubSpotActivity {
  id: string;
  properties: {
    hs_timestamp?: string;
    hs_call_title?: string;
    hs_call_duration?: string;
    hs_email_subject?: string;
    hs_meeting_title?: string;
    hs_task_subject?: string;
    hs_note_body?: string;
    hubspot_owner_id?: string;
  };
}

interface HubSpotOwner {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface OwnerMapping {
  providerUserId: string | null;
  providerEmail: string;
  providerName: string | null;
  occUserId: string | null;
  matchStatus: "matched" | "unmatched" | "ignored";
  confidence: number;
}

async function refreshHubSpotToken(supabase: any, connection: any): Promise<string | null> {
  if (!HUBSPOT_CLIENT_ID || !HUBSPOT_CLIENT_SECRET || !connection.refresh_token) {
    return null;
  }

  const response = await fetch("https://api.hubapi.com/oauth/v3/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: HUBSPOT_CLIENT_ID,
      client_secret: HUBSPOT_CLIENT_SECRET,
      refresh_token: connection.refresh_token,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    await supabase
      .from("API_Connections")
      .update({
        connection_status: "error",
        last_error: `HubSpot token refresh failed: ${body.substring(0, 500)}`,
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
      token_expires_at: new Date(Date.now() + (tokens.expires_in || 1800) * 1000).toISOString(),
      connection_status: "active",
      last_error: null,
      last_error_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  return tokens.access_token;
}

// Get HubSpot access token from database
async function getHubSpotToken(supabase: any, account_id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("API_Connections")
    .select("id, access_token, refresh_token, token_expires_at")
    .eq("account_id", account_id)
    .eq("provider", "hubspot")
    .eq("connection_status", "active")
    .single();

  if (error || !data) {
    console.error("No HubSpot connection found:", error);
    return null;
  }

  // Refresh shortly before expiry so sync does not randomly fail mid-run.
  if (data.token_expires_at && new Date(data.token_expires_at).getTime() < Date.now() + 60_000) {
    const refreshed = await refreshHubSpotToken(supabase, data);
    if (refreshed) return refreshed;
    console.error("HubSpot token expired and refresh failed");
    return null;
  }

  return data.access_token;
}

// Get owner identity from HubSpot
async function getHubSpotOwner(accessToken: string, ownerId: string): Promise<HubSpotOwner | null> {
  try {
    const response = await fetch(`https://api.hubapi.com/crm/v3/owners/${ownerId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      const owner = await response.json();
      return {
        id: String(owner.id || ownerId),
        email: owner.email || "unknown@example.com",
        firstName: owner.firstName,
        lastName: owner.lastName,
      };
    }
  } catch (e) {
    console.error("Error fetching owner:", e);
  }
  return null;
}

async function fetchHubSpotOwners(accessToken: string): Promise<HubSpotOwner[]> {
  try {
    const response = await fetch("https://api.hubapi.com/crm/v3/owners?limit=100", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error("Failed to fetch HubSpot owners:", await response.text());
      return [];
    }

    const data = await response.json();
    return (data.results || []).map((owner: any) => ({
      id: String(owner.id),
      email: owner.email || "unknown@example.com",
      firstName: owner.firstName,
      lastName: owner.lastName,
    }));
  } catch (e) {
    console.error("Error fetching HubSpot owners:", e);
    return [];
  }
}

async function syncOwners(
  supabase: any,
  accessToken: string,
  account_id: string,
  ownerCache: Map<string, OwnerMapping>
): Promise<number> {
  const owners = await fetchHubSpotOwners(accessToken);
  for (const owner of owners) {
    await resolveOwnerMapping(supabase, accessToken, account_id, owner.id, ownerCache);
  }
  return owners.length;
}

async function resolveOwnerMapping(
  supabase: any,
  accessToken: string,
  account_id: string,
  ownerId: string | undefined,
  ownerCache: Map<string, OwnerMapping>
): Promise<OwnerMapping> {
  if (!ownerId) {
    return {
      providerUserId: null,
      providerEmail: "unknown@example.com",
      providerName: null,
      occUserId: null,
      matchStatus: "unmatched",
      confidence: 0,
    };
  }

  const cached = ownerCache.get(ownerId);
  if (cached) return cached;

  const owner = await getHubSpotOwner(accessToken, ownerId);
  const providerEmail = owner?.email || "unknown@example.com";
  const providerName = owner
    ? [owner.firstName, owner.lastName].filter(Boolean).join(" ") || null
    : null;

  const { data: existing } = await supabase
    .from("Integration_User_Mappings")
    .select("occ_user_id, match_status, confidence")
    .eq("account_id", account_id)
    .eq("provider", "hubspot")
    .eq("provider_user_id", ownerId)
    .maybeSingle();

  let occUserId = existing?.occ_user_id || null;
  let matchStatus: OwnerMapping["matchStatus"] = existing?.match_status || "unmatched";
  let confidence = Number(existing?.confidence || 0);

  if (!existing && !occUserId && providerEmail !== "unknown@example.com") {
    const { data: matchedUser } = await supabase
      .from("Users")
      .select("id")
      .eq("account_id", account_id)
      .ilike("email", providerEmail)
      .maybeSingle();

    if (matchedUser?.id) {
      occUserId = matchedUser.id;
      matchStatus = "matched";
      confidence = 1;
    }
  }

  const mapping = {
    providerUserId: ownerId,
    providerEmail,
    providerName,
    occUserId,
    matchStatus,
    confidence,
  };

  const { error } = await supabase
    .from("Integration_User_Mappings")
    .upsert({
      account_id,
      provider: "hubspot",
      provider_user_id: ownerId,
      provider_email: providerEmail,
      provider_name: providerName,
      occ_user_id: occUserId,
      match_status: matchStatus,
      confidence,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "account_id,provider,provider_user_id" });

  if (error) console.error("Error upserting HubSpot owner mapping:", error);

  ownerCache.set(ownerId, mapping);
  return mapping;
}

// Fetch activities from HubSpot
async function fetchHubSpotActivities(
  accessToken: string,
  objectType: string
): Promise<HubSpotActivity[]> {
  try {
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${objectType}?limit=100&properties=hs_timestamp,hs_call_title,hs_call_duration,hs_email_subject,hs_meeting_title,hs_task_subject,hs_note_body,hubspot_owner_id`,
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
  account_id: string,
  ownerCache: Map<string, OwnerMapping>
): Promise<number> {
  if (activities.length === 0) return 0;

  const records = [];
  for (const activity of activities) {
    const ownerMapping = await resolveOwnerMapping(
      supabase,
      accessToken,
      account_id,
      activity.properties.hubspot_owner_id,
      ownerCache
    );

    const metadata: any = {
      hubspot_id: activity.id,
      hubspot_owner_id: ownerMapping.providerUserId,
      owner_email: ownerMapping.providerEmail,
      owner_name: ownerMapping.providerName,
      owner_match_status: ownerMapping.matchStatus,
    };
    if (activityType === "call") {
      metadata.title = activity.properties.hs_call_title;
      metadata.duration = activity.properties.hs_call_duration;
    } else if (activityType === "email") {
      metadata.subject = activity.properties.hs_email_subject;
    } else if (activityType === "meeting") {
      metadata.title = activity.properties.hs_meeting_title;
    } else if (activityType === "task") {
      metadata.subject = activity.properties.hs_task_subject;
    } else if (activityType === "note") {
      metadata.body = activity.properties.hs_note_body;
    }

    records.push({
      account_id: account_id,
      user_id: ownerMapping.occUserId,
      occ_user_id: ownerMapping.occUserId,
      rep_email: ownerMapping.providerEmail,
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
      connection_status: "active",
      last_error: null,
      last_error_at: null,
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
      owners: { fetched: 0, synced: 0 },
      calls: { fetched: 0, synced: 0 },
      emails: { fetched: 0, synced: 0 },
      meetings: { fetched: 0, synced: 0 },
      tasks: { fetched: 0, synced: 0 },
      notes: { fetched: 0, synced: 0 },
    };
    const ownerCache = new Map<string, OwnerMapping>();

    // Discover owners up front so managers can map HubSpot users to OCC reps
    // even before the CRM has meaningful logged activity.
    results.owners.fetched = await syncOwners(supabase, accessToken, account_id, ownerCache);
    results.owners.synced = results.owners.fetched;

    // Sync calls
    const calls = await fetchHubSpotActivities(accessToken, "calls");
    results.calls.fetched = calls.length;
    results.calls.synced = await syncActivities(supabase, calls, "call", accessToken, account_id, ownerCache);

    // Sync emails
    const emails = await fetchHubSpotActivities(accessToken, "emails");
    results.emails.fetched = emails.length;
    results.emails.synced = await syncActivities(supabase, emails, "email", accessToken, account_id, ownerCache);

    // Sync meetings
    const meetings = await fetchHubSpotActivities(accessToken, "meetings");
    results.meetings.fetched = meetings.length;
    results.meetings.synced = await syncActivities(supabase, meetings, "meeting", accessToken, account_id, ownerCache);

    // Sync tasks
    const tasks = await fetchHubSpotActivities(accessToken, "tasks");
    results.tasks.fetched = tasks.length;
    results.tasks.synced = await syncActivities(supabase, tasks, "task", accessToken, account_id, ownerCache);

    // Sync notes
    const notes = await fetchHubSpotActivities(accessToken, "notes");
    results.notes.fetched = notes.length;
    results.notes.synced = await syncActivities(supabase, notes, "note", accessToken, account_id, ownerCache);

    const totalSynced = results.calls.synced + results.emails.synced +
                        results.meetings.synced + results.tasks.synced +
                        results.notes.synced;

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
