import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// SSRF protection: block private/link-local/loopback ranges and metadata endpoints.
function isBlockedIp(host: string): boolean {
  // IPv6 loopback / unspecified / link-local / unique-local
  if (host === "::1" || host === "::" || host.startsWith("[")) {
    const stripped = host.replace(/^\[|\]$/g, "").toLowerCase();
    if (stripped === "::1" || stripped === "::") return true;
    if (stripped.startsWith("fe80:") || stripped.startsWith("fc") || stripped.startsWith("fd")) return true;
  }
  // IPv4 dotted
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 10) return true;                              // 10.0.0.0/8
    if (a === 127) return true;                             // loopback
    if (a === 0) return true;                               // 0.0.0.0/8
    if (a === 169 && b === 254) return true;                // link-local (incl. metadata 169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true;       // 172.16.0.0/12
    if (a === 192 && b === 168) return true;                // 192.168.0.0/16
    if (a >= 224) return true;                              // multicast / reserved
  }
  return false;
}

function isSafeHostname(host: string): boolean {
  const lower = host.toLowerCase();
  // Block common internal/metadata hostnames
  const blockedHosts = ["localhost", "metadata.google.internal", "metadata", "instance-data"];
  if (blockedHosts.includes(lower)) return false;
  if (lower.endsWith(".internal") || lower.endsWith(".local")) return false;
  if (isBlockedIp(lower)) return false;
  return true;
}

function validateAndNormalizeUrl(input: string): string | null {
  let raw = input.trim();
  if (!raw) return null;
  if (raw.length > 2048) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  // Only allow https (and http for non-blocked public hosts? Keep https-only for safety)
  if (parsed.protocol !== "https:") return null;
  if (!isSafeHostname(parsed.hostname)) return null;
  return parsed.toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, title, company, website } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: Fetch the company website content (if provided and safe)
    let websiteContent = "";
    let safeWebsite: string | null = null;
    if (website && typeof website === "string") {
      safeWebsite = validateAndNormalizeUrl(website);
      if (safeWebsite) {
        try {
          const siteResp = await fetch(safeWebsite, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; PhaosAI/1.0)" },
            signal: AbortSignal.timeout(8000),
            redirect: "manual", // prevent redirect-based SSRF bypass
          });
          if (siteResp.ok) {
            const html = await siteResp.text();
            const textContent = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 6000);
            websiteContent = textContent;
          }
        } catch (e) {
          console.log("Website fetch failed (non-fatal):", e);
        }
      } else {
        console.log("Website URL rejected by SSRF guard");
      }
    }

    // Sanitize visitor inputs for prompt
    const safe = (v: unknown, n = 200) =>
      typeof v === "string" ? v.trim().slice(0, n) : "";
    const sName = safe(name);
    const sTitle = safe(title);
    const sCompany = safe(company);

    const researchPrompt = `You are a business intelligence research assistant. Given the following information about a website visitor, produce a concise research brief that a sales AI agent can use to craft a highly personalized, impressive greeting.

VISITOR INFO:
- Name: ${sName || "Unknown"}
- Title: ${sTitle || "Unknown"}
- Company: ${sCompany || "Unknown"}
- Company Website: ${safeWebsite || "Not provided"}

${websiteContent ? `COMPANY WEBSITE CONTENT (scraped):\n${websiteContent}\n` : ""}

RESEARCH TASKS — Produce findings for each:
1. **Company Overview**: What does this company do? What industry? How large? Key products/services?
2. **Recent News & Events**: Any recent mergers, acquisitions, funding rounds, product launches, leadership changes, awards, or press releases? Any significant recent developments?
3. **Industry Context**: What challenges does their industry face right now? What trends are relevant?
4. **Visitor's Role**: Based on their title, what are their likely priorities, pain points, and responsibilities?
5. **Phaos AI Relevance**: How specifically could Phaos AI's voice agents and workflow automation help THIS company and THIS person? Be specific to their industry and role.
6. **Personalization Hooks**: Any specific details that would impress them — e.g., their company tagline, recent blog posts, specific services they offer, their competitive landscape.

RULES:
- Only include facts you are confident about. Do NOT fabricate or guess.
- If you can't find reliable info about something, say "No verified data available" for that section.
- Be concise — this is for an AI to use, not a human report.
- Focus on actionable insights that make the greeting feel genuinely researched and personalized.

Output format: Plain text brief, organized by the sections above.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "user", content: researchPrompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI research failed:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ success: true, research: `Visitor: ${sName}, ${sTitle} at ${sCompany}. No additional research available at this time.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const research = aiData.choices?.[0]?.message?.content || "";

    console.log("Research completed for:", sName, "at", sCompany);

    return new Response(
      JSON.stringify({ success: true, research }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("research-visitor error:", e);
    return new Response(
      JSON.stringify({
        success: true,
        research: "Research unavailable. Proceed with basic visitor information."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
