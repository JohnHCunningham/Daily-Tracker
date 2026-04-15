import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEmbedding } from "../_shared/rag-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface CoachingEmailRequest {
  coaching_message_id: string;
  to_email: string;
  rep_name: string;
  subject: string;
  coaching_content: string;
  manager_name: string;
  manager_email: string;
  methodology?: string;
}

// Generate HTML email template
function generateEmailHTML(data: CoachingEmailRequest, replyToken: string): string {
  // Use dashboard URL instead of function URL to avoid security warnings
  const dashboardUrl = Deno.env.get("DASHBOARD_URL") || "https://oneclickcoaching.com/app/dashboard";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0C1030, #1a2550); padding: 30px; text-align: center; }
    .header h1 { color: #10C3B0; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.8); margin: 10px 0 0; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
    .coaching-box { background: #f8fafc; border-left: 4px solid #10C3B0; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0; white-space: pre-wrap; line-height: 1.7; color: #444; }
    .methodology-badge { display: inline-block; background: #F4B03A; color: #0C1030; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; margin-bottom: 15px; }
    .reply-section { background: linear-gradient(135deg, #10C3B0, #3DE0D2); padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; }
    .reply-section h3 { color: white; margin: 0 0 10px; }
    .reply-section p { color: rgba(255,255,255,0.9); margin: 0; font-size: 14px; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #666; font-size: 13px; }
    .footer a { color: #10C3B0; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>One Click Coaching</h1>
      <p>Coaching Feedback</p>
    </div>
    <div class="content">
      <p class="greeting">Hi ${data.rep_name},</p>
      <p>Your manager, <strong>${data.manager_name}</strong>, has sent you personalized coaching feedback:</p>

      ${data.methodology ? `<div class="methodology-badge">${data.methodology} Methodology</div>` : ''}

      <div class="coaching-box">${escapeHtml(data.coaching_content)}</div>

      <div class="reply-section">
        <h3>Have Questions or Feedback?</h3>
        <p>Simply reply to this email and your response will be delivered to ${data.manager_name}.</p>
        <p style="margin-top: 10px;">Or log into your dashboard to view all coaching messages and track your progress.</p>
      </div>
    </div>
    <div class="footer">
      <p>Powered by <a href="https://oneclickcoaching.com">One Click Coaching</a></p>
    </div>
  </div>
</body>
</html>`;
}

// Generate plain text version
function generateEmailText(data: CoachingEmailRequest): string {
  return `
Hi ${data.rep_name},

Your manager, ${data.manager_name}, has sent you personalized coaching feedback:

${data.methodology ? `[${data.methodology} Methodology]\n\n` : ''}${data.coaching_content}

---

Have questions? Reply to this email and your response will be delivered to ${data.manager_name}'s dashboard.

---
One Click Coaching
`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

// Generate a unique reply token
function generateReplyToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const body: CoachingEmailRequest = await req.json();

    // Only coaching_message_id is required — everything else is resolved from the DB
    if (!body.coaching_message_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: coaching_message_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up coaching message — this is the source of truth for all fields
    const { data: coachingMsg, error: msgError } = await supabase
      .from("Coaching_Messages")
      .select("account_id, manager_edited, coaching_content, rep_email, manager_email, methodology, subject, call_id, coaching_lens, from_user_id")
      .eq("id", body.coaching_message_id)
      .single();

    if (msgError || !coachingMsg) {
      return new Response(
        JSON.stringify({ error: "Coaching message not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve fields: prefer DB values, fall back to request body
    const toEmail = body.to_email || coachingMsg.rep_email;
    const coachingContent = body.coaching_content || coachingMsg.coaching_content;
    const subject = body.subject || coachingMsg.subject || "Coaching Feedback from Your Manager";
    const methodology = body.methodology || coachingMsg.methodology;
    const managerEmail = body.manager_email || coachingMsg.manager_email;
    const accountId = coachingMsg.account_id;

    // Look up manager name from from_user_id if not provided in request
    let managerName = body.manager_name || "";
    let repName = body.rep_name || "";
    if (!managerName && coachingMsg.from_user_id) {
      const { data: managerUser } = await supabase
        .from("Users")
        .select("full_name, first_name, email")
        .eq("id", coachingMsg.from_user_id)
        .single();
      managerName = managerUser?.full_name || managerUser?.first_name || managerUser?.email?.split("@")[0] || "Your Manager";
    }
    if (!repName && toEmail) {
      repName = toEmail.split("@")[0].replace(/[._]/g, " ");
    }

    if (!toEmail || !coachingContent) {
      return new Response(
        JSON.stringify({ error: "Cannot resolve to_email or coaching_content from message or request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rebuild body with resolved values for downstream use (email template)
    body.to_email = toEmail;
    body.coaching_content = coachingContent;
    body.subject = subject;
    body.methodology = methodology;
    body.manager_email = managerEmail;
    body.manager_name = managerName;
    body.rep_name = repName;

    // Generate reply token
    const replyToken = generateReplyToken();

    // Update coaching message with reply token and sent status
    const { error: updateError } = await supabase
      .from("Coaching_Messages")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        reply_token: replyToken,
      })
      .eq("id", body.coaching_message_id);

    if (updateError) {
      console.error("Error updating coaching message:", updateError);
    }

    // Check if Resend API key is configured
    if (!RESEND_API_KEY) {
      // Development mode - just log and return success
      console.log("=== EMAIL WOULD BE SENT (DEV MODE) ===");
      console.log("To:", body.to_email);
      console.log("Subject:", body.subject);
      console.log("Reply Token:", replyToken);
      console.log("Content:", body.coaching_content.substring(0, 200) + "...");

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email queued (development mode - Resend API key not configured)",
          coaching_message_id: body.coaching_message_id,
          dev_mode: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use custom domain if verified, otherwise use Resend's test domain
    const fromDomain = Deno.env.get("RESEND_DOMAIN");
    const fromEmail = fromDomain
      ? `One Click Coaching <coaching@${fromDomain}>`
      : "One Click Coaching <onboarding@resend.dev>";

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [body.to_email],
        subject: body.subject || "Coaching Feedback from Your Manager",
        html: generateEmailHTML(body, replyToken),
        text: generateEmailText(body),
        reply_to: body.manager_email,
        headers: {
          "X-Coaching-Message-ID": body.coaching_message_id,
          "X-Reply-Token": replyToken,
        },
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);

      // Update message status to failed
      await supabase
        .from("Coaching_Messages")
        .update({
          status: "failed",
          last_error: errorText,
        })
        .eq("id", body.coaching_message_id);

      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResult = await emailResponse.json();

    // Log successful send
    await supabase.from("Integration_Sync_Log").insert({
      account_id: accountId,
      provider: "resend",
      sync_status: "completed",
      activities_synced: 1,
      sync_completed_at: new Date().toISOString(),
    });

    // Store all sent coaching in RAG knowledge base.
    // Every sent message is manager-approved (they clicked "Approve & Send"),
    // so it's a quality signal worth indexing — whether or not they edited it.
    if (coachingMsg?.coaching_content) {
      try {
        // Extract weak components from the call's methodology scores
        let weakComponents: string[] = [];
        if (coachingMsg.call_id) {
          const { data: callData } = await supabase
            .from("Synced_Conversations")
            .select("methodology_scores")
            .eq("id", coachingMsg.call_id)
            .single();

          if (callData?.methodology_scores) {
            weakComponents = Object.entries(callData.methodology_scores)
              .filter(([_, score]) => (score as number) < 7)
              .map(([name]) => name.toUpperCase().replace(/[\s&]+/g, "_"));
          }
        }

        const chunkText = coachingMsg.coaching_content.substring(0, 5000);
        const wasEdited = coachingMsg.manager_edited === true;
        const lens = coachingMsg.coaching_lens || null;

        // Generate embedding so this entry is findable via RAG semantic search
        let embedding = null;
        if (OPENAI_API_KEY) {
          try {
            const embeddingResult = await generateEmbedding(chunkText, supabase, OPENAI_API_KEY);
            embedding = embeddingResult.embedding;
          } catch (embErr) {
            console.warn("Failed to generate embedding for sent coaching:", embErr);
          }
        }

        // Skip RAG insert if we couldn't generate an embedding — an entry
        // without an embedding is unsearchable and just noise.
        if (embedding) {
          // Build situation tags: always include coaching + manager_approved,
          // plus manager_edited if edited, plus the lens style if known.
          const situationTags = ["coaching", "manager_approved"];
          if (wasEdited) situationTags.push("manager_edited");
          if (lens) situationTags.push(`lens:${lens}`);

          await supabase.from("Sandler_Knowledge_Base").insert({
            content_type: "manager_approved",
            component_name: weakComponents[0] || "GENERAL",
            chunk_title: `${wasEdited ? "Manager-edited" : "Manager-approved"} coaching for ${coachingMsg.rep_email || "rep"}`,
            chunk_text: chunkText,
            situation_tags: situationTags,
            weakness_tags: weakComponents.slice(0, 5),
            source_coaching_message_id: body.coaching_message_id,
            embedding,
            is_active: true,
          });
        } else {
          console.warn("Skipping RAG insert — no embedding generated");
        }
      } catch (ragError) {
        // Non-critical — log but don't fail the send
        console.warn("Failed to store coaching in RAG:", ragError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Coaching email sent successfully",
        coaching_message_id: body.coaching_message_id,
        email_id: emailResult.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Send coaching email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
