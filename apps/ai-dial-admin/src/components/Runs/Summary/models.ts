/** Aggregated test-case execution outcome counts for a run, derived from `eval_summaries`. */
export interface TestCaseStatusCounts {
  passed: number;
  failed: number;
  error: number;
  total: number;
}

/**
 * One bar group for a given statistic: the metric group name (the `metric_name` without its last
 * dotted segment) and its bars (leaf metric name → value for the selected statistic).
 */
export interface MetricScoreGroup {
  /** Metric group — `metric_name` up to the last `.`, e.g. `aidial_rag_eval.generation`. */
  name: string;
  /** Leaf metric name (after the last `.`) → value, e.g. `{ context_to_answer: 0.8 }`. */
  bars: Record<string, number>;
}

/** Parsed `metric_score_results` for a run: the statistic names plus the bar groups per statistic. */
export interface MetricScoresData {
  /** Distinct `metric_score_name` values (AVG/P10/…) in first-seen order — the SegmentedControl options. */
  statistics: string[];
  /** Bar groups keyed by statistic name. */
  byStatistic: Record<string, MetricScoreGroup[]>;
}

/** A single statistic value for the Distribution section's stat cards (e.g. `{ name: 'AVG', value: 0.8 }`). */
export interface MetricStatCard {
  name: string;
  value: number;
}

/** A selectable metric output field for the Overall Score card, from the run's metric snapshots. */
export interface MetricOption {
  /** UI label / dropdown value: `<metric>.<outputField>`, e.g. `DeepEval: Answer Relevancy.score`. */
  name: string;
  /** Flattened metric field to average, e.g. `metric::DeepEval: Answer Relevancy::score`. */
  field: string;
  /** Computation the snapshot belongs to; scopes the aggregate to a single computation. */
  computationId: string;
}
