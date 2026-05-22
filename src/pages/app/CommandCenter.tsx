import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";
import {
  Activity, Bell, FileText, Sparkles, FlaskConical, Workflow, CreditCard,
  ArrowRight, Lock, AlertTriangle, X,
} from "lucide-react";

const PLATFORMS = ["Robinhood", "Fidelity", "Schwab", "E*TRADE", "Thinkorswim", "All Others Publicly Available", "Other"];

import { getPciColorClass } from "@/constants/pciData";
import { pciToBandName } from "@/lib/pciMatrix";

const PCI_TIER = (s: number | null | undefined) => {
  if (s == null) return { label: "—", color: "text-muted-foreground" };
  return { label: pciToBandName(s), color: getPciColorClass(s).text };
};

interface PanelProps {
  title: string;
  subtitle?: string;
  icon: typeof Activity;
  locked?: boolean;
  lockedTier?: string;
  children?: React.ReactNode;
  cta?: { label: string; to: string };
}

function Panel({ title, subtitle, icon: Icon, locked, lockedTier, children, cta }: PanelProps) {
  return (
    <section className="rounded-xl border border-border bg-card/50 p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-purple-deep" />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
            {subtitle && <p className="text-sm font-semibold mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      <div className="mt-4 flex-1 text-sm">
        {locked ? (
          <div className="text-muted-foreground">
            Available on {lockedTier}+. <Link to="/pricing" className="text-purple-deep hover:underline">Upgrade →</Link>
          </div>
        ) : children}
      </div>
      {!locked && cta && (
        <Link to={cta.to} className="mt-4 inline-flex items-center text-xs text-purple-deep hover:underline">
          {cta.label} <ArrowRight className="w-3 h-3 ml-1" />
        </Link>
      )}
    </section>
  );
}

interface OnboardingState {
  platform_set: boolean;
  has_watchlist_item: boolean;
  has_simulation: boolean;
  dismissed: boolean;
}

const STORAGE_KEY = "phaos_onboarding_dismissed";

export default function CommandCenter() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const [tickers, setTickers] = useState<{ ticker: string; pci_score: number | null; updated_at: string }[]>([]);
  const [memos, setMemos] = useState<any[]>([]);
  const [memoUsage, setMemoUsage] = useState(0);
  const [onb, setOnb] = useState<OnboardingState>({ platform_set: false, has_watchlist_item: false, has_simulation: false, dismissed: false });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [pp, wl, ri, sim, memosRes, memoCount] = await Promise.all([
        supabase.from("platform_preferences").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("watchlists").select("id").eq("user_id", user.id),
        supabase.from("research_items").select("ticker,pci_score,updated_at").order("updated_at", { ascending: false }).limit(5),
        supabase.from("simulation_runs").select("id").eq("user_id", user.id).limit(1),
        supabase.from("truth_memos").select("id,research_item_id,status,created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("truth_memos").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", new Date(new Date().setDate(1)).toISOString()),
      ]);
      let hasWlItem = false;
      if (wl.data?.length) {
        const { count } = await supabase.from("watchlist_items").select("id", { count: "exact", head: true }).in("watchlist_id", wl.data.map((w) => w.id));
        hasWlItem = (count ?? 0) > 0;
      }
      setTickers(ri.data ?? []);
      setMemos(memosRes.data ?? []);
      setMemoUsage(memoCount.count ?? 0);
      const dismissed = localStorage.getItem(STORAGE_KEY) === "1";
      setOnb({
        platform_set: !!pp.data,
        has_watchlist_item: hasWlItem,
        has_simulation: !!sim.data?.length,
        dismissed,
      });
    })();
  }, [user]);

  const onboardingComplete = onb.platform_set && onb.has_watchlist_item && onb.has_simulation;
  const showOnboarding = !onb.dismissed && !onboardingComplete;

  const setPlatform = async (p: string) => {
    if (!user) return;
    await supabase.from("platform_preferences").upsert({ user_id: user.id, preferred_platform: p as any });
    setOnb((s) => ({ ...s, platform_set: true }));
  };

  const dismissOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOnb((s) => ({ ...s, dismissed: true }));
  };

  const lastUpdated = tickers[0]?.updated_at ? new Date(tickers[0].updated_at).toLocaleString() : "—";

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.email?.split("@")[0]}. {ent.productLabel}.
        </p>
      </header>

      {ent.pastDue && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-medium text-destructive">Payment past due</p>
            <p className="text-muted-foreground mt-1">Update payment to keep full access.</p>
          </div>
          <Link to="/app/billing"><Button size="sm" variant="outline">Manage billing</Button></Link>
        </div>
      )}

      {showOnboarding && (
        <section className="rounded-xl border border-purple-deep/30 bg-purple-deep/5 p-5 relative">
          <button onClick={dismissOnboarding} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" aria-label="Skip">
            <X className="w-4 h-4" />
          </button>
          <p className="text-xs uppercase tracking-wider text-purple-deep">Get started</p>
          <h2 className="text-lg font-semibold mt-1">Welcome to Phaos <span className="italic text-purple-deep font-medium">AI</span></h2>
          <ol className="mt-4 space-y-3 text-sm">
            <li>
              <p className="font-medium flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${onb.platform_set ? "bg-emerald-500 text-white" : "bg-foreground/10"}`}>1</span>
                Set your platform preference
              </p>
              {!onb.platform_set && (
                <div className="mt-2 ml-7 flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button key={p} onClick={() => setPlatform(p)} className="px-2.5 py-1 text-xs rounded-md border border-border hover:bg-accent">
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${onb.has_watchlist_item ? "bg-emerald-500 text-white" : "bg-foreground/10"}`}>2</span>
              <span className="flex-1">Add your first ticker to your watchlist</span>
              {!onb.has_watchlist_item && <Link to="/app/watchlists" className="text-xs text-purple-deep hover:underline">Add →</Link>}
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${onb.has_simulation ? "bg-emerald-500 text-white" : "bg-foreground/10"}`}>3</span>
              <span className="flex-1">Run your first simulation</span>
              {!onb.has_simulation && <Link to="/one/run-simulation" className="text-xs text-purple-deep hover:underline">Run →</Link>}
            </li>
          </ol>
          <button onClick={dismissOnboarding} className="mt-4 text-xs text-muted-foreground hover:text-foreground">Skip onboarding</button>
        </section>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Panel title="PCI Watch" subtitle="Your top signals today" icon={Activity}>
          {tickers.length === 0 ? (
            <p className="text-muted-foreground">
              Add your first ticker to start tracking PCI signals →{" "}
              <Link to="/app/watchlists" className="text-purple-deep hover:underline">Watchlists</Link>
            </p>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {tickers.map((t) => {
                  const tier = PCI_TIER(t.pci_score);
                  return (
                    <li key={t.ticker} className="py-2 flex items-center justify-between">
                      <span className="font-mono text-sm">{t.ticker}</span>
                      <span className={`text-sm font-semibold ${tier.color}`}>
                        {t.pci_score ?? "—"}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">{tier.label}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
            </>
          )}
        </Panel>

        <Panel title="Signal Alerts" subtitle="What changed since last visit" icon={Bell}
          locked={!ent.has("phaos_one")} lockedTier="Research">
          <p className="text-muted-foreground">No new material signal changes.</p>
        </Panel>

        <Panel title="Recent Truth Memos" icon={FileText}
          locked={!ent.has("sunesis")} lockedTier="Sunesis"
          cta={{ label: "All memos", to: "/app/sunesis" }}>
          {memos.length === 0 ? (
            <p className="text-muted-foreground">Generate your first Truth Memo on any ticker →</p>
          ) : (
            <ul className="divide-y divide-border">
              {memos.map((m) => (
                <li key={m.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="truncate">Memo · {new Date(m.created_at).toLocaleDateString()}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-foreground/10 capitalize">{m.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Investment Themes" icon={Sparkles}
          locked={!ent.has("sunesis")} lockedTier="Sunesis"
          cta={{ label: "Explore themes", to: "/app/themes" }}>
          <p className="text-muted-foreground">Your active themes will appear here.</p>
        </Panel>

        <Panel title="Simulation Queue" icon={FlaskConical}
          locked={!ent.has("phaos_one")} lockedTier="Research"
          cta={{ label: "Run new simulation", to: "/one/run-simulation" }}>
          <p className="text-muted-foreground">Run a free simulation to see scenario analysis →</p>
        </Panel>

        <Panel title="Workflow Queue" icon={Workflow}
          locked={!ent.has("phaos_one")} lockedTier="Research"
          cta={{ label: "Go to Workflows", to: "/app/sunesis/workflow" }}>
          <p className="text-muted-foreground">Your research review queue is clear.</p>
        </Panel>

        <Panel title="Account Status" icon={CreditCard} cta={{ label: "Manage billing", to: "/app/billing" }}>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{ent.productLabel}</p>
            <p className="text-xs text-muted-foreground">
              Truth Memos this month: <span className="text-foreground">{memoUsage}</span>
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              Status: <span className={ent.pastDue ? "text-destructive" : "text-emerald-500"}>{ent.status ?? "free"}</span>
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
