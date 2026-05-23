import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ALL_FOUNDRY_YEARS = Array.from({ length: 20 }, (_, i) => 2006 + i);
const ALL_DIMENSIONS = ["price", "macro", "filings", "sentiment", "geopolitical", "shipping", "weather", "trends"];
const SUB_BRAINS = ["equities", "fixed_income", "derivatives", "fx_commodities", "digital_assets", "alternative"];
const SUB_BRAIN_LABELS: Record<string, string> = {
  equities: "Equities Sub-Brain",
  fixed_income: "Fixed Income Sub-Brain",
  derivatives: "Derivatives Sub-Brain",
  fx_commodities: "FX & Commodities Sub-Brain",
  digital_assets: "Digital Assets Sub-Brain",
  alternative: "Alternative Sub-Brain",
};

function sum(rows: Record<string, unknown>[], key: string) {
  return rows.reduce((acc, row) => acc + Number(row[key] ?? 0), 0);
}

function latest(rows: Record<string, unknown>[], key: string) {
  return rows.reduce<string | null>((acc, row) => {
    const value = typeof row[key] === "string" ? row[key] as string : null;
    return !acc || (value && value > acc) ? value : acc;
  }, null);
}

function uniq<T>(values: T[]) {
  return Array.from(new Set(values.filter((v) => v !== null && v !== undefined))) as NonNullable<T>[];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function fetchAll<T>(makeQuery: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>, pageSize = 1000) {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    out.push(...page);
    if (page.length < pageSize) break;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const auth = req.headers.get("Authorization") ?? "";
    const serviceKeys = [Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", Deno.env.get("SUPABASE_SECRET_KEYS") ?? "", Deno.env.get("SUPABASE_SECRET_KEY") ?? ""].filter(Boolean);
    const isServiceCall = serviceKeys.some((key) => auth === `Bearer ${key}` || req.headers.get("apikey") === key);

    if (!isServiceCall) {
      const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: auth } },
        auth: { persistSession: false },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ ok: false, error: "unauthorized" }, 401);
      const { data: isAdmin } = await service.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ ok: false, error: "forbidden" }, 403);
    }

    const [{ data: corpusRows, error: corpusError }, { data: runRows, error: runError }, { data: auditRows, error: auditError }] = await Promise.all([
      service
        .from("foundry_year_corpus")
        .select("year,dimension,sub_brain_id,platform,payload_bytes,indexed_bytes,content_units,fetched_at")
        .gte("year", 2006)
        .lte("year", 2025)
        .limit(200000),
      service
        .from("foundry_stage_runs")
        .select("stage_number,stage_key,stage_label,status,sub_brain_id,years,dimensions,rows_added,stored_bytes_added,indexed_bytes_added,content_units_added,training_cycles_added,accuracy,evidence,started_at,completed_at,created_at")
        .order("created_at", { ascending: false })
        .limit(10000),
      service
        .from("quantum_audits")
        .select("selected_asset_type,status,selected_symbol,ibm_backend,ibm_workload_id,result_summary,raw_result_metadata,created_at,completed_at")
        .in("selected_asset_type", ["subbrain", "synthesis", "year-audit", "final-audit"])
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (corpusError) return json({ ok: false, error: corpusError.message }, 500);
    if (runError) return json({ ok: false, error: runError.message }, 500);
    if (auditError) return json({ ok: false, error: auditError.message }, 500);

    const corpus = (corpusRows ?? []) as Record<string, unknown>[];
    const runs = (runRows ?? []) as Record<string, unknown>[];
    const audits = (auditRows ?? []) as Record<string, unknown>[];

    const bySubBrain = Object.fromEntries(SUB_BRAINS.map((id) => {
      const rows = corpus.filter((row) => (row.sub_brain_id ?? "unknown") === id);
      return [id, {
        sub_brain_id: id,
        label: SUB_BRAIN_LABELS[id],
        rows: rows.length,
        stored_bytes: sum(rows, "payload_bytes"),
        indexed_bytes: sum(rows, "indexed_bytes"),
        content_units: sum(rows, "content_units"),
        years: uniq(rows.map((row) => Number(row.year))).length,
        dimensions: uniq(rows.map((row) => String(row.dimension ?? ""))).filter(Boolean).length,
        platforms: uniq(rows.map((row) => String(row.platform ?? ""))).filter(Boolean),
        last_fetched: latest(rows, "fetched_at"),
      }];
    }));

    const byYear = Object.fromEntries(ALL_FOUNDRY_YEARS.map((year) => {
      const rows = corpus.filter((row) => Number(row.year) === year);
      return [year, {
        year,
        rows: rows.length,
        stored_bytes: sum(rows, "payload_bytes"),
        indexed_bytes: sum(rows, "indexed_bytes"),
        content_units: sum(rows, "content_units"),
        dimensions: uniq(rows.map((row) => String(row.dimension ?? ""))).filter(Boolean).length,
        sub_brains: uniq(rows.map((row) => String(row.sub_brain_id ?? ""))).filter(Boolean).length,
        last_fetched: latest(rows, "fetched_at"),
      }];
    }));

    const byDimension = Object.fromEntries(ALL_DIMENSIONS.map((dimension) => {
      const rows = corpus.filter((row) => row.dimension === dimension);
      return [dimension, {
        dimension,
        rows: rows.length,
        stored_bytes: sum(rows, "payload_bytes"),
        indexed_bytes: sum(rows, "indexed_bytes"),
        content_units: sum(rows, "content_units"),
        years: uniq(rows.map((row) => Number(row.year))).length,
        sub_brains: uniq(rows.map((row) => String(row.sub_brain_id ?? ""))).filter(Boolean).length,
        last_fetched: latest(rows, "fetched_at"),
      }];
    }));

    const stageKeys = uniq(runs.map((row) => `${row.stage_number}:${row.stage_key}`));
    const stageRunTotals = stageKeys.map((key) => {
      const rows = runs.filter((row) => `${row.stage_number}:${row.stage_key}` === key);
      const mostRecent = rows[0] ?? {};
      return {
        stage_number: Number(mostRecent.stage_number ?? 0),
        stage_key: String(mostRecent.stage_key ?? ""),
        stage_label: String(mostRecent.stage_label ?? ""),
        runs: rows.length,
        completed_runs: rows.filter((row) => row.status === "completed").length,
        failed_runs: rows.filter((row) => row.status === "failed").length,
        rows_added: sum(rows, "rows_added"),
        stored_bytes_added: sum(rows, "stored_bytes_added"),
        indexed_bytes_added: sum(rows, "indexed_bytes_added"),
        content_units_added: sum(rows, "content_units_added"),
        training_cycles_added: sum(rows, "training_cycles_added"),
        last_started_at: latest(rows, "started_at"),
        last_completed_at: latest(rows, "completed_at"),
        latest_accuracy: mostRecent.accuracy ?? null,
        latest_evidence: mostRecent.evidence ?? {},
      };
    }).sort((a, b) => a.stage_number - b.stage_number || a.stage_key.localeCompare(b.stage_key));

    const stageSummaries = [1, 2, 3, 4, 5].map((stage) => {
      const rows = runs.filter((row) => Number(row.stage_number) === stage);
      const auditCount = stage === 3
        ? audits.filter((row) => row.selected_asset_type === "synthesis").length
        : stage === 4
          ? audits.filter((row) => row.selected_asset_type === "year-audit").length
          : stage === 5
            ? audits.filter((row) => row.selected_asset_type === "final-audit").length
            : stage === 1
              ? audits.filter((row) => row.selected_asset_type === "subbrain").length
              : 0;
      return {
        stage_number: stage,
        runs: rows.length,
        completed_runs: rows.filter((row) => row.status === "completed").length,
        failed_runs: rows.filter((row) => row.status === "failed").length,
        rows_added: sum(rows, "rows_added"),
        stored_bytes_added: sum(rows, "stored_bytes_added"),
        indexed_bytes_added: sum(rows, "indexed_bytes_added"),
        content_units_added: sum(rows, "content_units_added"),
        training_cycles_added: sum(rows, "training_cycles_added"),
        years: uniq(rows.flatMap((row) => Array.isArray(row.years) ? row.years as number[] : [])).length,
        dimensions: uniq(rows.flatMap((row) => Array.isArray(row.dimensions) ? row.dimensions as string[] : [])).length,
        last_completed_at: latest(rows, "completed_at"),
        audit_runs: auditCount,
      };
    });

    const global = {
      rows: corpus.length,
      stored: sum(corpus, "payload_bytes"),
      indexed: sum(corpus, "indexed_bytes"),
      content_units: sum(corpus, "content_units"),
      years: uniq(corpus.map((row) => Number(row.year))).length,
      dimensions: uniq(corpus.map((row) => String(row.dimension ?? ""))).filter(Boolean).length,
      sub_brains: uniq(corpus.map((row) => String(row.sub_brain_id ?? ""))).filter(Boolean).length,
      last_fetched: latest(corpus, "fetched_at"),
    };

    return json({ ok: true, generated_at: new Date().toISOString(), global, bySubBrain, byYear, byDimension, stageRunTotals, stageSummaries, recentRuns: runs.slice(0, 30), quantumAudits: audits.slice(0, 30) });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
