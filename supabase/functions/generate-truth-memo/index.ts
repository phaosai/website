import { corsHeaders, json, requireUser, serviceClient } from "../_shared/phaos.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function callFn(name: string, body: unknown, authHeader: string) {
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    body: JSON.stringify(body),
  });
  return r.ok ? await r.json() : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return auth.error;
    const { ticker, organization_id } = await req.json();
    if (!ticker) return json({ error: "ticker required" }, 400);
    if (!organization_id) return json({ error: "organization_id required" }, 400);
    const t = ticker.toUpperCase();
    const authHeader = req.headers.get("Authorization")!;

    // Verify the caller has a writer role (owner/admin/reviewer) before any service-role write.
    // is_org_member alone would allow client_viewer/analyst to bypass the reviewer-only RLS insert policy.
    const { data: canWrite, error: roleErr } = await auth.supa.rpc("has_org_role", {
      _org_id: organization_id,
      _roles: ["owner", "admin", "reviewer"],
    });
    if (roleErr || !canWrite) return json({ error: "Forbidden: insufficient org role" }, 403);

    const pci = await callFn("compute-pci-score", { ticker: t, organization_id }, authHeader);
    if (!pci) return json({ error: "PCI compute failed" }, 502);

    const prompt = `You are a financial research analyst writing a Truth Memo for ${t}. PCI: ${pci.pci} (${pci.tier}). Components: ${JSON.stringify(pci.components)}. Sources: ${JSON.stringify(pci.sources)}.

Write a memo with these sections, grounded ONLY in the provided sources. Do NOT recommend buy/sell.
1) Summary (3 sentences)
2) Bull case (3 bullets)
3) Bear case / counter-thesis (3 bullets)
4) Methodology notes (1 paragraph)
Return strict JSON: {"summary":"","bull_case":"","bear_case":"","methodology_notes":""}`;

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!ai.ok) return json({ error: "AI generation failed", status: ai.status }, 502);
    const aiJson = await ai.json();
    let parsed: any = {};
    try { parsed = JSON.parse(aiJson?.choices?.[0]?.message?.content ?? "{}"); } catch { parsed = {}; }

    const svc = serviceClient();
    const { data: memo, error } = await svc.from("truth_memos").insert({
      organization_id,
      user_id: auth.userId,
      content: parsed.summary ?? "",
      bull_case: parsed.bull_case ?? "",
      bear_case: parsed.bear_case ?? "",
      methodology_notes: parsed.methodology_notes ?? "",
      sources: pci.sources,
      status: "draft",
    }).select().single();
    if (error) {
      console.error("truth_memos insert error:", error);
      return json({ error: "Internal server error" }, 500);
    }
    return json({ memo, pci });
  } catch (e) {
    console.error("generate-truth-memo error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
