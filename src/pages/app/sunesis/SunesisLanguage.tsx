import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { PageShell, Disclaimer } from "@/components/app/PageShell";
import { SunesisModuleNav } from "@/components/phaos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLES = [
  "Stress NVDA against a 75bps Fed cut and a 20% USD weakening over 6 months.",
  "If oil rises 30% and AAPL insider selling accelerates, what is the new conviction?",
  "Run a regime-shift audit on COIN assuming a stablecoin-led liquidity contraction.",
];

interface Mapping { input: string; assumption: string; }

export default function SunesisLanguage() {
  const [text, setText] = useState("");
  const [mappings, setMappings] = useState<Mapping[]>([]);

  const compile = () => {
    if (!text.trim()) return;
    // Lightweight client-side intent parser placeholder.
    const found: Mapping[] = [];
    if (/cut|hike|bps|fed/i.test(text)) found.push({ input: "Rate language", assumption: "Macro · Fed Funds Δ scenario node" });
    if (/usd|dollar|fx/i.test(text))    found.push({ input: "FX language",   assumption: "Macro · USD Index Δ scenario node" });
    if (/oil|wti|crude/i.test(text))    found.push({ input: "Oil language",  assumption: "Macro · WTI Δ scenario node" });
    if (/insider|selling|buying/i.test(text)) found.push({ input: "Insider language", assumption: "Signal · Form 4 deviation window" });
    if (/regime|liquidity|contraction/i.test(text)) found.push({ input: "Regime language", assumption: "Composite · GARCH(1,1) regime flag" });
    const tickerMatch = text.match(/\b[A-Z]{2,5}\b/g);
    if (tickerMatch) found.unshift({ input: `Asset: ${tickerMatch[0]}`, assumption: "Resolve to research_items.ticker" });
    setMappings(found.length ? found : [{ input: "Free text", assumption: "Awaiting structured intent — refine the prompt." }]);
  };

  return (
    <PageShell
      title="Language-to-Circuit"
      description="Speak in research English. Sunesis compiles your intent into a structured Truth Machine pass."
      minTier="sunesis"
    >
      <SunesisModuleNav />

      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the asset, the regime, and the question you want audited…"
          className="min-h-32 font-sans"
        />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setText(ex)}
                className="text-[11px] px-2 py-1 rounded-md border border-border hover:bg-accent/40 text-muted-foreground"
              >
                {ex.slice(0, 48)}…
              </button>
            ))}
          </div>
          <Button size="sm" onClick={compile}>
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Compile to circuit
          </Button>
        </div>
      </div>

      {mappings.length > 0 && (
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <h3 className="text-sm font-semibold mb-3">Intent mapping</h3>
          <ul className="divide-y divide-border">
            {mappings.map((m, i) => (
              <li key={i} className="py-2.5 flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-muted-foreground w-40 shrink-0">{m.input}</span>
                <ArrowRight className="w-3 h-3 text-purple-deep shrink-0" />
                <span>{m.assumption}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Disclaimer>
        Language compilation is transparent by design. Every assumption is shown before any audit runs.
      </Disclaimer>
    </PageShell>
  );
}
