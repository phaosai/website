import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, PCITierBadge } from "@/components/app/PageShell";
import { StatusBadge } from "./KyriosQueue";
import { toast } from "sonner";

type WfStatus = "draft" | "under_review" | "approved" | "completed" | "rejected";

const COMPLIANCE_ITEMS = [
  { key: "pci_disclaimer", label: "PCI disclaimer included" },
  { key: "sources", label: "Source citations present" },
  { key: "historical_labeled", label: "Historical examples labeled" },
  { key: "not_advice", label: '"Not investment advice" statement present' },
  { key: "freshness", label: "Data freshness acceptable" },
];

export default function KyriosWorkflow() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [research, setResearch] = useState<any>(null);
  const [memo, setMemo] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    const { data: wf } = await supabase.from("workflow_items").select("*").eq("id", id).maybeSingle();
    setItem(wf);
    if (!wf) return;
    setChecks((wf.compliance_checklist as Record<string, boolean>) ?? {});

    const [{ data: ev }, { data: nt }, r, m] = await Promise.all([
      supabase
        .from("workflow_events")
        .select("*")
        .eq("workflow_item_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("workflow_notes")
        .select("*")
        .eq("workflow_item_id", id)
        .order("created_at", { ascending: true }),
      wf.research_item_id
        ? supabase.from("research_items").select("*").eq("id", wf.research_item_id).maybeSingle()
        : Promise.resolve({ data: null }),
      wf.truth_memo_id
        ? supabase.from("truth_memos").select("*").eq("id", wf.truth_memo_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setEvents(ev ?? []);
    setNotes(nt ?? []);
    setResearch(r.data);
    setMemo(m.data);
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const transition = async (next: WfStatus, action: string) => {
    if (!id || !item || !user) return;
    setBusy(true);
    const { error } = await supabase.from("workflow_items").update({ status: next }).eq("id", id);
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    await supabase.from("workflow_events").insert({
      workflow_item_id: id,
      organization_id: item.organization_id,
      user_id: user.id,
      action,
      from_status: item.status,
      to_status: next,
    });
    setBusy(false);
    toast.success(`Marked as ${next.replace("_", " ")}`);
    await reload();
  };

  const saveChecklist = async (key: string, value: boolean) => {
    const next = { ...checks, [key]: value };
    setChecks(next);
    if (!id) return;
    await supabase.from("workflow_items").update({ compliance_checklist: next }).eq("id", id);
  };

  const addNote = async () => {
    if (!id || !item || !user || !newNote.trim()) return;
    const body = newNote.trim();
    setNewNote("");
    const { error } = await supabase.from("workflow_notes").insert({
      workflow_item_id: id,
      organization_id: item.organization_id,
      user_id: user.id,
      body,
    });
    if (error) return toast.error(error.message);
    await reload();
  };

  const allChecked = COMPLIANCE_ITEMS.every((c) => checks[c.key]);

  return (
    <PageShell
      title="Workflow detail"
      description={item?.title}
      minTier="kyrios"
      actions={item && <StatusBadge status={item.status} />}
    >
      {!item ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-card/50 p-5">
            <h2 className="text-sm font-semibold">Research summary</h2>
            <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
              <Cell label="Ticker">
                <span className="font-mono">{research?.ticker ?? "—"}</span>
              </Cell>
              <Cell label="Company">{research?.company_name ?? "—"}</Cell>
              <Cell label="PCI">
                <PCITierBadge score={research?.pci_score} />
              </Cell>
            </div>
          </section>

          {memo && (
            <section className="rounded-xl border border-border bg-card/50 p-5">
              <h2 className="text-sm font-semibold mb-2">Memo</h2>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{memo.content || "—"}</p>
            </section>
          )}

          {/* Approval timeline (append-only) */}
          <section className="rounded-xl border border-border bg-card/50 p-5">
            <h2 className="text-sm font-semibold">Approval history</h2>
            <ol className="mt-3 space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="text-xs text-muted-foreground w-40 shrink-0">
                  {new Date(item.created_at).toLocaleString()}
                </span>
                <span>Created · status: draft</span>
              </li>
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="text-xs text-muted-foreground w-40 shrink-0">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                  <span className="capitalize">
                    {e.action.replace("_", " ")} · {e.from_status} → {e.to_status}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground italic">
              Append-only audit record. Entries cannot be edited or deleted.
            </p>
          </section>

          {/* Reviewer notes */}
          <section className="rounded-xl border border-border bg-card/50 p-5">
            <h2 className="text-sm font-semibold">Reviewer notes</h2>
            <ul className="mt-3 space-y-3">
              {notes.length === 0 && <li className="text-sm text-muted-foreground">No notes yet.</li>}
              {notes.map((n) => (
                <li key={n.id} className="text-sm border-l-2 border-border pl-3">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                    {new Date(n.created_at).toLocaleString()} · {n.user_id?.slice(0, 8)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Leave a reviewer note…"
                rows={2}
                className="text-sm"
              />
              <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>
                Add note
              </Button>
            </div>
          </section>

          {/* Compliance checklist (persisted) */}
          <section className="rounded-xl border border-border bg-card/50 p-5">
            <h2 className="text-sm font-semibold mb-3">Compliance checklist</h2>
            <ul className="space-y-2 text-sm">
              {COMPLIANCE_ITEMS.map((c) => (
                <li key={c.key} className="flex items-center gap-2">
                  <input
                    id={c.key}
                    type="checkbox"
                    checked={!!checks[c.key]}
                    onChange={(e) => saveChecklist(c.key, e.target.checked)}
                  />
                  <label htmlFor={c.key}>{c.label}</label>
                </li>
              ))}
            </ul>
          </section>

          {/* Actions */}
          <section className="flex flex-wrap gap-2">
            {item.status === "draft" && (
              <Button onClick={() => transition("under_review", "submit_for_review")} disabled={busy}>
                Submit for Review
              </Button>
            )}
            {item.status === "under_review" && (
              <>
                <Button onClick={() => transition("approved", "approve")} disabled={busy}>
                  Approve
                </Button>
                <Button variant="outline" onClick={() => transition("draft", "request_changes")} disabled={busy}>
                  Request Changes
                </Button>
                <Button variant="outline" onClick={() => transition("rejected", "reject")} disabled={busy}>
                  Reject
                </Button>
              </>
            )}
            {item.status === "approved" && (
              <Button disabled={!allChecked || busy} onClick={() => transition("completed", "publish")}>
                {allChecked ? "Publish to Portal" : "Complete checklist to publish"}
              </Button>
            )}
            <Link to="/app/kyrios">
              <Button variant="ghost">Back to queue</Button>
            </Link>
          </section>
        </>
      )}
    </PageShell>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}
