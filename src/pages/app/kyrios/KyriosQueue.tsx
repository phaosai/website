import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, EmptyCard } from "@/components/app/PageShell";

const STATUSES = ["All", "draft", "under_review", "approved", "published", "rejected"];

export default function KyriosQueue() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("All");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("workflow_items")
        .select("id,title,status,assigned_to,created_at,research_item_id,truth_memo_id")
        .order("created_at", { ascending: false });
      setItems(data ?? []);
    })();
  }, []);

  const filtered = useMemo(() => items.filter((i) => status === "All" || i.status === status), [items, status]);

  return (
    <PageShell title="Kyrios · Workflow Queue" description="Research review and approval pipeline." minTier="kyrios">
      <div className="flex items-center gap-3 text-xs flex-wrap">
        <span className="text-muted-foreground">Status:</span>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-2.5 py-1 rounded-md border ${status === s ? "border-purple-deep text-purple-deep" : "border-border text-muted-foreground"}`}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyCard>Your research review queue is clear.</EmptyCard>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Assigned</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className="border-t border-border hover:bg-accent/30">
                  <td className="p-3">{it.title}</td>
                  <td className="p-3"><StatusBadge status={it.status} /></td>
                  <td className="p-3 text-xs text-muted-foreground font-mono truncate max-w-[140px]">{it.assigned_to ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(it.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <Link to={`/app/kyrios/workflow/${it.id}`} className="text-purple-deep hover:underline text-xs">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    under_review: "bg-amber-500/15 text-amber-500",
    approved: "bg-emerald-500/15 text-emerald-500",
    published: "bg-purple-deep/15 text-purple-deep",
    rejected: "bg-red-500/15 text-red-500",
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded capitalize ${map[status] ?? "bg-muted"}`}>{status?.replace("_", " ")}</span>;
}
