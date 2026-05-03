import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageShell, PCITierBadge } from "@/components/app/PageShell";
import { StatusBadge } from "./KyriosQueue";
import { toast } from "sonner";

const COMPLIANCE_ITEMS = [
  "PCI disclaimer included",
  "Source citations present",
  "Historical examples labeled",
  '"Not investment advice" statement present',
  "Data freshness acceptable",
];

export default function KyriosWorkflow() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [research, setResearch] = useState<any>(null);
  const [memo, setMemo] = useState<any>(null);
  const [checks, setChecks] = useState<boolean[]>(COMPLIANCE_ITEMS.map(() => false));

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: wf } = await supabase.from("workflow_items").select("*").eq("id", id).maybeSingle();
      setItem(wf);
      if (wf?.research_item_id) {
        const { data: r } = await supabase.from("research_items").select("*").eq("id", wf.research_item_id).maybeSingle();
        setResearch(r);
      }
      if (wf?.truth_memo_id) {
        const { data: m } = await supabase.from("truth_memos").select("*").eq("id", wf.truth_memo_id).maybeSingle();
        setMemo(m);
      }
    })();
  }, [id]);

  const updateStatus = async (status: "draft" | "under_review" | "approved" | "completed" | "rejected") => {
    if (!id) return;
    const { error } = await supabase.from("workflow_items").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${status.replace("_", " ")}`);
    setItem((i: any) => ({ ...i, status }));
  };

  const allChecked = checks.every(Boolean);

  return (
    <PageShell title="Workflow detail" description={item?.title} minTier="kyrios"
      actions={item && <StatusBadge status={item.status} />}>
      {!item ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <>
          <section className="rounded-xl border border-border bg-card/50 p-5">
            <h2 className="text-sm font-semibold">Research summary</h2>
            <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Ticker</p><p className="font-mono">{research?.ticker ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Company</p><p>{research?.company_name ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">PCI</p><p><PCITierBadge score={research?.pci_score} /></p></div>
            </div>
          </section>

          {memo && (
            <section className="rounded-xl border border-border bg-card/50 p-5">
              <h2 className="text-sm font-semibold mb-2">Memo</h2>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{memo.content || "—"}</p>
            </section>
          )}

          <section className="rounded-xl border border-border bg-card/50 p-5">
            <h2 className="text-sm font-semibold">Approval timeline</h2>
            <ol className="mt-3 space-y-2 text-sm">
              <li className="flex gap-3"><span className="text-xs text-muted-foreground w-32">{new Date(item.created_at).toLocaleString()}</span> <span>Created · status: {item.status}</span></li>
              {item.completed_at && <li className="flex gap-3"><span className="text-xs text-muted-foreground w-32">{new Date(item.completed_at).toLocaleString()}</span> <span>Completed</span></li>}
            </ol>
          </section>

          <section className="rounded-xl border border-border bg-card/50 p-5">
            <h2 className="text-sm font-semibold mb-3">Compliance checklist</h2>
            <ul className="space-y-2 text-sm">
              {COMPLIANCE_ITEMS.map((c, i) => (
                <li key={c} className="flex items-center gap-2">
                  <input type="checkbox" checked={checks[i]} onChange={(e) => setChecks((s) => s.map((v, j) => (j === i ? e.target.checked : v)))} />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-wrap gap-2">
            {item.status === "draft" && <Button onClick={() => updateStatus("under_review")}>Submit for Review</Button>}
            {item.status === "under_review" && (
              <>
                <Button onClick={() => updateStatus("approved")}>Approve</Button>
                <Button variant="outline" onClick={() => updateStatus("draft")}>Request Changes</Button>
                <Button variant="outline" onClick={() => updateStatus("rejected")}>Reject</Button>
              </>
            )}
            {item.status === "approved" && (
              <Button disabled={!allChecked} onClick={() => updateStatus("completed")}>
                {allChecked ? "Publish to Portal" : "Complete checklist to publish"}
              </Button>
            )}
            <Link to="/app/kyrios"><Button variant="ghost">Back to queue</Button></Link>
          </section>
        </>
      )}
    </PageShell>
  );
}
