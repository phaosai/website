import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";
import { PageShell, EmptyCard, Disclaimer } from "@/components/app/PageShell";

export default function AionAudit() {
  const ent = useEntitlements();
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState({ action: "", resource: "", user: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(500);
      setEvents(data ?? []);
    })();
  }, []);

  const filtered = useMemo(() => events.filter((e) => {
    if (filter.action && !e.action.includes(filter.action)) return false;
    if (filter.resource && !(e.resource_type ?? "").includes(filter.resource)) return false;
    if (filter.user && !(e.user_id ?? "").includes(filter.user)) return false;
    return true;
  }), [events, filter]);

  const exportCsv = () => {
    const header = "id,created_at,user_id,action,resource_type,resource_id\n";
    const rows = filtered.map((e) => [e.id, e.created_at, e.user_id, e.action, e.resource_type, e.resource_id].join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit_log.csv"; a.click();
  };

  return (
    <PageShell title="Audit Trail" description="Append-only organization activity log." minTier="aion"
      actions={ent.has("pantheon") && (
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
      )}>
      <div className="flex flex-wrap gap-2 text-xs">
        <input value={filter.action} onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value }))}
          placeholder="Filter action" className="px-3 py-1.5 rounded-md border border-border bg-background" />
        <input value={filter.resource} onChange={(e) => setFilter((f) => ({ ...f, resource: e.target.value }))}
          placeholder="Filter resource type" className="px-3 py-1.5 rounded-md border border-border bg-background" />
        <input value={filter.user} onChange={(e) => setFilter((f) => ({ ...f, user: e.target.value }))}
          placeholder="Filter user id" className="px-3 py-1.5 rounded-md border border-border bg-background" />
      </div>

      {filtered.length === 0 ? (
        <EmptyCard>No audit events yet.</EmptyCard>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-2 text-left">When</th>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Action</th>
                <th className="p-2 text-left">Resource</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="p-2 text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="p-2 font-mono truncate max-w-[120px]">{e.user_id ?? "—"}</td>
                  <td className="p-2">{e.action}</td>
                  <td className="p-2 text-muted-foreground">{e.resource_type ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ent.has("pantheon") && (
        <Disclaimer>
          This log is for internal compliance purposes. Phaos AI is not a registered compliance provider.
        </Disclaimer>
      )}
    </PageShell>
  );
}
