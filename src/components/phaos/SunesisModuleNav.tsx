import { NavLink } from "react-router-dom";
import {
  Microscope, FlaskConical, Sparkles, ListChecks, ShieldCheck, ScrollText, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MODULES = [
  { to: "/app/sunesis", label: "Research", icon: Microscope, end: true },
  { to: "/app/sunesis/sandbox", label: "Scenario Sandbox", icon: FlaskConical },
  { to: "/app/sunesis/language", label: "Language-to-Circuit", icon: Sparkles },
  { to: "/app/sunesis/workflow", label: "Workflow", icon: ListChecks },
  { to: "/app/sunesis/compliance", label: "Compliance", icon: ShieldCheck },
  { to: "/app/sunesis/ledger", label: "Truth Ledger", icon: ScrollText },
  { to: "/one/run-simulation", label: "Truth Machine", icon: Zap },
];

/**
 * Persistent module bar inside Sunesis. Keeps the user oriented inside the
 * "Research Operating System" surface without leaving the existing app shell.
 */
export function SunesisModuleNav() {
  return (
    <nav className="rounded-xl border border-border bg-card/40 backdrop-blur p-1.5 flex flex-wrap gap-1">
      {MODULES.map((m) => (
        <NavLink
          key={m.to}
          to={m.to}
          end={m.end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
              isActive
                ? "bg-purple-deep/15 text-purple-deep border border-purple-deep/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-transparent"
            )
          }
        >
          <m.icon className="w-3.5 h-3.5" />
          {m.label}
        </NavLink>
      ))}
    </nav>
  );
}
