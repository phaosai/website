import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, EmptyCard, Disclaimer } from "@/components/app/PageShell";

const FALLBACK_THEMES = [
  { theme_name: "AI Infrastructure: Picks & Shovels", narrative: "Compute, networking, and power buildout supporting AI workloads.", signal_strength: "strong" },
  { theme_name: "Government Contract Momentum Leaders", narrative: "Companies showing accelerating federal contract awards.", signal_strength: "moderate" },
  { theme_name: "Insider Conviction Clusters", narrative: "Multi-officer Form 4 buying clusters above historical baselines.", signal_strength: "moderate" },
  { theme_name: "Supply Chain Disruption Leaders", narrative: "Logistics & shipping signals indicating near-term margin shifts.", signal_strength: "developing" },
];

export default function SunesisThemes() {
  const [themes, setThemes] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("investment_themes").select("*").order("updated_at", { ascending: false });
      setThemes(data ?? []);
    })();
  }, []);

  const list = themes.length ? themes : FALLBACK_THEMES;

  return (
    <PageShell title="Investment Themes" description="Cross-signal narratives generated from clustered evidence." minTier="sunesis">
      <Disclaimer>
        Investment themes are research frameworks, not buy recommendations. Historical examples do not predict future performance.
      </Disclaimer>
      {list.length === 0 ? (
        <EmptyCard>No active themes yet.</EmptyCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((t: any, i: number) => (
            <article key={t.id ?? i} className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
              <header className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{t.theme_name}</h3>
                {t.is_historical_example && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">HISTORICAL EXAMPLE</span>
                )}
              </header>
              <p className="text-sm text-muted-foreground">{t.narrative}</p>
              <div className="text-xs flex flex-wrap gap-3">
                <span className="text-muted-foreground">Signal: <span className="text-foreground capitalize">{t.signal_strength ?? "—"}</span></span>
                {Array.isArray(t.contributing_tickers) && t.contributing_tickers.length > 0 && (
                  <span className="text-muted-foreground">Tickers: <span className="font-mono text-foreground">{t.contributing_tickers.slice(0, 5).join(", ")}</span></span>
                )}
              </div>
              <details className="group">
                <summary className="cursor-pointer text-xs flex items-center gap-1.5 text-purple-deep">
                  <ChevronDown className="w-3 h-3 group-open:rotate-180 transition" /> What could break this theme
                </summary>
                <p className="mt-2 text-xs text-muted-foreground">{t.counter_thesis ?? "Macro regime shift, sustained interest-rate change, or sector rotation could weaken this thesis."}</p>
              </details>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
