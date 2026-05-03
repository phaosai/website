import { useEffect, useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, EmptyCard, Disclaimer } from "@/components/app/PageShell";
import { FeatureStatusBadge, SignalCategoryBadge, type SignalCategory } from "@/components/phaos";
import { Button } from "@/components/ui/button";

type SeedTheme = {
  theme_name: string;
  narrative: string;
  signal_strength: "strong" | "moderate" | "developing";
  source_categories: SignalCategory[];
  contributing_tickers: { ticker: string; pci: number }[];
  pci_range: [number, number];
  counter_thesis: string;
  is_historical_example?: boolean;
  historical_disclaimer?: string;
  historical_note?: string;
};

const SEED_THEMES: SeedTheme[] = [
  {
    theme_name: "AI Infrastructure: Picks & Shovels",
    narrative:
      "As AI model development matures, the infrastructure enabling it — memory chips, flash storage, liquid cooling, and power generation — becomes the critical constraint. Companies solving the physical bottlenecks of AI data centers often move before the AI software names.",
    signal_strength: "strong",
    source_categories: ["Logistics & Supply Chain", "Government & Fundamentals", "Insider Activity"],
    contributing_tickers: [
      { ticker: "SNDK", pci: 88 },
      { ticker: "WDC", pci: 84 },
      { ticker: "MU", pci: 81 },
      { ticker: "VRT", pci: 76 },
      { ticker: "ETN", pci: 72 },
    ],
    pci_range: [72, 92],
    counter_thesis:
      "AI efficiency improvements reduce hardware requirements per model; enterprise data center capex could slow if AI ROI disappoints.",
    is_historical_example: true,
    historical_note:
      "In 2025, SanDisk (+559%), Western Digital (+306%), and Micron (+240%) all fit this theme pattern — memory and storage companies riding the AI infrastructure supercycle.",
    historical_disclaimer: "Historical illustration only. Not a prediction of future returns.",
  },
  {
    theme_name: "Government Contract Momentum Leaders",
    narrative:
      "When federal agencies concentrate contract awards in a sector or with specific companies, it often precedes revenue acceleration. USAspending.gov data provides real-time visibility into these award patterns before they show up in quarterly earnings.",
    signal_strength: "moderate",
    source_categories: ["Government & Fundamentals"],
    contributing_tickers: [
      { ticker: "PLTR", pci: 78 },
      { ticker: "LDOS", pci: 71 },
      { ticker: "BAH", pci: 69 },
      { ticker: "CACI", pci: 66 },
    ],
    pci_range: [64, 81],
    counter_thesis:
      "Government contracts can be delayed, cancelled, or redistributed; continuing resolution budgets create uncertainty.",
  },
  {
    theme_name: "Insider Conviction Clusters",
    narrative:
      "When multiple insiders across related companies buy simultaneously, it signals a confidence pattern worth investigating. SEC Form 4 data provides a near real-time view of where people with direct knowledge are putting their own money.",
    signal_strength: "moderate",
    source_categories: ["Insider Activity"],
    contributing_tickers: [
      { ticker: "META", pci: 82 },
      { ticker: "GE", pci: 75 },
      { ticker: "DKS", pci: 70 },
    ],
    pci_range: [68, 86],
    counter_thesis:
      "Insiders can be wrong; insider buying often precedes extended sideways price action before any move.",
  },
  {
    theme_name: "Supply Chain Disruption Leaders",
    narrative:
      "Companies positioned to benefit from supply chain disruptions — either as alternative suppliers or as solutions providers — often show logistics signal anomalies before mainstream analysis catches them.",
    signal_strength: "developing",
    source_categories: ["Logistics & Supply Chain", "Government & Fundamentals"],
    contributing_tickers: [
      { ticker: "FLEX", pci: 67 },
      { ticker: "JBL", pci: 64 },
      { ticker: "EXPD", pci: 61 },
    ],
    pci_range: [58, 72],
    counter_thesis:
      "Disruptions can resolve faster than expected; beneficiaries can become casualties when supply normalizes.",
  },
];

function pciColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-500";
}

function strengthLabel(s: string) {
  if (s === "strong") return { label: "Strong", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" };
  if (s === "moderate") return { label: "Moderate", color: "border-amber-500/40 bg-amber-500/10 text-amber-500" };
  return { label: "Developing", color: "border-border bg-muted/40 text-muted-foreground" };
}

export default function SunesisThemes() {
  const [dbThemes, setDbThemes] = useState<any[]>([]);
  const [openCounter, setOpenCounter] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("investment_themes").select("*").order("updated_at", { ascending: false });
      setDbThemes(data ?? []);
    })();
  }, []);

  // Merge seeds + db. DB themes take precedence by name.
  const dbNames = new Set(dbThemes.map((t) => t.theme_name));
  const merged: any[] = [
    ...dbThemes,
    ...SEED_THEMES.filter((s) => !dbNames.has(s.theme_name)),
  ];

  return (
    <PageShell
      title="Investment Themes"
      description="Cross-signal narratives generated from clustered evidence across 60+ public sources."
      minTier="sunesis"
    >
      <Disclaimer>
        Investment themes are research frameworks, not buy recommendations. Historical examples do
        not predict future performance.
      </Disclaimer>

      {merged.length === 0 ? (
        <EmptyCard>No active themes yet.</EmptyCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {merged.map((t: any, i: number) => {
            const key = t.id ?? t.theme_name ?? String(i);
            const tickers: { ticker: string; pci: number }[] = Array.isArray(t.contributing_tickers)
              ? (typeof t.contributing_tickers[0] === "string"
                  ? (t.contributing_tickers as string[]).map((tk) => ({ ticker: tk, pci: 0 }))
                  : t.contributing_tickers)
              : [];
            const cats: SignalCategory[] = Array.isArray(t.source_categories) ? t.source_categories : [];
            const pciRange: [number, number] | undefined = t.pci_range;
            const strength = strengthLabel(t.signal_strength ?? "developing");
            const isOpen = openCounter[key];

            return (
              <article key={key} className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
                <header className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold tracking-tight">{t.theme_name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.is_historical_example && <FeatureStatusBadge status="HISTORICAL EXAMPLE" />}
                      <span
                        className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${strength.color}`}
                      >
                        {strength.label}
                      </span>
                    </div>
                  </div>
                  {pciRange && (
                    <p className="text-xs text-muted-foreground">
                      PCI range across contributing tickers:{" "}
                      <span className="text-foreground font-medium">
                        {pciRange[0]}–{pciRange[1]}
                      </span>
                    </p>
                  )}
                </header>

                <p className="text-sm leading-relaxed text-foreground/85">{t.narrative}</p>

                {tickers.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      Top contributing tickers
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tickers.slice(0, 5).map((tk) => (
                        <Link
                          key={tk.ticker}
                          to={`/app/sunesis/${tk.ticker}`}
                          className="inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs hover:bg-card transition-colors"
                        >
                          <span className="font-mono font-semibold">{tk.ticker}</span>
                          {tk.pci > 0 && (
                            <span className={`tabular-nums font-semibold ${pciColor(tk.pci)}`}>{tk.pci}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {cats.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      Source categories driving this theme
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cats.map((c) => (
                        <SignalCategoryBadge key={c} category={c} />
                      ))}
                    </div>
                  </div>
                )}

                {t.is_historical_example && t.historical_note && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-xs text-foreground/85 leading-relaxed">{t.historical_note}</p>
                    <p className="mt-2 text-[11px] italic text-muted-foreground">
                      {t.historical_disclaimer ??
                        "Historical illustration only. Not a prediction of future returns."}
                    </p>
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => setOpenCounter((s) => ({ ...s, [key]: !s[key] }))}
                    aria-expanded={!!isOpen}
                    className="text-xs flex items-center gap-1.5 text-purple-deep hover:underline"
                  >
                    <ChevronDown className={`w-3 h-3 transition ${isOpen ? "rotate-180" : ""}`} />
                    What Could Break This Theme
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {t.counter_thesis ??
                        "Macro regime shift, sustained interest-rate change, or sector rotation could weaken this thesis."}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    Last updated: {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : "—"}
                  </span>
                  <Link to="/app/sunesis">
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      Explore Tickers in This Theme <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
