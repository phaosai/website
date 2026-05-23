import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { GRADE_CATEGORIES, GRADE_GROUPS, gradeTierColor, gradeTierLabel, PROMOTE_THRESHOLD, type GradeGroupKey } from "@/lib/foundryGrading";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { MasterRunRow } from "./MasterExecuteButton";

interface GradeRow {
  category_key: string;
  category_name: string;
  group_key: GradeGroupKey;
  score: number;
  weight: number;
}

interface Props { run: MasterRunRow | null; }

export function BrainGradeCard({ run }: Props) {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [filterGroup, setFilterGroup] = useState<GradeGroupKey | "all">("all");

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const { data } = await supabase.from("foundry_brain_grades")
      .select("category_key,category_name,group_key,score,weight")
      .eq("master_run_id", id).order("group_key").order("score", { ascending: false });
    setGrades((data ?? []) as GradeRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (run?.id && run.status === "completed") load(run.id);
    else setGrades([]);
  }, [run?.id, run?.status, load]);

  async function correctAndImprove() {
    if (!run?.id) return;
    setImproving(true);
    try {
      const { error } = await supabase.functions.invoke("foundry-correct-improve", {
        body: { master_run_id: run.id },
      });
      if (error) throw error;
      toast({ title: "CORRECT & IMPROVE complete", description: "Weakest categories targeted. Reloading grade." });
      await load(run.id);
    } catch (e) {
      toast({ title: "Improve failed", description: (e as Error).message, variant: "destructive" });
    } finally { setImproving(false); }
  }

  if (!run) return null;
  if (run.status === "running") {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Loader2 className="size-4 animate-spin" /> Master · Stage {run.current_stage}/5
          </CardTitle>
          <CardDescription>
            Brain "{run.brain_name}" {run.brain_version} — work persists every stage. Each stage caps at 5 minutes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  if (run.status === "failed") {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Master Execute failed</CardTitle>
          <CardDescription>{run.promotion_reason ?? "Unknown error"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const overall = run.overall_score ?? 0;
  const tierColor = gradeTierColor(overall);
  const tierLabel = gradeTierLabel(overall);
  const filtered = filterGroup === "all" ? grades : grades.filter((g) => g.group_key === filterGroup);

  // Group averages.
  const groupAvgs = (Object.keys(GRADE_GROUPS) as GradeGroupKey[]).map((g) => {
    const inG = grades.filter((x) => x.group_key === g);
    const w = inG.reduce((a, b) => a + b.weight, 0);
    const avg = w ? inG.reduce((a, b) => a + b.score * b.weight, 0) / w : 0;
    return { group: g, avg: Math.round(avg), count: inG.length };
  });

  return (
    <Card className="border-border/40 bg-card/40">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Brain Grade — "{run.brain_name}" {run.brain_version}
            </CardTitle>
            <CardDescription>
              {GRADE_CATEGORIES.length} deterministic categories · SIMULATED · research validation only, not investment advice.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("flex flex-col items-center rounded-lg border px-4 py-2", tierColor)}>
              <span className="text-3xl font-bold tabular-nums">{overall}</span>
              <span className="text-[10px] uppercase tracking-wider">{tierLabel}</span>
            </div>
            <Button size="sm" variant="outline" onClick={correctAndImprove} disabled={improving} className="gap-1">
              {improving ? <Loader2 className="size-3 animate-spin" /> : <ShieldCheck className="size-3" />}
              Correct & Improve
            </Button>
          </div>
        </div>
        <div className="mt-2">
          {run.promoted ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40">
              ✓ Promoted to Live Sunesis · {run.promotion_reason}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400">
              Held · {run.promotion_reason ?? `score ${overall} < ${PROMOTE_THRESHOLD}`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Group summary chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterGroup("all")}
            className={cn("rounded-full border px-3 py-1 text-[11px]",
              filterGroup === "all" ? "border-primary/60 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground")}
          >
            All · {grades.length}
          </button>
          {groupAvgs.map((g) => (
            <button
              key={g.group}
              onClick={() => setFilterGroup(g.group)}
              className={cn("rounded-full border px-3 py-1 text-[11px]",
                filterGroup === g.group ? "border-primary/60 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground")}
            >
              {GRADE_GROUPS[g.group].label}: <span className="font-mono ml-1">{g.avg}</span>
            </button>
          ))}
        </div>

        {/* Category list */}
        <div className="max-h-[420px] overflow-y-auto rounded border border-border/30">
          {loading && <div className="p-4 text-sm text-muted-foreground">Loading grades…</div>}
          {!loading && filtered.map((g) => (
            <div key={g.category_key} className="grid grid-cols-[1fr_auto_120px] items-center gap-3 border-b border-border/20 px-3 py-2 last:border-0">
              <div className="min-w-0">
                <div className="text-sm truncate">{g.category_name}</div>
                <div className="text-[10px] text-muted-foreground">{GRADE_GROUPS[g.group_key].label} · w{g.weight}</div>
              </div>
              <div className={cn("rounded px-2 py-0.5 text-xs font-mono border", gradeTierColor(g.score))}>{g.score}</div>
              <div className="h-1.5 w-full overflow-hidden rounded bg-muted/30">
                <div className="h-full bg-primary/70" style={{ width: `${g.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
