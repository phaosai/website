// Public sandbox: no auth required. Returns SIMULATED PCI before/after for normalized investor scenarios.
import { corsHeaders, json, serviceClient } from "../_shared/phaos.ts";

type InvestmentType = "stock" | "crypto" | "option";

const favorableScenarios = new Set(["Contract win", "Margin expansion"]);
const severeScenarios = new Set(["Earnings miss", "Guidance cut", "Regulatory action", "Gap down"]);
const optionStressScenarios = new Set(["Time decay", "Volatility expansion", "Liquidity squeeze"]);

const tierLabel = (pci: number) => {
  if (pci >= 96) return "PHAOS CHOICE";
  if (pci >= 90) return "GO";
  if (pci >= 70) return "Potential";
  if (pci >= 51) return "Warning";
  return "NO GO";
};

const evidenceReferences = (investmentType: InvestmentType) => {
  if (investmentType === "crypto") {
    return ["exchange availability and liquidity breadth", "recent attention and volatility behavior"];
  }
  if (investmentType === "option") {
    return ["underlying ticker behavior", "contract sensitivity to volatility and time decay"];
  }
  return ["recent public filing language", "capital-flow and attention changes"];
};

const normalizeScenarioDrag = (scenario: string, investmentType: InvestmentType) => {
  if (favorableScenarios.has(scenario)) return -5;
  if (severeScenarios.has(scenario)) return 9;
  if (investmentType === "option" && optionStressScenarios.has(scenario)) return 10;
  if (optionStressScenarios.has(scenario)) return 7;
  return 5;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { ticker, investmentType = "stock", platforms = [], scenarios = [], contractDetails } = await req.json();
    if (!ticker) return json({ error: "ticker required" }, 400);
    if (!Array.isArray(platforms) || platforms.length === 0) return json({ error: "at least one platform required" }, 400);
    if (!Array.isArray(scenarios) || scenarios.length === 0) return json({ error: "at least one scenario required" }, 400);

    const normalizedType: InvestmentType = ["stock", "crypto", "option"].includes(investmentType) ? investmentType : "stock";
    const symbol = String(ticker).trim().toUpperCase();
    const seedText = `${symbol}|${normalizedType}|${platforms.join("|")}|${scenarios.join("|")}|${contractDetails ?? ""}`;
    const seed = seedText.split("").reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
    const typeBias = normalizedType === "crypto" ? -4 : normalizedType === "option" ? -9 : 3;
    const platformBreadth = Math.min(platforms.length * 2, 8);
    const scenarioDrag = scenarios.reduce((sum: number, scenario: string) => sum + normalizeScenarioDrag(scenario, normalizedType), 0);
    const basePci = Math.max(12, Math.min(98, 62 + (seed % 32) + typeBias + platformBreadth));
    const simPci = Math.max(6, Math.min(100, basePci - scenarioDrag));
    const references = evidenceReferences(normalizedType);

    const svc = serviceClient();
    await svc.from("simulation_runs").insert({
      ticker: symbol,
      scenario_type: "normalized_investor_scenario",
      platform_preference: platforms.join(", "),
      pci_before: basePci,
      pci_simulated: simPci,
      is_public_sandbox: true,
      assumptions: { investmentType: normalizedType, platforms, scenarios, contractDetails, scenarioDrag },
      outputs: {
        tier: tierLabel(simPci),
        evidence_references: references,
        delta: simPci - basePci,
      },
    });

    return json({
      simulated: true,
      ticker: symbol,
      investment_type: normalizedType,
      platforms,
      scenarios,
      pci_before: basePci,
      pci_simulated: simPci,
      tier: tierLabel(simPci),
      delta: simPci - basePci,
      evidence_references: references,
      reasoning: `The modeled scenario set moves ${symbol} from ${basePci} to ${simPci} because the selected pressures change both durability and timing risk at the same time.`,
      next_question: simPci >= 90
        ? "Confirm whether the strongest evidence remains current before treating this as high-conviction research."
        : simPci >= 70
          ? "Watch whether the positive evidence survives the selected stress cases."
          : "Require stronger evidence before relying on this thesis.",
      disclaimer: "SIMULATED. Not financial advice. Phaos AI is not a registered investment advisor.",
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
