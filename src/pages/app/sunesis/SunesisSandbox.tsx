import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageShell, Disclaimer } from "@/components/app/PageShell";
import {
  SunesisModuleNav,
  EarningsGapPanel,
  VolRegimePanel,
  MacroShockPanel,
  ThemeBreakageSimulator,
  HistoricalAnalogMapper,
} from "@/components/phaos";
import type { SandboxMode } from "@/lib/researchLinks";
import { cn } from "@/lib/utils";

const MODES: { id: SandboxMode; label: string; sub: string }[] = [
  { id: "earnings-gap",      label: "Earnings Gap",       sub: "IV vs realized vol context" },
  { id: "vol-regime",        label: "Vol Regime",         sub: "Quiet ↔ Explosive" },
  { id: "macro-shock",       label: "Macro Shock",        sub: "Cross-theme exposure" },
  { id: "theme-breakage",    label: "Theme Breakage",     sub: "Counter-thesis stress" },
  { id: "historical-analog", label: "Historical Analog",  sub: "Heuristic mapping" },
];

function isMode(v: string | null): v is SandboxMode {
  return !!v && MODES.some((m) => m.id === v);
}

export default function SunesisSandbox() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("mode");
  const themeParam = params.get("theme") ?? undefined;
  const tickerParam = params.get("ticker") ?? undefined;

  const [mode, setMode] = useState<SandboxMode>(isMode(initial) ? initial : "earnings-gap");

  const select = (m: SandboxMode) => {
    setMode(m);
    const next = new URLSearchParams(params);
    next.set("mode", m);
    setParams(next, { replace: true });
  };

  const body = useMemo(() => {
    switch (mode) {
      case "earnings-gap":      return <EarningsGapPanel ticker={tickerParam} pci={null} />;
      case "vol-regime":        return <VolRegimePanel ticker={tickerParam} pci={null} />;
      case "macro-shock":       return <MacroShockPanel ticker={tickerParam} pci={null} />;
      case "theme-breakage":    return <ThemeBreakageSimulator initialThemeId={themeParam} />;
      case "historical-analog": return <HistoricalAnalogMapper initialThemeId={themeParam} />;
    }
  }, [mode, themeParam, tickerParam]);

  return (
    <PageShell
      title="Scenario Sandbox"
      description="Five research modes to stress-test conviction. Outputs are SIMULATED ranges, not predictions."
      minTier="sunesis"
    >
      <SunesisModuleNav />

      <div className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 inline-flex text-[10px] font-semibold uppercase tracking-wider text-amber-300">
        Simulated · research framework only
      </div>

      <nav className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => select(m.id)}
            className={cn(
              "rounded-md border px-3 py-2 text-left transition-colors",
              mode === m.id
                ? "border-purple-deep/60 bg-purple-deep/10 text-foreground"
                : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
            )}
          >
            <p className="text-xs font-semibold">{m.label}</p>
            <p className="text-[10px] text-muted-foreground">{m.sub}</p>
          </button>
        ))}
      </nav>

      <section className="rounded-xl border border-border bg-card/50 p-5">
        {body}
      </section>

      <Disclaimer>
        Scenarios are research instruments. Outputs are SIMULATED, range-based, and uncertainty-labeled.
        Nothing here constitutes investment advice or a guaranteed outcome.
      </Disclaimer>
    </PageShell>
  );
}
