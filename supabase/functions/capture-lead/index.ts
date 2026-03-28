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

    // Build email content
    const emailBody = `
New Lead Captured from Phaos AI Website Chat

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
CONVERSATION TRANSCRIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${transcript || "No transcript available"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This lead was captured on ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
via the Phaos AI website chat agent.
    `.trim();

    // Send via Supabase/Resend or fallback to logging
    // For now, we'll use the Supabase edge function to send an email notification
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Store lead in database if available
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

    // Log the lead for now (email delivery will be set up with email infrastructure)
    console.log("=== NEW LEAD CAPTURED (daniel@phaosai.com) ===");
    console.log(emailBody);
    console.log("=========================");

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
