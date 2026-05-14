import { useMemo, useState } from "react";
import { SEED_THEMES, type HistoricalAnalog } from "@/data/themes";
import { MethodologyNote } from "./MethodologyNote";
import { cn } from "@/lib/utils";

export function HistoricalAnalogMapper({ initialThemeId }: { initialThemeId?: string }) {
  const allAnalogs = useMemo(() => {
    return SEED_THEMES.flatMap((t) =>
      (t.historical_analogs ?? []).map((a) => ({ ...a, themeId: t.id, themeName: t.theme_name })),
    );
  }, []);
  const [selected, setSelected] = useState<(HistoricalAnalog & { themeId: string; themeName: string }) | undefined>(
    allAnalogs.find((a) => a.themeId === initialThemeId) ?? allAnalogs[0],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-1 inline-flex text-[10px] font-semibold uppercase tracking-wider text-amber-300">
        Heuristic framing — not a prediction
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {allAnalogs.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a)}
            className={cn(
              "rounded-md border px-3 py-2 text-left text-xs transition-colors",
              selected?.id === a.id
                ? "border-purple-deep/60 bg-purple-deep/10 text-foreground"
                : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
            )}
          >
            <p className="font-semibold">{a.label}</p>
            <p className="text-[10px] text-muted-foreground">{a.era} · {a.themeName}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-md border border-border bg-card/40 p-3 space-y-1.5">
          <p className="text-xs font-semibold">{selected.label} · {selected.era}</p>
          <p className="text-xs text-foreground/85 leading-relaxed">{selected.note}</p>
          <p className="text-[10px] italic text-muted-foreground">
            Historical analog. Past performance is not indicative of future results.
          </p>
        </div>
      )}

      <MethodologyNote
        formula="Pattern correspondence · era-conditioned"
        rationale="We surface analogs based on shared structural drivers — capacity, capex, contract concentration — not price patterns. Use them to interrogate the current thesis, not to forecast outcomes."
      />
    </div>
  );
}
