import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Loader2, RefreshCcw } from "lucide-react";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface MetricRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  tier: string | null;
  created_at: string;
  login_count: number;
  last_login_at: string | null;
  audit_event_count: number;
  simulation_count: number;
  research_count: number;
  workflow_count: number;
  memo_count: number;
  watchlist_count: number;
  is_admin: boolean;
}

const TIER_STYLES: Record<string, string> = {
  free: "border-border bg-muted/30 text-muted-foreground",
  sunesis: "border-primary/40 bg-primary/10 text-primary",
  aion: "border-accent/40 bg-accent/10 text-accent",
  kyrios: "border-pci-go/40 bg-pci-go/10 text-pci-go",
  one: "border-pci-choice/40 bg-pci-choice/10 text-pci-choice",
  pantheon: "border-pci-choice/60 bg-pci-choice/15 text-pci-choice",
};

const AdminDashboard = () => {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [rows, setRows] = useState<MetricRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  const load = async () => {
    setReloading(true);
    setError(null);
    const { data, error } = await supabase
      .from("admin_user_metrics" as never)
      .select("*")
      .order("last_login_at", { ascending: false, nullsFirst: false });
    if (error) setError(error.message);
    setRows((data as MetricRow[] | null) ?? []);
    setReloading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth?mode=signin" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  const totalLogins = rows?.reduce((s, r) => s + (r.login_count || 0), 0) ?? 0;
  const totalEvents = rows?.reduce((s, r) => s + r.audit_event_count + r.simulation_count + r.research_count + r.workflow_count + r.memo_count + r.watchlist_count, 0) ?? 0;
  const tierCounts = (rows ?? []).reduce<Record<string, number>>((acc, r) => {
    const k = r.tier || "free";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title="Admin — Phaos AI" description="Internal admin dashboard" canonical="/admin" />
      <Navigation />
      <section className="pt-28 px-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to app
            </Link>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-pci-choice" />
              <h1 className="text-2xl font-extrabold tracking-tight">Admin · All Accounts</h1>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={reloading}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-semibold hover:bg-card disabled:opacity-50"
            >
              {reloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />} Refresh
            </button>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Total accounts" value={rows?.length ?? 0} />
            <Tile label="Total logins" value={totalLogins} />
            <Tile label="Total product events" value={totalEvents} />
            <Tile label="Admins" value={rows?.filter((r) => r.is_admin).length ?? 0} />
          </div>

          {/* Tier breakdown */}
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">Membership tiers</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tierCounts).map(([tier, count]) => (
                <span key={tier} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${TIER_STYLES[tier] ?? TIER_STYLES.free}`}>
                  <span className="uppercase tracking-wider">{tier}</span>
                  <span className="tabular-nums">{count}</span>
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
          )}

          {/* Per-user table */}
          <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">User</th>
                    <th className="px-3 py-3 text-left font-semibold">Tier</th>
                    <th className="px-3 py-3 text-right font-semibold">Logins</th>
                    <th className="px-3 py-3 text-left font-semibold">Last login</th>
                    <th className="px-3 py-3 text-right font-semibold">Sims</th>
                    <th className="px-3 py-3 text-right font-semibold">Research</th>
                    <th className="px-3 py-3 text-right font-semibold">Workflows</th>
                    <th className="px-3 py-3 text-right font-semibold">Memos</th>
                    <th className="px-3 py-3 text-right font-semibold">Watchlists</th>
                    <th className="px-3 py-3 text-right font-semibold">Audit</th>
                    <th className="px-3 py-3 text-right font-semibold">Total events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(rows ?? []).map((r) => {
                    const totalUserEvents = r.audit_event_count + r.simulation_count + r.research_count + r.workflow_count + r.memo_count + r.watchlist_count;
                    return (
                      <tr key={r.user_id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.full_name || r.email || r.user_id.slice(0, 8)}</div>
                          <div className="text-[11px] text-muted-foreground">{r.email}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_STYLES[r.tier ?? "free"] ?? TIER_STYLES.free}`}>
                            {r.tier ?? "free"}
                          </span>
                          {r.is_admin && <span className="ml-2 inline-flex items-center rounded-full border border-pci-choice/40 bg-pci-choice/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pci-choice">Admin</span>}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.login_count}</td>
                        <td className="px-3 py-3 text-[11px] text-muted-foreground">{r.last_login_at ? new Date(r.last_login_at).toLocaleString() : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.simulation_count}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.research_count}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.workflow_count}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.memo_count}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.watchlist_count}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.audit_event_count}</td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums">{totalUserEvents}</td>
                      </tr>
                    );
                  })}
                  {rows && rows.length === 0 && (
                    <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-sm">No accounts yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const Tile = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-border bg-card/50 p-5">
    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">{label}</p>
    <p className="mt-2 text-3xl font-extrabold tabular-nums">{value.toLocaleString()}</p>
  </div>
);

export default AdminDashboard;
