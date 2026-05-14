import { useEffect, useMemo, useState } from "react";
import { PageShell, EmptyCard } from "@/components/app/PageShell";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  created_at: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: any;
}

const DISCLAIMER = "This log is for internal record-keeping purposes. Phaos AI is not a registered compliance, legal, or financial services provider.";

export default function PantheonAudit() {
  const { organizationId } = useOrganization();
  const [events, setEvents] = useState<Event[]>([]);
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      const { data } = await supabase
        .from("audit_events")
        .select("id,created_at,user_id,action,resource_type,resource_id,metadata")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(500);
      setEvents(data ?? []);
    })();
  }, [organizationId]);

  const actions = useMemo(() => Array.from(new Set(events.map((e) => e.action))), [events]);
  const resources = useMemo(() => Array.from(new Set(events.map((e) => e.resource_type).filter(Boolean) as string[])), [events]);

  const filtered = useMemo(() => events.filter((e) => {
    if (userFilter && !(e.user_id ?? "").includes(userFilter)) return false;
    if (actionFilter !== "all" && e.action !== actionFilter) return false;
    if (resourceFilter !== "all" && e.resource_type !== resourceFilter) return false;
    if (from && new Date(e.created_at) < new Date(from)) return false;
    if (to && new Date(e.created_at) > new Date(to)) return false;
    return true;
  }), [events, userFilter, actionFilter, resourceFilter, from, to]);

  const exportCSV = () => {
    const header = ["timestamp", "user_id", "action", "resource_type", "resource_id", "details"];
    const rows = filtered.map((e) => [
      e.created_at, e.user_id ?? "", e.action, e.resource_type ?? "", e.resource_id ?? "",
      JSON.stringify(e.metadata ?? {}).replace(/"/g, '""'),
    ]);
    const csv = [
      `# ${DISCLAIMER}`,
      header.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  return (
    <PageShell title="Compliance Audit Logs"
      description="Append-only record of all organization activity"
      minTier="pantheon"
      actions={<Button onClick={exportCSV} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export CSV</Button>}>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <Input placeholder="User id contains…" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger><SelectValue placeholder="Resource" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resources</SelectItem>
            {resources.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyCard>No audit events match your filters.</EmptyCard>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Timestamp</th>
                <th className="text-left px-3 py-2">User</th>
                <th className="text-left px-3 py-2">Action</th>
                <th className="text-left px-3 py-2">Resource</th>
                <th className="text-left px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.user_id?.slice(0, 8) ?? "system"}</td>
                  <td className="px-3 py-2">{e.action}</td>
                  <td className="px-3 py-2">{e.resource_type ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-xs">
                    {JSON.stringify(e.metadata ?? {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">{DISCLAIMER}</p>
    </PageShell>
  );
}
