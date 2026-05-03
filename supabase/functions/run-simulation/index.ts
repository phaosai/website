// Public sandbox: no auth required. Returns SIMULATED PCI before/after for a scenario.
import { corsHeaders, json, serviceClient } from "../_shared/phaos.ts";

const dragMap: Record<string, number> = {
  "Pre-Earnings": 18,
  "Regime Change": 22,
  "Revenue Miss": 25,
  "Supply Chain Disruption": 16,
  "Macro Stress": 20,
  "Insider Reversal": 28,
  "Custom": 14,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { ticker, theme, scenario, platform } = await req.json();
    if (!scenario) return json({ error: "scenario required" }, 400);
    if (!ticker && !theme) return json({ error: "ticker or theme required" }, 400);

    // Deterministic-ish baseline so same inputs feel stable across calls
    const seed = (ticker || theme || "").toUpperCase().split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const basePci = 70 + (seed % 20); // 70-89
    const drag = dragMap[scenario] ?? 14;
    const simPci = Math.max(10, basePci - drag);

    const svc = serviceClient();
    // TODO(PCI internal tiers): persist internal-tier designation alongside `pci_simulated`
    // once the engineering tier taxonomy is finalized. Public UI must continue to show
    // only the 5 user-facing PCI tiers (Strong/Constructive/Watch/Caution/Stand Aside).
    await svc.from("simulation_runs").insert({
      ticker: ticker?.toUpperCase() ?? null,
      scenario_type: scenario === "Custom" ? "custom" : scenario.toLowerCase().replaceAll(" ", "_"),
      platform_preference: platform ?? null,
      pci_before: basePci,
      pci_simulated: simPci,
      is_public_sandbox: true,
      assumptions: { theme, drag, scenario },
      outputs: { tier: simPci >= 70 ? "constructive" : simPci >= 50 ? "watch" : "caution" },
    });

    return json({
      simulated: true,
      ticker: ticker?.toUpperCase() ?? null,
      theme: theme ?? null,
      scenario,
      platform,
      pci_before: basePci,
      pci_simulated: simPci,
      delta: simPci - basePci,
      categories: ["Insider Activity", "Government & Fundamentals", "Logistics & Supply Chain", "Sentiment", "Macro & Regime"],
      narrative: `Under "${scenario}", composite signals shift downward by ${drag} points. Sources: SEC EDGAR, USAspending, FRED, Form 4.`,
      counter_thesis: "A surprise positive print, fresh insider buying cluster, or supportive macro turn could neutralize the modeled drag.",
      disclaimer: "SIMULATED. Not financial advice. Phaos AI is not a registered investment advisor.",
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
