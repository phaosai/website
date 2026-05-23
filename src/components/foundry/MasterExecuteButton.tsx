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
  const disabled = launching || !brainName.trim() || !quantumMode || (run?.status === "running");

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
      const { data, error } = await supabase.functions.invoke("foundry-master-execute", {
        body: { brain_name: brainName.trim(), quantum_mode: quantumMode },
      });
      if (error) throw error;
      const runId = (data as { run_id?: string })?.run_id;
      if (runId) {
        toast({ title: "MASTER EXECUTE started", description: `Brain "${brainName.trim()}" — 5 stages, up to 5 min each.` });
        await refreshRun(runId);
      }
    } catch (e) {
      const msg = (e as Error).message || "Failed to start";
      toast({ title: "Could not start", description: msg, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  }

  const isRunning = run?.status === "running";
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
        {isRunning ? `Master · Stage ${run.current_stage}/5 · ${stageLabel}` : "Master Execute"}
      </Button>
      {!quantumMode && (
        <span className="text-[10px] text-amber-400 flex items-center gap-1">
          <AlertTriangle className="size-3" /> Toggle Quantum Mode ON
        </span>
      )}
      {!brainName.trim() && quantumMode && (
        <span className="text-[10px] text-muted-foreground">Name the brain below</span>
      )}
    </div>
  );
}
