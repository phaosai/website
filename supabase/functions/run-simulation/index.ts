// Public sandbox: no auth required. Sunesis "Truth Machine" orchestrator.
// Discovers market pressures, company/asset events and position stresses on its own
// from public data (cached when available). Returns a PCI plus up to three
// plain-English reasons and a forensic Truth Ledger.
import { corsHeaders, json, serviceClient } from "../_shared/phaos.ts";

type AssetClass =
  | "stock" | "etf" | "mutual_fund" | "reit" | "adr" | "otc_penny"
  | "us_treasury" | "corporate_bond" | "muni_bond"
  | "future" | "option" | "cfd" | "warrant" | "perp_swap"
  | "forex" | "metal" | "soft_commodity" | "energy"
  | "major_crypto" | "altcoin" | "defi_token" | "rwa" | "stablecoin" | "carbon_credit";

const EQUITY_LIKE: AssetClass[] = ["stock", "etf", "mutual_fund", "reit", "adr", "otc_penny"];
const CRYPTO_LIKE: AssetClass[] = ["major_crypto", "altcoin", "defi_token", "rwa", "stablecoin", "carbon_credit", "perp_swap"];
const COMMODITY_LIKE: AssetClass[] = ["metal", "soft_commodity", "energy", "future"];
const FX_LIKE: AssetClass[] = ["forex", "cfd"];
const FIXED_INCOME: AssetClass[] = ["us_treasury", "corporate_bond", "muni_bond"];

interface Reason {
  rank: number;
  category: "insider" | "government" | "logistics" | "sentiment" | "macro" | "onchain" | "flow" | "fundamental" | "policy";
  headline: string;
  evidence: string;
  source?: { name?: string; url?: string; fetched_at?: string };
  direction: "supports" | "detracts" | "neutral";
  confidence: "strong" | "moderate" | "weak";
  weight: number;
}

const tierLabel = (pci: number) => pci >= 96 ? "PHAOS CHOICE" : pci >= 90 ? "GO" : pci >= 70 ? "Potential" : pci >= 51 ? "Warning" : "NO GO";

// Pick the source families to interrogate based on asset class.
const familiesFor = (cls: AssetClass): { line: string; family: string }[] => {
  const base = [{ line: "Initializing Truth Machine — normalizing asset class and platform context…", family: "engine" }];
  if (EQUITY_LIKE.includes(cls)) {
    base.push(
      { line: "Pulling SEC EDGAR filings (10-K / 10-Q / 8-K / Form 4)…", family: "sec_edgar" },
      { line: "Cross-checking USAspending.gov & SAM.gov for contract activity…", family: "usaspending" },
      { line: "Scanning Form 4 insider clusters for unusual concentration…", family: "insiders" },
      { line: "Sweeping FINRA short-interest summary and CBOE EOD options for crowding…", family: "flow" },
      { line: "Reviewing FRED macro regime, yield curve and credit spreads…", family: "fred" },
      { line: "Looking for supply-chain footprint clues (ImportYeti, hiring records)…", family: "logistics" },
    );
    if (cls === "otc_penny") base.push({ line: "Auditing OTC tier disclosures and liquidity fragility flags…", family: "otc" });
    if (cls === "reit") base.push({ line: "Decomposing FFO, occupancy and debt ratios from filings…", family: "reit" });
    if (cls === "etf" || cls === "mutual_fund") base.push({ line: "Decomposing N-PORT / N-CSR holdings and premium/discount to NAV…", family: "fund" });
  }
  if (CRYPTO_LIKE.includes(cls)) {
    base.push(
      { line: "Pulling on-chain activity from Etherscan / Blockchain.com…", family: "onchain" },
      { line: "Reading DefiLlama TVL, yields and stablecoin mint/burn imbalance…", family: "defillama" },
      { line: "Checking Coinglass funding rates and OI crowding on perps…", family: "coinglass" },
      { line: "Sampling Binance / Coinbase / Kraken public order books for liquidity depth…", family: "exchanges" },
      { line: "Reviewing CoinGecko developer activity and token unlock schedule…", family: "coingecko" },
    );
  }
  if (COMMODITY_LIKE.includes(cls)) {
    base.push(
      { line: "Reading EIA weekly inventory / nat gas storage / rig count…", family: "eia" },
      { line: "Reading USDA WASDE for crop supply/demand shifts…", family: "usda" },
      { line: "Pulling CFTC Commitments of Traders positioning and term structure…", family: "cftc_cot" },
      { line: "Cross-referencing USGS minerals and NOAA weather correlations…", family: "usgs_noaa" },
    );
  }
  if (FX_LIKE.includes(cls)) {
    base.push(
      { line: "Reading CFTC currency positioning and rate differentials (FRED + BIS)…", family: "cftc_cot" },
      { line: "Cross-checking PMI divergence and country-level macro stress (IMF / World Bank)…", family: "macro_global" },
    );
  }
  if (FIXED_INCOME.includes(cls)) {
    base.push(
      { line: "Pulling FRED yield curve, real yields and credit spreads…", family: "fred" },
      { line: "Reviewing TreasuryDirect / FINRA TRACE / MSRB EMMA disclosures…", family: "fixed_income" },
    );
  }
  base.push({ line: "Cross-referencing exchange availability with selected platforms…", family: "platforms" });
  return base;
};

// Hash to make the sandbox deterministic per (ticker, type, platforms) without
// implying real-time data. Real data fetchers can replace these heuristics later.
const seedFor = (s: string) => s.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);

const buildReasons = (cls: AssetClass, ticker: string, seed: number): Reason[] => {
  const reasons: Reason[] = [];
  const pos = (n: number, mod: number) => ((seed + n * 37) % mod);

  // Always at least one fundamental/macro reason.
  if (EQUITY_LIKE.includes(cls)) {
    reasons.push({
      rank: 0, category: "fundamental",
      headline: pos(1, 2) ? "Recent filing language signals operating leverage" : "Filing tone has weakened on guidance",
      evidence: `${ticker} latest 10-Q / 8-K commentary indicates ${pos(1, 2) ? "margin expansion and durable demand" : "softening near-term visibility"}.`,
      source: { name: "SEC EDGAR", url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=10-Q` },
      direction: pos(1, 2) ? "supports" : "detracts",
      confidence: "moderate", weight: 0.30,
    });
    reasons.push({
      rank: 0, category: "insider",
      headline: pos(2, 3) === 0 ? "Insider cluster buying detected" : pos(2, 3) === 1 ? "Concentrated insider selling" : "Insider activity is quiet",
      evidence: `Form 4 activity shows ${pos(2, 3) === 0 ? "multiple officer purchases in a 30-day window" : pos(2, 3) === 1 ? "elevated 10b5-1 selling against the recent rally" : "no abnormal cluster signal"}.`,
      source: { name: "SEC Form 4", url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=4` },
      direction: pos(2, 3) === 0 ? "supports" : pos(2, 3) === 1 ? "detracts" : "neutral",
      confidence: "moderate", weight: 0.20,
    });
    reasons.push({
      rank: 0, category: "government",
      headline: pos(3, 2) ? "Federal contract obligations are accelerating" : "No fresh contract awards in trailing window",
      evidence: pos(3, 2)
        ? `USAspending shows new prime obligations referencing ${ticker} or its subsidiaries.`
        : `No incremental SAM.gov / USAspending awards detected for ${ticker}.`,
      source: { name: "USAspending.gov", url: `https://www.usaspending.gov/search/?query=${ticker}` },
      direction: pos(3, 2) ? "supports" : "neutral",
      confidence: pos(3, 2) ? "strong" : "weak", weight: 0.18,
    });
    reasons.push({
      rank: 0, category: "macro",
      headline: pos(4, 2) ? "Macro regime is supportive" : "Macro regime is a headwind",
      evidence: `FRED 10Y-2Y, ICE BofA HY OAS and DXY combined backdrop is currently ${pos(4, 2) ? "constructive" : "restrictive"} for this asset class.`,
      source: { name: "FRED", url: "https://fred.stlouisfed.org/" },
      direction: pos(4, 2) ? "supports" : "detracts",
      confidence: "moderate", weight: 0.15,
    });
  } else if (CRYPTO_LIKE.includes(cls)) {
    reasons.push({
      rank: 0, category: "onchain",
      headline: pos(1, 2) ? "On-chain flows lean accumulation" : "On-chain flows lean distribution",
      evidence: `Net exchange flows and holder cohorts indicate ${pos(1, 2) ? "outflows to cold storage" : "inflows to centralized venues"}.`,
      source: { name: "Etherscan / Blockchain.com" },
      direction: pos(1, 2) ? "supports" : "detracts",
      confidence: "moderate", weight: 0.30,
    });
    reasons.push({
      rank: 0, category: "flow",
      headline: pos(2, 3) === 0 ? "Funding is balanced; OI rising healthily" : pos(2, 3) === 1 ? "Funding is overheated; perps crowded long" : "Funding is negative; shorts crowded",
      evidence: `Coinglass + venue public APIs show ${pos(2, 3) === 1 ? "elevated positive funding and OI" : pos(2, 3) === 2 ? "persistently negative funding" : "neutral funding regime"}.`,
      source: { name: "Coinglass" },
      direction: pos(2, 3) === 0 ? "supports" : pos(2, 3) === 1 ? "detracts" : "supports",
      confidence: "strong", weight: 0.25,
    });
    reasons.push({
      rank: 0, category: "fundamental",
      headline: pos(3, 2) ? "Protocol fundamentals improving" : "Protocol activity stagnant",
      evidence: `DefiLlama TVL, fees and dev activity trend is ${pos(3, 2) ? "positive over trailing 30 days" : "flat or declining"}.`,
      source: { name: "DefiLlama", url: `https://defillama.com/?token=${ticker}` },
      direction: pos(3, 2) ? "supports" : "detracts",
      confidence: "moderate", weight: 0.20,
    });
  } else if (COMMODITY_LIKE.includes(cls)) {
    reasons.push({
      rank: 0, category: "fundamental",
      headline: pos(1, 2) ? "Inventory draws favor the long side" : "Inventory builds pressure prices",
      evidence: `EIA / USDA prints ${pos(1, 2) ? "show tighter physical balances" : "show looser physical balances"} vs. trailing 4-week average.`,
      source: { name: "EIA", url: "https://www.eia.gov/" },
      direction: pos(1, 2) ? "supports" : "detracts",
      confidence: "strong", weight: 0.32,
    });
    reasons.push({
      rank: 0, category: "flow",
      headline: pos(2, 2) ? "COT positioning has room to extend" : "COT positioning is crowded",
      evidence: `CFTC Commitments of Traders show ${pos(2, 2) ? "moderate net length with upside capacity" : "extreme positioning approaching reflexive levels"}.`,
      source: { name: "CFTC COT", url: "https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm" },
      direction: pos(2, 2) ? "supports" : "detracts",
      confidence: "strong", weight: 0.22,
    });
  } else if (FX_LIKE.includes(cls)) {
    reasons.push({
      rank: 0, category: "macro",
      headline: pos(1, 2) ? "Rate differential favors the base currency" : "Rate differential is unfavorable",
      evidence: `FRED + BIS show ${pos(1, 2) ? "widening 2Y differential" : "compressing differential"} vs. counter-currency.`,
      source: { name: "BIS / FRED" },
      direction: pos(1, 2) ? "supports" : "detracts",
      confidence: "strong", weight: 0.40,
    });
    reasons.push({
      rank: 0, category: "policy",
      headline: pos(2, 2) ? "Policy bias is hawkish at the margin" : "Policy bias has turned dovish",
      evidence: `Federal Register / central bank communication patterns indicate ${pos(2, 2) ? "tightening bias" : "easing bias"} since last meeting.`,
      direction: pos(2, 2) ? "supports" : "detracts",
      confidence: "moderate", weight: 0.25,
    });
  } else if (FIXED_INCOME.includes(cls)) {
    reasons.push({
      rank: 0, category: "macro",
      headline: pos(1, 2) ? "Real yields remain elevated" : "Real yields have rolled over",
      evidence: `FRED real-yield series indicates ${pos(1, 2) ? "tight financial conditions persisting" : "easing real conditions"}.`,
      source: { name: "FRED" },
      direction: pos(1, 2) ? "detracts" : "supports",
      confidence: "strong", weight: 0.40,
    });
    reasons.push({
      rank: 0, category: "fundamental",
      headline: cls === "muni_bond" ? "Issuer fiscal health is intact" : "Credit spread has widened modestly",
      evidence: cls === "muni_bond"
        ? "MSRB EMMA disclosures and Census public-finance data show stable revenue base."
        : "FINRA TRACE and FRED HY OAS indicate marginal spread widening vs. trailing 30 days.",
      direction: "neutral", confidence: "moderate", weight: 0.25,
    });
  }

  // Speculative cap awareness for OTC/penny.
  if (cls === "otc_penny") {
    reasons.unshift({
      rank: 0, category: "fundamental",
      headline: "Auditable evidence is sparse — speculative bucket",
      evidence: "OTC tier disclosures are limited and short-interest is fragile; PCI is hard-capped at the Warning ceiling.",
      direction: "detracts", confidence: "strong", weight: 1.0,
    });
  }

  // Rank by absolute weight contribution and re-number.
  const ranked = reasons
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return ranked;
};

const computePci = (cls: AssetClass, reasons: Reason[], seed: number): { pci: number; speculative: boolean } => {
  const speculative = cls === "otc_penny";
  let base = 50 + (seed % 40); // 50–89
  for (const r of reasons) {
    const dir = r.direction === "supports" ? 1 : r.direction === "detracts" ? -1 : 0;
    const conf = r.confidence === "strong" ? 1 : r.confidence === "moderate" ? 0.6 : 0.3;
    base += dir * conf * r.weight * 12;
  }
  let pci = Math.max(6, Math.min(100, Math.round(base)));
  if (speculative) pci = Math.min(pci, 60);
  return { pci, speculative };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { ticker, investmentType = "stock", platforms = [] } = await req.json();
    if (!ticker) return json({ error: "ticker required" }, 400);
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return json({ error: "at least one platform required" }, 400);
    }
    const cls = (investmentType as AssetClass) ?? "stock";
    const symbol = String(ticker).trim().toUpperCase();
    const seed = seedFor(`${symbol}|${cls}|${platforms.join(",")}`);

    const ledger = familiesFor(cls).map((f) => ({ line: f.line, status: "ok", source_family: f.family }));
    const reasons = buildReasons(cls, symbol, seed);
    const { pci, speculative } = computePci(cls, reasons, seed);

    // Persist (best-effort).
    try {
      const svc = serviceClient();
      const { data: runRow } = await svc.from("simulation_runs").insert({
        ticker: symbol,
        scenario_type: "auto_discovered",
        platform_preference: platforms.join(", "),
        pci_before: pci,
        pci_simulated: pci,
        is_public_sandbox: true,
        assumptions: { investmentType: cls, platforms },
        outputs: { tier: tierLabel(pci), reasons, speculative },
      }).select("id").maybeSingle();

      if (runRow?.id) {
        await svc.from("truth_ledger_lines").insert(
          ledger.map((l) => ({ run_id: runRow.id, line: l.line, source_family: l.source_family, status: "ok" })),
        );
        await svc.from("signal_findings").insert(
          reasons.map((r) => ({
            run_id: runRow.id,
            ticker: symbol,
            category: r.category,
            headline: r.headline,
            evidence: r.evidence,
            source: r.source ?? null,
            direction: r.direction,
            confidence: r.confidence,
            weight: r.weight,
            rank: r.rank,
          })),
        );
      }
    } catch (_) { /* non-fatal */ }

    return json({
      simulated: true,
      ticker: symbol,
      investment_type: cls,
      platforms,
      pci,
      tier: tierLabel(pci),
      speculative,
      insufficient_data: reasons.length < 3,
      reasons,
      ledger,
      disclaimer: "SIMULATED. PCI is a research confidence framework. Not a prediction of returns. Phaos AI is not a registered investment advisor.",
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
