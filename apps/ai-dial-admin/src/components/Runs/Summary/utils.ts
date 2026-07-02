import { JSONSchema7 } from 'json-schema';

import { MetricSnapshot } from '@/src/models/evaluation/metric';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';
import { SortDir, StructuredQuery, StructuredQueryResult, ValueType } from '@/src/models/evaluation/structured-query';
import { aggregateQuery, and, col, eq, field, fn, rowQuery, sortItem, value } from '@/src/utils/structured-query/build';
import {
  AVG_DURATION_ALIAS,
  BUCKET_ALIAS,
  BUCKET_COUNT_ALIAS,
  COMPUTATION_ID_FIELD,
  COUNT_ALIAS,
  DEFAULT_METRIC_SCORE_FIELD,
  EVAL_SUMMARIES_ENTITY,
  EXEC_DURATION_MS_FIELD,
  EXECUTION_STATUS_FIELD,
  HISTOGRAM_BUCKET_COUNT,
  HISTOGRAM_LOWER_BOUND,
  HISTOGRAM_UPPER_BOUND,
  LATEST_COMPUTATION,
  METRIC_FIELD_PREFIX,
  METRIC_FIELD_SEPARATOR,
  METRIC_NAME_FIELD,
  METRIC_SCORE_NAME_FIELD,
  METRIC_SCORE_RESULTS_ENTITY,
  OVERALL_SCORE_ALIAS,
  RUN_ID_FIELD,
  VALUE_FIELD,
} from './constants';
import { MetricOption, MetricScoreGroup, MetricScoresData, MetricStatCard, TestCaseStatusCounts } from './models';

/**
 * Query: count of test-case eval summaries grouped by execution status within a run.
 * Rows shape: `{ execution_status: string, count: number }`.
 */
export const buildTestCasesStatusQuery = (runId: string): StructuredQuery =>
  aggregateQuery({
    entity: EVAL_SUMMARIES_ENTITY,
    filter: eq(RUN_ID_FIELD, ValueType.Uuid, runId),
    groupBy: [EXECUTION_STATUS_FIELD],
    select: [col(field(EXECUTION_STATUS_FIELD)), col(fn('count'), COUNT_ALIAS)],
  });

/**
 * Query: average execution duration (ms) across a run's test-case eval summaries.
 * Rows shape: `[{ avg_duration_ms: number }]`.
 */
export const buildAvgRunTimeQuery = (runId: string): StructuredQuery =>
  aggregateQuery({
    entity: EVAL_SUMMARIES_ENTITY,
    filter: eq(RUN_ID_FIELD, ValueType.Uuid, runId),
    select: [col(fn('avg', [field(EXEC_DURATION_MS_FIELD)]), AVG_DURATION_ALIAS)],
  });

/** Builds the flattened metric field path, e.g. `metric::Ragas Answer Relevancy::score`. */
export const getMetricFieldPath = (metricName: string, outputField: string): string =>
  [METRIC_FIELD_PREFIX, metricName, outputField].join(METRIC_FIELD_SEPARATOR);

/** A metric's numeric output fields (its `outputSchema` properties); falls back to `score`. */
export const getMetricOutputFields = (outputSchema?: JSONSchema7): string[] => {
  const keys = outputSchema?.properties ? Object.keys(outputSchema.properties) : [];
  return keys.length > 0 ? keys : [DEFAULT_METRIC_SCORE_FIELD];
};

/**
 * Expands run metric snapshots into selectable Overall Score options — one per metric output field.
 * `name` is the UI label (`<metric>.<field>`, e.g. `DeepEval: Answer Relevancy.score`); `field` is the
 * request path (`metric::<metric>::<field>`). Snapshots without a name/computation are skipped.
 */
export const toMetricOptions = (snapshots: MetricSnapshot[] | null): MetricOption[] => {
  const options: MetricOption[] = [];

  for (const snapshot of snapshots ?? []) {
    if (!snapshot.tsmdName || !snapshot.computationId) {
      continue;
    }
    for (const outputField of getMetricOutputFields(snapshot.outputSchema)) {
      options.push({
        name: `${snapshot.tsmdName}.${outputField}`,
        field: getMetricFieldPath(snapshot.tsmdName, outputField),
        computationId: snapshot.computationId,
      });
    }
  }

  return options;
};

/**
 * Query: average of a metric's score across a run's eval summaries, scoped to one computation.
 * Values are inlined (the public execute endpoint is paramless). Rows shape: `[{ value: number }]`.
 */
export const buildOverallScoreQuery = (runId: string, option: MetricOption): StructuredQuery =>
  aggregateQuery({
    entity: EVAL_SUMMARIES_ENTITY,
    filter: and([
      eq(RUN_ID_FIELD, ValueType.Uuid, runId),
      eq(COMPUTATION_ID_FIELD, ValueType.Uuid, option.computationId),
    ]),
    select: [col(fn('avg', [field(option.field)]), OVERALL_SCORE_ALIAS)],
  });

/** Reads the single overall-score value, rounded to two decimals, or null when absent. */
export const parseOverallScore = (result: StructuredQueryResult | null): number | null => {
  const raw = result?.rows?.[0]?.[OVERALL_SCORE_ALIAS];
  if (raw == null) {
    return null;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : null;
};

/**
 * Query: pre-computed metric-score statistics for a run's latest computation. `computation_id` uses
 * the `"latest"` sentinel, which the backend resolves to the run's latest computation for this entity.
 * Rows shape: `[{ metric_name, metric_score_name, value }]`.
 */
export const buildMetricScoresQuery = (runId: string): StructuredQuery =>
  rowQuery({
    entity: METRIC_SCORE_RESULTS_ENTITY,
    select: [col(field(METRIC_NAME_FIELD)), col(field(METRIC_SCORE_NAME_FIELD)), col(field(VALUE_FIELD))],
    filter: and([
      eq(RUN_ID_FIELD, ValueType.Uuid, runId),
      eq(COMPUTATION_ID_FIELD, ValueType.Uuid, LATEST_COMPUTATION),
    ]),
    sort: [sortItem(METRIC_NAME_FIELD, SortDir.Asc), sortItem(METRIC_SCORE_NAME_FIELD, SortDir.Asc)],
  });

/**
 * Splits a dotted `metric_name` into its group (everything before the last `.`) and leaf bar name
 * (after the last `.`), e.g. `aidial_rag_eval.generation.context_to_answer` →
 * `{ group: 'aidial_rag_eval.generation', bar: 'context_to_answer' }`. Names without a `.` map to
 * themselves for both.
 */
export const splitMetricName = (metricName: string): { group: string; bar: string } => {
  const lastDot = metricName.lastIndexOf('.');
  if (lastDot < 0) {
    return { group: metricName, bar: metricName };
  }
  return { group: metricName.slice(0, lastDot), bar: metricName.slice(lastDot + 1) };
};

/**
 * Folds `metric_score_results` rows into bar groups per statistic. For each statistic
 * (`metric_score_name`, e.g. AVG), metrics are grouped by their name prefix (before the last `.`),
 * and each leaf metric name becomes a bar with its value. Also collects the distinct statistic
 * names (first-seen order) that drive the statistic SegmentedControl.
 */
export const parseMetricScores = (result: StructuredQueryResult | null): MetricScoresData => {
  const statistics: string[] = [];
  const byStatistic: Record<string, MetricScoreGroup[]> = {};

  for (const row of result?.rows ?? []) {
    const metricName = row[METRIC_NAME_FIELD];
    const statName = row[METRIC_SCORE_NAME_FIELD];
    const value = Number(row[VALUE_FIELD]);
    if (typeof metricName !== 'string' || typeof statName !== 'string' || !Number.isFinite(value)) {
      continue;
    }

    if (!statistics.includes(statName)) {
      statistics.push(statName);
      byStatistic[statName] = [];
    }

    const { group: groupName, bar: barName } = splitMetricName(metricName);
    const groups = byStatistic[statName];
    let group = groups.find((entry) => entry.name === groupName);
    if (!group) {
      group = { name: groupName, bars: {} };
      groups.push(group);
    }
    group.bars[barName] = value;
  }

  return { statistics, byStatistic };
};

/**
 * Query: score distribution for a metric across a run's eval summaries, bucketed server-side with
 * `width_bucket(field, 0, 1.01, 10)`. Rows shape: `[{ bucket, cnt }]` — bucket index 1..10.
 */
export const buildDistributionQuery = (runId: string, metricField: string): StructuredQuery =>
  aggregateQuery({
    entity: EVAL_SUMMARIES_ENTITY,
    filter: eq(RUN_ID_FIELD, ValueType.Uuid, runId),
    select: [
      col(
        fn('width_bucket', [
          field(metricField),
          value(ValueType.Decimal, HISTOGRAM_LOWER_BOUND),
          value(ValueType.Decimal, HISTOGRAM_UPPER_BOUND),
          value(ValueType.Integer, String(HISTOGRAM_BUCKET_COUNT)),
        ]),
        BUCKET_ALIAS,
      ),
      col(fn('count'), BUCKET_COUNT_ALIAS),
    ],
    groupBy: [BUCKET_ALIAS],
    sort: [sortItem(BUCKET_ALIAS, SortDir.Asc)],
  });

/**
 * Expands bucketed distribution rows into a flat value list for `DialAnalyticsHistogram`, which
 * re-buckets raw values into its 10 color bands (0–1). Each bucket contributes `cnt` values at its
 * midpoint, so the histogram's columns reproduce the server-side buckets.
 */
export const parseHistogramValues = (result: StructuredQueryResult | null): number[] => {
  const values: number[] = [];
  for (const row of result?.rows ?? []) {
    const bucket = Number(row[BUCKET_ALIAS]);
    const count = Number(row[BUCKET_COUNT_ALIAS]);
    if (!Number.isFinite(bucket) || !Number.isFinite(count) || count <= 0) {
      continue;
    }
    const clamped = Math.min(HISTOGRAM_BUCKET_COUNT, Math.max(1, bucket));
    const midpoint = (clamped - 0.5) / HISTOGRAM_BUCKET_COUNT;
    for (let i = 0; i < count; i += 1) {
      values.push(midpoint);
    }
  }
  return values;
};

/**
 * Extracts the per-statistic values for a single metric from the left-section metric scores, for the
 * Distribution stat cards. `metricName` matches a `MetricOption.name` (`<metric>.<field>`), which the
 * backend also uses as `metric_score_result.metric_name`.
 */
export const getMetricStatCards = (data: MetricScoresData | null, metricName: string | null): MetricStatCard[] => {
  if (!data || !metricName) {
    return [];
  }
  const { group, bar } = splitMetricName(metricName);
  const cards: MetricStatCard[] = [];
  for (const statistic of data.statistics) {
    const statValue = (data.byStatistic[statistic] ?? []).find((entry) => entry.name === group)?.bars[bar];
    if (statValue != null) {
      cards.push({ name: statistic, value: statValue });
    }
  }
  return cards;
};

const toCount = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Folds status-grouped rows into pass/fail/error buckets. SUCCESS → passed, ERROR → error,
 * everything else (FAILED, TIMEOUT) → failed, so the buckets always sum to the total.
 */
export const parseTestCaseStatusCounts = (result: StructuredQueryResult | null): TestCaseStatusCounts => {
  const counts: TestCaseStatusCounts = { passed: 0, failed: 0, error: 0, total: 0 };

  for (const row of result?.rows ?? []) {
    const status = row[EXECUTION_STATUS_FIELD];
    const count = toCount(row[COUNT_ALIAS]);
    counts.total += count;

    if (status === ExtractionResultStatus.SUCCESS) {
      counts.passed += count;
    } else if (status === ExtractionResultStatus.ERROR) {
      counts.error += count;
    } else {
      counts.failed += count;
    }
  }

  return counts;
};

/** Reads the single average-duration value, rounded to a whole millisecond, or null when absent. */
export const parseAvgRunTimeMs = (result: StructuredQueryResult | null): number | null => {
  const raw = result?.rows?.[0]?.[AVG_DURATION_ALIAS];
  if (raw == null) {
    return null;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? Math.round(num) : null;
};
