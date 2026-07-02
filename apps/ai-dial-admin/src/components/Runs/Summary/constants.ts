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
export const OVERALL_SCORE_ALIAS = 'value';
export const BUCKET_ALIAS = 'bucket';
export const BUCKET_COUNT_ALIAS = 'cnt';

/** Distribution histogram bucketing: `width_bucket(field, 0, 1.01, 10)` over the 0–1 score range. */
export const HISTOGRAM_LOWER_BOUND = '0';
export const HISTOGRAM_UPPER_BOUND = '1.01';
export const HISTOGRAM_BUCKET_COUNT = 10;

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
