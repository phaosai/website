import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SEED_THEMES, getTheme } from "@/data/themes";
import { ThemeBreakConditions } from "@/components/phaos/themes/ThemeBreakConditions";
import { linkToLedger } from "@/lib/researchLinks";
import { MethodologyNote } from "./MethodologyNote";
import { cn } from "@/lib/utils";

export function ThemeBreakageSimulator({ initialThemeId }: { initialThemeId?: string }) {
  const [id, setId] = useState<string>(initialThemeId ?? SEED_THEMES[0].id);
  const theme = getTheme(id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {SEED_THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setId(t.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[11px] transition-colors",
              id === t.id
                ? "border-purple-deep/60 bg-purple-deep/10 text-foreground"
                : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {t.theme_name}
          </button>
        ))}
      </div>

      {theme && (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">{theme.counter_thesis}</p>
          <ThemeBreakConditions conditions={theme.break_conditions ?? []} themeId={theme.id} />
          <Link
            to={linkToLedger({ theme: theme.id })}
            className="inline-flex items-center gap-1 text-xs text-purple-deep hover:underline"
          >
            Open this theme in Truth Ledger <ArrowRight className="w-3 h-3" />
          </Link>
        </>
      )}

      <MethodologyNote
        formula="Counter-thesis ranking · severity-weighted"
        rationale="Conditions are ordered by potential to invalidate the theme. Severity reflects how decisively the condition would break the narrative, not its probability."
      />
    </div>
  );
}
