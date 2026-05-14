import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, RefreshCw, FolderPlus, Pencil, Check, X, Globe, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WatchRow {
  id: string;
  ticker: string;
  name: string;
  asset_class: string;
  pci_at_add: number;
  price_at_add: number;
  added_at: string;
  last_pci: number | null;
  last_price: number | null;
  last_refreshed_at: string | null;
  group_id: string | null;
}

interface Group {
  id: string;
  name: string;
  is_public?: boolean;
}

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const colorFor = (v: number) => (v >= 0 ? "text-pci-go" : "text-pci-no-go");

interface Props {
  refreshKey: number;
  /** When true, render the full Watchlists tab UI (groups, rename/create). When false, render compact inline panel for the Research page. */
  fullPage?: boolean;
}

interface Stats {
  n: number;
  wins: number;
  losses: number;
  winRate: number;
  best: WatchRow | null;
  worst: WatchRow | null;
  avgPciNow: number;
  avgPciDelta: number;
  totalNotional: number;
  oldestDays: number;
  roi: number;
}

const itemRoi = (r: WatchRow) => {
  const cur = r.last_price ?? r.price_at_add;
  if (!r.price_at_add) return 0;
  return ((cur - r.price_at_add) / r.price_at_add) * 100;
};

const computeStats = (rows: WatchRow[]): Stats => {
  const n = rows.length;
  const wins = rows.filter((r) => itemRoi(r) > 0).length;
  const losses = rows.filter((r) => itemRoi(r) < 0).length;
  const roi = n === 0 ? 0 : rows.reduce((s, r) => s + itemRoi(r), 0) / n;
  return {
    n, wins, losses,
    winRate: n === 0 ? 0 : (wins / n) * 100,
    best: n === 0 ? null : rows.reduce((a, b) => (itemRoi(a) >= itemRoi(b) ? a : b)),
    worst: n === 0 ? null : rows.reduce((a, b) => (itemRoi(a) <= itemRoi(b) ? a : b)),
    avgPciNow: n === 0 ? 0 : rows.reduce((s, r) => s + (r.last_pci ?? r.pci_at_add), 0) / n,
    avgPciDelta: n === 0 ? 0 : rows.reduce((s, r) => s + ((r.last_pci ?? r.pci_at_add) - r.pci_at_add), 0) / n,
    totalNotional: rows.reduce((s, r) => s + Number(r.last_price ?? r.price_at_add ?? 0), 0),
    oldestDays: n === 0 ? 0 : Math.max(...rows.map((r) => Math.floor((Date.now() - new Date(r.added_at).getTime()) / (1000 * 60 * 60 * 24)))),
    roi,
  };
};

const Stat = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) => (
  <div className="rounded-lg border border-border/60 bg-background/40 p-3">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`mt-1 text-lg font-bold tabular-nums ${tone ?? "text-foreground"}`}>{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const HeroBlock = ({ stats, label, groups }: { stats: Stats; label: string; groups?: number }) => (
  <div className="rounded-xl border border-border bg-background/40 p-5 grid gap-4 md:grid-cols-12 items-stretch">
    <div className="md:col-span-4 flex flex-col justify-center rounded-lg border border-border/60 bg-background/60 p-5">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <div className={`text-5xl md:text-6xl font-bold tabular-nums ${colorFor(stats.roi)}`}>
        {stats.n === 0 ? "—" : fmtPct(stats.roi)}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {stats.n === 0 ? "Add results to begin tracking." : `${stats.n} instrument${stats.n === 1 ? "" : "s"}${groups ? ` across ${groups} group${groups === 1 ? "" : "s"}` : ""}.`}
      </p>
    </div>
    <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Stat label="Win rate" value={stats.n === 0 ? "—" : `${stats.winRate.toFixed(0)}%`} sub={`${stats.wins}W · ${stats.losses}L`} tone={stats.winRate >= 50 ? "text-pci-go" : stats.winRate > 0 ? "text-pci-warning" : "text-foreground"} />
      <Stat label="Best performer" value={stats.best ? stats.best.ticker : "—"} sub={stats.best ? fmtPct(itemRoi(stats.best)) : undefined} tone="text-pci-go" />
      <Stat label="Worst drawdown" value={stats.worst ? stats.worst.ticker : "—"} sub={stats.worst ? fmtPct(itemRoi(stats.worst)) : undefined} tone="text-pci-no-go" />
      <Stat label="Avg PCI (now)" value={stats.n === 0 ? "—" : stats.avgPciNow.toFixed(0)} sub={stats.n === 0 ? undefined : `${stats.avgPciDelta >= 0 ? "+" : ""}${stats.avgPciDelta.toFixed(1)} since add`} />
      <Stat label="Notional tracked" value={stats.n === 0 ? "—" : `$${stats.totalNotional.toFixed(2)}`} sub={`${stats.n} symbol${stats.n === 1 ? "" : "s"}`} />
      <Stat label="Oldest hold" value={stats.n === 0 ? "—" : `${stats.oldestDays}d`} sub="since first add" />
    </div>
  </div>
);

export const WatchlistPanel = ({ refreshKey, fullPage = false }: Props) => {
  const [rows, setRows] = useState<WatchRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const ensureDefaultGroup = useCallback(async (userId: string): Promise<Group[]> => {
    const { data: existing } = await supabase
      .from("sunesis_watchlist_groups")
      .select("id,name,is_public")
      .order("created_at", { ascending: true });
    if (existing && existing.length > 0) return existing as Group[];
    const { data: created } = await supabase
      .from("sunesis_watchlist_groups")
      .insert([{ user_id: userId, name: "My Watchlist" }] as never)
      .select("id,name,is_public")
      .maybeSingle();
    return created ? [created as Group] : [];
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const gs = await ensureDefaultGroup(user.id);
      setGroups(gs);

      // Refresh prices/PCI server-side (best effort)
      try {
        await supabase.functions.invoke("sunesis-watchlist-refresh", { body: {} });
      } catch (e) {
        console.warn("watchlist refresh edge call failed", e);
      }

      // Pull public toggle
      const { data: profile } = await supabase
        .from("users")
        .select("handle_is_public")
        .eq("id", user.id)
        .maybeSingle();
      setIsPublic(!!(profile as any)?.handle_is_public);

      // Always pull ALL rows directly from DB so nothing is missed.
      const { data: items } = await supabase
        .from("sunesis_watchlist")
        .select("id,ticker,name,asset_class,pci_at_add,price_at_add,added_at,last_pci,last_price,last_refreshed_at,group_id")
        .order("added_at", { ascending: false });
      const itemRows = (items ?? []) as WatchRow[];

      // Auto-assign any orphan rows (no group_id) to the first group.
      if (gs.length > 0) {
        const orphan = itemRows.filter((r) => !r.group_id).map((r) => r.id);
        if (orphan.length > 0) {
          await supabase
            .from("sunesis_watchlist")
            .update({ group_id: gs[0].id })
            .in("id", orphan);
          for (const r of itemRows) if (!r.group_id) r.group_id = gs[0].id;
        }
      }

      setRows(itemRows);
    } finally {
      setLoading(false);
    }
  }, [ensureDefaultGroup]);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);

  const remove = async (id: string) => {
    await supabase.from("sunesis_watchlist").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const togglePublic = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const next = !isPublic;
    setIsPublic(next);
    const { error } = await supabase.from("users").update({ handle_is_public: next } as never).eq("id", user.id);
    if (error) {
      setIsPublic(!next);
      toast({ title: "Could not update visibility", description: error.message, variant: "destructive" });
      return;
    }
    // Cascade to all groups
    await supabase.from("sunesis_watchlist_groups").update({ is_public: next } as never).eq("user_id", user.id);
    toast({ title: next ? "Watchlist is now public" : "Watchlist is now private", description: next ? "Your handle (set in Settings) appears on the leaderboard." : "You'll only show as anonymous on the leaderboard." });
  };

  const createGroup = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const name = window.prompt("Watchlist group name?", "New Watchlist");
    if (!name) return;
    const { error } = await supabase
      .from("sunesis_watchlist_groups")
      .insert([{ user_id: user.id, name, is_public: isPublic }] as never);
    if (error) {
      toast({ title: "Could not create group", description: error.message, variant: "destructive" });
    } else {
      refresh();
    }
  };

  const renameGroup = async (id: string) => {
    const name = editName.trim();
    if (!name) { setEditingGroup(null); return; }
    await supabase.from("sunesis_watchlist_groups").update({ name }).eq("id", id);
    setEditingGroup(null);
    refresh();
  };

  const deleteGroup = async (id: string) => {
    if (groups.length <= 1) {
      toast({ title: "Cannot delete the only group", variant: "destructive" });
      return;
    }
    if (!window.confirm("Delete this watchlist group? Items will move to your first remaining group.")) return;
    const fallback = groups.find((g) => g.id !== id);
    if (fallback) {
      await supabase.from("sunesis_watchlist").update({ group_id: fallback.id }).eq("group_id", id);
    }
    await supabase.from("sunesis_watchlist_groups").delete().eq("id", id);
    refresh();
  };

  const moveItem = async (itemId: string, newGroupId: string) => {
    await supabase.from("sunesis_watchlist").update({ group_id: newGroupId }).eq("id", itemId);
    refresh();
  };

  const renderGroup = (g: Group) => {
    const groupRows = rows.filter((r) => r.group_id === g.id);
    const stats = computeStats(groupRows);
    return (
      <div key={g.id} className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {editingGroup === g.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-md border border-border bg-background/60 px-2 py-1 text-sm font-semibold"
                  autoFocus
                />
                <button onClick={() => renameGroup(g.id)} className="text-pci-go p-1"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingGroup(null)} className="text-muted-foreground p-1"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold truncate">{g.name}</p>
                <span className="text-xs text-muted-foreground">({groupRows.length})</span>
                {fullPage && (
                  <>
                    <button onClick={() => { setEditingGroup(g.id); setEditName(g.name); }} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => deleteGroup(g.id)} className="text-muted-foreground hover:text-pci-no-go p-1"><Trash2 className="w-3 h-3" /></button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Per-group hero stats — same layout as combined */}
        <HeroBlock stats={stats} label={`${g.name} · WLH-ROI`} />

        {groupRows.length > 0 && (
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-2.5">Ticker</th>
                  <th className="text-left p-2.5">Name</th>
                  <th className="text-left p-2.5">Class</th>
                  <th className="text-left p-2.5">PCI add</th>
                  <th className="text-left p-2.5">PCI now</th>
                  <th className="text-left p-2.5">Add date</th>
                  <th className="text-left p-2.5">Add $</th>
                  <th className="text-left p-2.5">Now $</th>
                  <th className="text-left p-2.5">WLH-ROI</th>
                  {fullPage && groups.length > 1 && <th className="text-left p-2.5">Move</th>}
                  <th className="text-right p-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {groupRows.map((r) => {
                  const roi = itemRoi(r);
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-accent/30">
                      <td className="p-2.5 font-mono font-semibold">{r.ticker}</td>
                      <td className="p-2.5">{r.name}</td>
                      <td className="p-2.5 text-xs uppercase tracking-wider text-muted-foreground">{r.asset_class.replace(/_/g, " ")}</td>
                      <td className="p-2.5 tabular-nums">{r.pci_at_add}</td>
                      <td className="p-2.5 tabular-nums">{r.last_pci ?? r.pci_at_add}</td>
                      <td className="p-2.5 text-xs text-muted-foreground">{new Date(r.added_at).toLocaleDateString()}</td>
                      <td className="p-2.5 tabular-nums">${Number(r.price_at_add).toFixed(2)}</td>
                      <td className="p-2.5 tabular-nums">${Number(r.last_price ?? r.price_at_add).toFixed(2)}</td>
                      <td className={`p-2.5 font-semibold tabular-nums ${colorFor(roi)}`}>{fmtPct(roi)}</td>
                      {fullPage && groups.length > 1 && (
                        <td className="p-2.5">
                          <select
                            value={r.group_id ?? ""}
                            onChange={(e) => moveItem(r.id, e.target.value)}
                            className="rounded-md border border-border bg-background/60 px-2 py-1 text-xs"
                          >
                            {groups.map((gg) => (
                              <option key={gg.id} value={gg.id}>{gg.name}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => remove(r.id)}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-pci-no-go hover:bg-pci-no-go/10"
                          aria-label="Remove from watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const combined = computeStats(rows);

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold">Your Watchlist</p>
          <p className="text-xs text-muted-foreground">WLH-ROI · Watch List Hypothetical Return On Investment, equal-weighted from each item's add-date.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {fullPage && (
            <>
              <button
                type="button"
                onClick={togglePublic}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${isPublic ? "border-pci-go/40 bg-pci-go/10 text-pci-go" : "border-border bg-background/60 hover:bg-card"}`}
                title={isPublic ? "Public — appears on leaderboard with your handle" : "Private — only anonymous on leaderboard"}
              >
                {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isPublic ? "Public" : "Make public"}
              </button>
              <button
                type="button"
                onClick={createGroup}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold hover:bg-card"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                New group
              </button>
            </>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold hover:bg-card disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Combined hero — WLH-ROI on far left, supporting metrics fill the row */}
      <HeroBlock stats={combined} label="Combined WLH-ROI · all groups" groups={groups.length} />

      <div className="space-y-3">
        {groups.map(renderGroup)}
      </div>
    </div>
  );
};
