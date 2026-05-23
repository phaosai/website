// 100-category deterministic Foundry brain rubric.
// Grouped, weighted, evaluated server-side in `foundry-grade-brain`.
// UI consumes the metadata (key, name, group, weight) and the per-category
// scores returned by the grader.

export type GradeGroupKey =
  | "A_corpus"        // 20 categories
  | "B_signal"        // 15
  | "C_walkforward"   // 15
  | "D_calibration"   // 10
  | "E_coverage"      // 10
  | "F_horizon"       // 8
  | "G_determinism"   // 7
  | "H_perf"          // 5
  | "I_compliance"    // 5
  | "J_resilience";   // 5

export interface GradeCategory {
  key: string;
  name: string;
  group: GradeGroupKey;
  weight: number;
}

export const GRADE_GROUPS: Record<GradeGroupKey, { label: string; color: string }> = {
  A_corpus:      { label: "Corpus Breadth",          color: "text-purple-300" },
  B_signal:      { label: "Signal Diversity",        color: "text-blue-300" },
  C_walkforward: { label: "Walk-Forward Accuracy",   color: "text-emerald-300" },
  D_calibration: { label: "PCI Calibration",         color: "text-amber-300" },
  E_coverage:    { label: "Asset / Platform Cov.",   color: "text-cyan-300" },
  F_horizon:     { label: "Horizon Coverage",        color: "text-pink-300" },
  G_determinism: { label: "Determinism",             color: "text-indigo-300" },
  H_perf:        { label: "Latency & Cost",          color: "text-orange-300" },
  I_compliance:  { label: "Compliance & Evidence",   color: "text-rose-300" },
  J_resilience:  { label: "Resilience",              color: "text-teal-300" },
};

const mk = (group: GradeGroupKey, key: string, name: string, weight = 1): GradeCategory =>
  ({ key, name, group, weight });

export const GRADE_CATEGORIES: GradeCategory[] = [
  // A. Corpus breadth (20)
  mk("A_corpus", "corpus_years_span",            "Years span coverage (2006–2025)", 2),
  mk("A_corpus", "corpus_total_rows",            "Total corpus rows"),
  mk("A_corpus", "corpus_stored_bytes",          "Stored payload bytes"),
  mk("A_corpus", "corpus_indexed_bytes",         "Indexed bytes"),
  mk("A_corpus", "corpus_dimensions_covered",    "Distinct dimensions covered"),
  mk("A_corpus", "corpus_sub_brains_active",     "Active sub-brains"),
  mk("A_corpus", "corpus_freshness",             "Corpus freshness (recency)"),
  mk("A_corpus", "corpus_year_density",          "Average rows per year"),
  mk("A_corpus", "corpus_source_diversity",      "Distinct source ids"),
  mk("A_corpus", "corpus_gap_count",             "Year/dimension gap count (inverse)"),
  mk("A_corpus", "corpus_edgar",                 "SEC EDGAR coverage", 2),
  mk("A_corpus", "corpus_xbrl",                  "SEC XBRL facts coverage", 2),
  mk("A_corpus", "corpus_macro",                 "FRED macro coverage"),
  mk("A_corpus", "corpus_gdelt",                 "GDELT geopolitical coverage"),
  mk("A_corpus", "corpus_shipping",              "Shipping/logistics coverage"),
  mk("A_corpus", "corpus_weather",               "Weather coverage"),
  mk("A_corpus", "corpus_trends",                "Search-trends coverage"),
  mk("A_corpus", "corpus_prices",                "Prices coverage"),
  mk("A_corpus", "corpus_geopolitical",          "Geopolitical events coverage"),
  mk("A_corpus", "corpus_balanced_sub_brains",   "Sub-brain balance (no starvation)"),

  // B. Signal diversity (15)
  mk("B_signal", "signal_active_categories",     "Active signal categories (60+)"),
  mk("B_signal", "signal_cross_corr_low",        "Cross-category correlation (inverse)"),
  mk("B_signal", "signal_redundancy_penalty",    "Redundancy penalty (inverse)"),
  mk("B_signal", "signal_novelty",               "Recent novel signal share"),
  mk("B_signal", "signal_breadth_score",         "Breadth across sub-brains"),
  mk("B_signal", "signal_depth_score",           "Depth within each sub-brain"),
  mk("B_signal", "signal_temporal_spread",       "Temporal spread of signals"),
  mk("B_signal", "signal_macro_micro_mix",       "Macro vs micro signal mix"),
  mk("B_signal", "signal_event_driven_share",    "Event-driven signal share"),
  mk("B_signal", "signal_structural_share",      "Structural signal share"),
  mk("B_signal", "signal_alt_data_share",        "Alt-data signal share"),
  mk("B_signal", "signal_fundamental_share",     "Fundamental signal share"),
  mk("B_signal", "signal_sentiment_share",       "Sentiment signal share"),
  mk("B_signal", "signal_volume_share",          "Volume/flow signal share"),
  mk("B_signal", "signal_regime_aware",          "Regime-aware signal share"),

  // C. Walk-forward accuracy (15)
  mk("C_walkforward", "wf_hit_1h",   "Hit rate · Next-Hour"),
  mk("C_walkforward", "wf_hit_7d",   "Hit rate · 7-Day"),
  mk("C_walkforward", "wf_hit_30d",  "Hit rate · 30-Day"),
  mk("C_walkforward", "wf_hit_90d",  "Hit rate · 90-Day"),
  mk("C_walkforward", "wf_hit_6m",   "Hit rate · 6-Month"),
  mk("C_walkforward", "wf_hit_1y",   "Hit rate · 1-Year", 2),
  mk("C_walkforward", "wf_hit_2y",   "Hit rate · 2-Year"),
  mk("C_walkforward", "wf_hit_3y",   "Hit rate · 3-Year"),
  mk("C_walkforward", "wf_hit_5y",   "Hit rate · 5-Year"),
  mk("C_walkforward", "wf_hit_10y",  "Hit rate · 10-Year"),
  mk("C_walkforward", "wf_catalyst_48h", "Catalyst impact · 48H"),
  mk("C_walkforward", "wf_aftershock_90d", "Aftershock · 90D"),
  mk("C_walkforward", "wf_stability", "Cycle-over-cycle stability"),
  mk("C_walkforward", "wf_drawdown",  "Predicted-tier drawdown control"),
  mk("C_walkforward", "wf_regime_robust", "Cross-regime robustness"),

  // D. PCI calibration (10)
  mk("D_calibration", "pci_band_error",          "Band-prediction error (inverse)"),
  mk("D_calibration", "pci_monotonicity",        "Score-to-return monotonicity"),
  mk("D_calibration", "pci_range_coverage",      "Expected-return-range coverage"),
  mk("D_calibration", "pci_tier_match",          "5-tier match accuracy"),
  mk("D_calibration", "pci_9band_match",         "9-band match accuracy"),
  mk("D_calibration", "pci_extreme_handling",    "Extreme bands (0,100) handling"),
  mk("D_calibration", "pci_neutral_50",          "Regime-Congestion (50) accuracy"),
  mk("D_calibration", "pci_negative_decay",      "Negative-decay accuracy"),
  mk("D_calibration", "pci_breakout_capture",    "Breakout capture"),
  mk("D_calibration", "pci_residual_bias_low",   "Residual bias (inverse)"),

  // E. Asset/platform coverage (10)
  mk("E_coverage", "asset_equities",   "Equities coverage"),
  mk("E_coverage", "asset_etfs",       "ETFs coverage"),
  mk("E_coverage", "asset_options",    "Options-eligible names"),
  mk("E_coverage", "asset_futures",    "Futures coverage"),
  mk("E_coverage", "asset_fx",         "FX coverage"),
  mk("E_coverage", "asset_crypto",     "Crypto coverage"),
  mk("E_coverage", "platform_ibkr",    "IBKR signal coverage"),
  mk("E_coverage", "platform_schwab_fidelity", "Schwab/Fidelity coverage"),
  mk("E_coverage", "platform_retail_brokers",  "Retail brokers (Robinhood etc.)"),
  mk("E_coverage", "platform_crypto_venues",   "Crypto venues (Coinbase/Kraken)"),

  // F. Horizon coverage (8)
  mk("F_horizon", "horizon_1h",  "Horizon present · 1H"),
  mk("F_horizon", "horizon_7d",  "Horizon present · 7D"),
  mk("F_horizon", "horizon_30d", "Horizon present · 30D"),
  mk("F_horizon", "horizon_90d", "Horizon present · 90D"),
  mk("F_horizon", "horizon_1y",  "Horizon present · 1Y"),
  mk("F_horizon", "horizon_5y",  "Horizon present · 5Y"),
  mk("F_horizon", "horizon_catalyst", "Horizon present · 48H Catalyst"),
  mk("F_horizon", "horizon_aftershock", "Horizon present · 90D Aftershock"),

  // G. Determinism (7)
  mk("G_determinism", "det_hash_stable",   "Same input → same PCI"),
  mk("G_determinism", "det_seed_stable",   "Seed stability"),
  mk("G_determinism", "det_drift_low",     "Cross-run drift (inverse)"),
  mk("G_determinism", "det_idempotent_ingest", "Idempotent ingest"),
  mk("G_determinism", "det_version_pinned", "Version-pinned brains"),
  mk("G_determinism", "det_audit_trail",   "Per-decision audit trail"),
  mk("G_determinism", "det_replayable",    "Replayability from corpus"),

  // H. Latency & cost (5)
  mk("H_perf", "perf_stage_p95",   "Stage p95 latency"),
  mk("H_perf", "perf_rows_per_sec","Ingest rows/sec"),
  mk("H_perf", "perf_api_budget",  "API budget adherence"),
  mk("H_perf", "perf_token_budget","AI-token budget adherence"),
  mk("H_perf", "perf_master_total","MASTER EXECUTE total time"),

  // I. Compliance & evidence (5)
  mk("I_compliance", "comp_citations",     "Every PCI cites sources"),
  mk("I_compliance", "comp_no_advice",     "No buy/sell advice strings"),
  mk("I_compliance", "comp_labels",        "SIMULATED/HISTORICAL labels present"),
  mk("I_compliance", "comp_disclaimers",   "Disclaimers present on outputs"),
  mk("I_compliance", "comp_evidence_links","Evidence links resolvable"),

  // J. Resilience (5)
  mk("J_resilience", "res_missing_year",   "Handles missing year"),
  mk("J_resilience", "res_partial_source", "Handles partial source"),
  mk("J_resilience", "res_stale_cache",    "Handles stale cache"),
  mk("J_resilience", "res_rate_limit",     "Handles rate-limited API"),
  mk("J_resilience", "res_schema_drift",   "Handles schema drift"),
];

if (GRADE_CATEGORIES.length !== 100) {
  // build-time sanity: keep the rubric exactly 100 categories.
  // eslint-disable-next-line no-console
  console.warn("Foundry rubric expected 100 categories, got", GRADE_CATEGORIES.length);
}

export const TOTAL_WEIGHT = GRADE_CATEGORIES.reduce((a, c) => a + c.weight, 0);

export const PROMOTE_THRESHOLD = 85;

export interface BrainGradeRow {
  category_key: string;
  category_name: string;
  group_key: GradeGroupKey;
  score: number;
  weight: number;
  evidence: Record<string, unknown>;
}

export interface BrainGradeSummary {
  overall: number;          // 0..100 weighted
  rows: BrainGradeRow[];
  promoted: boolean;
  promotion_reason: string;
  brain_name: string;
  brain_version: string;
  master_run_id: string;
}

export function gradeTierColor(score: number): string {
  if (score >= 85) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
  if (score >= 70) return "text-cyan-300 border-cyan-500/40 bg-cyan-500/10";
  if (score >= 50) return "text-amber-300 border-amber-500/40 bg-amber-500/10";
  if (score >= 30) return "text-orange-300 border-orange-500/40 bg-orange-500/10";
  return "text-rose-400 border-rose-500/40 bg-rose-500/10";
}

export function gradeTierLabel(score: number): string {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Constructive";
  if (score >= 50) return "Watch";
  if (score >= 30) return "Caution";
  return "Stand Aside";
}
