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
    const { name, title, company, website } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: Fetch the company website content (if provided)
    let websiteContent = "";
    if (website) {
      try {
        let url = website.trim();
        if (!url.startsWith("http")) url = `https://${url}`;
        const siteResp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; PhaosAI/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        if (siteResp.ok) {
          const html = await siteResp.text();
          // Extract text content from HTML (strip tags, scripts, styles)
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 6000); // Limit to ~6000 chars
          websiteContent = textContent;
        }
      } catch (e) {
        console.log("Website fetch failed (non-fatal):", e);
      }
    }

    // Step 2: Use AI to research the visitor and company
    const researchPrompt = `You are a business intelligence research assistant. Given the following information about a website visitor, produce a concise research brief that a sales AI agent can use to craft a highly personalized, impressive greeting.

VISITOR INFO:
- Name: ${name || "Unknown"}
- Title: ${title || "Unknown"}
- Company: ${company || "Unknown"}
- Company Website: ${website || "Not provided"}

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
      // Return empty research rather than failing entirely
      return new Response(
        JSON.stringify({ success: true, research: `Visitor: ${name}, ${title} at ${company}. No additional research available at this time.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const research = aiData.choices?.[0]?.message?.content || "";

    console.log("Research completed for:", name, "at", company);

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
