/** Structured-query entity + column names for the run analytics cards (backend `eval_summaries`). */
export const EVAL_SUMMARIES_ENTITY = 'eval_summaries';

/** Entity + columns for the pre-computed metric-score statistics (backend `metric_score_result`). */
export const METRIC_SCORE_RESULTS_ENTITY = 'metric_score_results';
export const METRIC_NAME_FIELD = 'metric_name';
export const METRIC_SCORE_NAME_FIELD = 'metric_score_name';
export const VALUE_FIELD = 'value';
/** Sentinel resolved server-side to the run's latest computation for `metric_score_results` queries. */
export const LATEST_COMPUTATION = 'latest';

export const RUN_ID_FIELD = 'test_suite_run_id';
export const COMPUTATION_ID_FIELD = 'computation_id';
export const EXECUTION_STATUS_FIELD = 'execution_status';
export const EXEC_DURATION_MS_FIELD = 'exec_duration_ms';

/** Aggregate output aliases requested from the query. */
export const COUNT_ALIAS = 'count';
export const AVG_DURATION_ALIAS = 'avg_duration_ms';

/** `metric_score_name` value for the run-level overall score; excluded from the Metric Scores segmented control. */
export const OVERALL_METRIC_SCORE_NAME = 'overall';

/**
 * Distribution histogram: the raw metric-score values are fetched and passed straight to
 * `DialAnalyticsHistogram`, which buckets them into its 12 columns — a dedicated exact-`0` bucket,
 * the ten 0.1-wide bands (`0-0.1` … `0.9-1`), and an exact-`1` band. `DISTRIBUTION_VALUE_ALIAS` is
 * the result column alias; `DISTRIBUTION_ROW_LIMIT` caps how many test-case rows are fetched.
 */
export const DISTRIBUTION_VALUE_ALIAS = 'value';
export const DISTRIBUTION_ROW_LIMIT = 10000;

/** Flattened metric field family: `metric::<metricName>::<outputField>` (backend column naming). */
export const METRIC_FIELD_PREFIX = 'metric';
export const METRIC_FIELD_SEPARATOR = '::';
/** Preferred metric output field for the overall score; falls back to the first output field. */
export const DEFAULT_METRIC_SCORE_FIELD = 'score';

/**
 * Tailwind text-color tokens for the "Test Cases Passed" card status breakdown
 * (accent-secondary #37BABC, error #F76464, secondary #9FA6BD).
 */
export const STATUS_DOT_CLASSES = {
  pass: 'text-accent-secondary',
  fail: 'text-error',
  error: 'text-secondary',
} as const;
