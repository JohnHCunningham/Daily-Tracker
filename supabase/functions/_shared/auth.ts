import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getAuthorizedAccountContext(req: Request, body?: Record<string, unknown>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: "Missing authorization header", status: 401 as const };
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) {
    let requestBody = body;

    if (!requestBody) {
      try {
        requestBody = await req.clone().json();
      } catch {
        requestBody = {};
      }
    }

    const accountId = requestBody?.account_id;
    if (!accountId || typeof accountId !== "string") {
      return { error: "account_id is required for internal requests", status: 400 as const };
    }

    return {
      internal: true as const,
      accountId,
      role: "service_role",
    };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "User not authenticated", status: 401 as const };
  }

  const { data: userData, error: userDataError } = await supabase
    .from("Users")
    .select("account_id, role")
    .eq("auth_id", user.id)
    .single();

  if (userDataError || !userData?.account_id) {
    return { error: "Account not found", status: 404 as const };
  }

  if (!["admin", "manager"].includes(userData.role)) {
    return { error: "Integration access denied", status: 403 as const };
  }

  return {
    internal: false as const,
    supabase,
    user,
    accountId: userData.account_id as string,
    role: userData.role as string,
  };
}
