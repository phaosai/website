import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { isFeatureEnabled, killSwitchResponse, logSecurityEvent, getClientIp, hashIp } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tier 4c: bot defenses
const HONEYPOT_FIELD = "hp_field";       // hidden form field — bots fill anything visible
const MIN_SUBMIT_MS = 1500;              // bots submit instantly; humans take >1.5s

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Kill-switch (Tier 4b)
  if (!(await isFeatureEnabled("lead_capture_enabled"))) {
    return killSwitchResponse(corsHeaders, "lead_capture_enabled");
  }

  const ip = getClientIp(req);
  const ipHash = await hashIp(ip, "capture-lead");

  try {
    const body = await req.json();

    // Bot trap: any value in honeypot OR submit faster than threshold = silent 200
    const hp = typeof body[HONEYPOT_FIELD] === "string" ? body[HONEYPOT_FIELD].trim() : "";
    const renderedAtRaw = body.rendered_at;
    const renderedAt = typeof renderedAtRaw === "number" ? renderedAtRaw : Number(renderedAtRaw);
    const elapsed = Number.isFinite(renderedAt) ? Date.now() - renderedAt : Infinity;

    if (hp || elapsed < MIN_SUBMIT_MS) {
      await logSecurityEvent({
        event_type: "bot_detected",
        severity: "warn",
        source: "capture-lead",
        metadata: {
          honeypot_filled: Boolean(hp),
          elapsed_ms: Number.isFinite(elapsed) ? elapsed : null,
        },
        ip_hash: ipHash,
      });
      // Silent success — never tell bots they were detected
      return new Response(
        JSON.stringify({ success: true, message: "Lead captured successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation
    const sanitize = (v: unknown, maxLen = 500): string | undefined => {
      if (typeof v !== "string") return undefined;
      return v.trim().slice(0, maxLen) || undefined;
    };

    const name = sanitize(body.name, 255);
    const title = sanitize(body.title, 255);
    const company = sanitize(body.company, 255);
    const website = sanitize(body.website, 500);
    const email = sanitize(body.email, 255);
    const phone = sanitize(body.phone, 50);
    const transcript = sanitize(body.transcript, 5000);

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

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Forward to canonical hub (voice.phaosai.com) for cross-app lead unification
    const hubUrl = Deno.env.get("PHAOS_HUB_FUNCTIONS_URL");
    const hubSecret = Deno.env.get("PHAOS_PLATFORM_SYNC_SECRET");
    if (hubUrl && hubSecret && (email || phone || name)) {
      try {
        await fetch(`${hubUrl.replace(/\/$/, "")}/platform-hub/lead`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-phaos-platform-secret": hubSecret,
          },
          body: JSON.stringify({
            source_app_id: "phaos-visionary-site",
            email,
            phone,
            name,
            company,
            payload: { title, website, transcript },
          }),
        });
      } catch (hubErr) {
        console.error("Hub lead forward error (non-fatal):", hubErr);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      console.log("=== LEAD NOTIFICATION FOR daniel@phaosai.com ===");
      console.log(emailBody);
      console.log("=== END LEAD NOTIFICATION ===");
    }

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
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
