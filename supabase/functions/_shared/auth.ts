import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getAuthorizedAccountContext(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: "Missing authorization header", status: 401 as const };
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
    supabase,
    user,
    accountId: userData.account_id as string,
    role: userData.role as string,
  };
}
