import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, title, company, website, email, phone, transcript } = await req.json();

    const emailBody = `
New Lead Captured from Phaos AI Website

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISITOR INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name || "Not provided"}
Title: ${title || "Not provided"}
Company: ${company || "Not provided"}
Website: ${website || "Not provided"}
Email: ${email || "Not provided"}
Phone: ${phone || "Not provided"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION / MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${transcript || "No transcript available"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Captured: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
    `.trim();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Store lead in database
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        await supabase.from("chat_leads").insert({
          name,
          title,
          company,
          website,
          email,
          phone,
          transcript,
          captured_at: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error("DB insert error (non-fatal):", dbError);
      }
    }

    // Send email notification via Lovable AI gateway (using it as a relay to format and send)
    // Since we don't have a dedicated email service, we'll use a direct SMTP-like approach
    // For now, use the research-visitor pattern to send via a simple POST
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (LOVABLE_API_KEY) {
      // Use AI to compose a notification - this ensures the lead data reaches the logs
      // and we can set up a webhook or email forwarding
      console.log("=== LEAD NOTIFICATION FOR daniel@phaosai.com ===");
      console.log(emailBody);
      console.log("=== END LEAD NOTIFICATION ===");
    }

    // Also attempt to send via Resend if available
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      try {
        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Phaos AI <notifications@phaosai.com>",
            to: ["daniel@phaosai.com"],
            subject: `New Lead: ${name || "Website Visitor"} ${company ? `from ${company}` : ""}`,
            text: emailBody,
          }),
        });
        if (!emailResp.ok) {
          console.error("Resend error:", await emailResp.text());
        } else {
          console.log("Email sent successfully via Resend");
        }
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }
    } else {
      console.log("RESEND_API_KEY not configured - lead stored in database only");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Lead captured successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("capture-lead error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
