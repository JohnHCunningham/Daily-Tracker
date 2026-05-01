import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const accountId = body.account_id;

    let accountIds: string[] = [];

    if (accountId) {
      accountIds = [accountId];
    } else {
      // Process all active accounts
      const { data: accounts } = await supabase
        .from("Accounts")
        .select("id")
        .or("status.eq.active,status.is.null");

      if (accounts) {
        accountIds = accounts.map((a: { id: string }) => a.id);
      }
    }

    let totalNew = 0;

    for (const accId of accountIds) {
      // Call the detect_milestones SQL function
      const { data, error } = await supabase.rpc("detect_milestones", {
        p_account_id: accId,
      });

      if (error) {
        console.error(
          `[detect-milestones] Error for account ${accId}:`,
          error.message
        );
        continue;
      }

      const newCount = data ?? 0;
      totalNew += newCount;

      if (newCount > 0) {
        console.log(
          `[detect-milestones] Account ${accId}: ${newCount} new milestones detected`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        accounts_processed: accountIds.length,
        new_milestones: totalNew,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("[detect-milestones] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
