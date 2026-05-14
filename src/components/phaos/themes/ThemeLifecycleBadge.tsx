import { Sprout, Flame, CloudRain } from "lucide-react";
import type { ThemeLifecycle } from "@/data/themes";
import { cn } from "@/lib/utils";

const META: Record<ThemeLifecycle, { label: string; color: string; Icon: any; tip: string }> = {
  emergence: {
    label: "Emergence",
    color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
    Icon: Sprout,
    tip: "Early evidence forming. Treat as a research hypothesis.",
  },
  mania: {
    label: "Mania",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    Icon: Flame,
    tip: "Crowded narrative. Watch for break conditions.",
  },
  hangover: {
    label: "Hangover",
    color: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
    Icon: CloudRain,
    tip: "Narrative cooling. Evidence may be unwinding.",
  },
};

export function ThemeLifecycleBadge({ lifecycle, className }: { lifecycle: ThemeLifecycle; className?: string }) {
  const m = META[lifecycle];
  return (
    <span
      title={m.tip}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        m.color,
        className,
      )}
    >
      <m.Icon className="w-3 h-3" /> {m.label}
    </span>
  );
}
