import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface MasterRunRow {
  id: string;
  brain_name: string;
  brain_version: string;
  status: string;
  current_stage: number;
  stage_log: unknown[];
  overall_score: number | null;
  promoted: boolean;
  promotion_reason: string | null;
  started_at: string;
  finished_at: string | null;
}

interface Props {
  brainName: string;
  quantumMode: boolean;
  onRunUpdate: (run: MasterRunRow | null) => void;
}

const STAGE_LABELS = [
  "Idle",
  "Ingest",
  "Aggregate",
  "Walk-Forward",
  "Hyper-Forge",
  "Synthesis & Grade",
];

export function MasterExecuteButton({ brainName, quantumMode, onRunUpdate }: Props) {
  const [run, setRun] = useState<MasterRunRow | null>(null);
  const [launching, setLaunching] = useState(false);
  const isRunning = run?.status === "running";
  const disabled = launching || isRunning;

  const refreshRun = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("foundry_master_runs")
      .select("id,brain_name,brain_version,status,current_stage,stage_log,overall_score,promoted,promotion_reason,started_at,finished_at")
      .eq("id", id).maybeSingle();
    if (data) {
      const row = data as unknown as MasterRunRow;
      setRun(row);
      onRunUpdate(row);
    }
  }, [onRunUpdate]);

  // Resume any in-flight run on mount.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) return;
      const { data } = await supabase
        .from("foundry_master_runs")
        .select("id,brain_name,brain_version,status,current_stage,stage_log,overall_score,promoted,promotion_reason,started_at,finished_at")
        .eq("user_id", u.user.id).order("started_at", { ascending: false }).limit(1).maybeSingle();
      if (mounted && data) {
        setRun(data as unknown as MasterRunRow);
        onRunUpdate(data as unknown as MasterRunRow);
      }
    })();
    return () => { mounted = false; };
  }, [onRunUpdate]);

  // Poll while running.
  useEffect(() => {
    if (!run?.id || run.status !== "running") return;
    const id = setInterval(() => refreshRun(run.id), 4000);
    return () => clearInterval(id);
  }, [run?.id, run?.status, refreshRun]);

  async function launch() {
    if (disabled) return;
    setLaunching(true);
    try {
      // Auto-fill brain name if missing — Master Execute should never be a
      // dead button. Quantum is forced ON for Master runs.
      const effectiveName = brainName.trim() || `Master-${new Date().toISOString().slice(0, 10)}`;
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        toast({ title: "Sign in required", description: "Log in as admin to run MASTER EXECUTE.", variant: "destructive" });
        return;
      }
      toast({ title: "MASTER EXECUTE starting…", description: `Brain "${effectiveName}" · launching 5 stages.` });
      const { data, error } = await supabase.functions.invoke("foundry-master-execute", {
        body: { brain_name: effectiveName, quantum_mode: true },
      });
      if (error) throw error;
      const payload = data as { run_id?: string; error?: string } | null;
      if (payload?.error) throw new Error(payload.error);
      const runId = payload?.run_id;
      if (!runId) throw new Error("No run id returned from server");
      toast({ title: "MASTER EXECUTE running", description: "5 stages, up to 5 min each. Progress updates here." });
      await refreshRun(runId);
    } catch (e) {
      const msg = (e as Error).message || "Failed to start";
      toast({ title: "Could not start MASTER EXECUTE", description: msg, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  }

  const stageLabel = STAGE_LABELS[run?.current_stage ?? 0] ?? "Idle";

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        onClick={launch}
        disabled={disabled}
        className={cn(
          "gap-1 font-semibold uppercase tracking-wider",
          "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground hover:opacity-90",
        )}
      >
        {launching || isRunning
          ? <Loader2 className="size-3 animate-spin" />
          : run?.status === "completed"
            ? <CheckCircle2 className="size-3" />
            : <Rocket className="size-3" />}
        {launching
          ? "Launching…"
          : isRunning
            ? `Master · Stage ${run.current_stage}/5 · ${stageLabel}`
            : "Master Execute"}
      </Button>
      {!quantumMode && !isRunning && (
        <span className="text-[10px] text-amber-400 flex items-center gap-1">
          <AlertTriangle className="size-3" /> Quantum will auto-engage on launch
        </span>
      )}
    </div>
  );
}
