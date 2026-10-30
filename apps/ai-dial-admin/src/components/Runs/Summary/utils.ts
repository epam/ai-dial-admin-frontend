import { JSONSchema7 } from 'json-schema';

import { sortMetricStatistics } from '@/src/components/Common/MetricStatistics/utils';
import { DialModelPricing } from '@/src/models/dial/model';
import { Metric, MetricSnapshot } from '@/src/models/evaluation/metric';
import { ExtractionResultStatus, RunTotalCosts } from '@/src/models/evaluation/run';
import { MetricScoreValue } from '@/src/models/evaluation/run-comparison';
import { SortDir, StructuredQuery, StructuredQueryResult, ValueType } from '@/src/models/evaluation/structured-query';
import {
  aggregateQuery,
  and,
  col,
  eq,
  field,
  fn,
  inValues,
  not,
  offsetPage,
  rowQuery,
  sortItem,
} from '@/src/utils/structured-query/build';
import {
  COMPUTATION_ID_FIELD,
  COUNT_ALIAS,
  DEFAULT_METRIC_SCORE_FIELD,
  DISTRIBUTION_ROW_LIMIT,
  DISTRIBUTION_VALUE_ALIAS,
  EVAL_SUMMARIES_ENTITY,
  EVAL_SUMMARY_ID_FIELD,
  EXEC_DURATION_MS_FIELD,
  EXECUTION_STATUS_FIELD,
  PASSED_FIELD,
  LATEST_COMPUTATION,
  METRIC_EVAL_DURATION_MS_FIELD,
  METRIC_FIELD_PREFIX,
  METRIC_FIELD_SEPARATOR,
  METRIC_NAME_FIELD,
  METRIC_SCORE_NAME_FIELD,
  METRIC_SCORE_RESULTS_ENTITY,
  OVERALL_METRIC_SCORE_NAME,
  RUN_ID_FIELD,
  TEST_CASE_EVAL_SCORES_ENTITY,
  TEST_CASE_ID_FIELD,
  TOTAL_DURATION_ALIAS,
  TOTAL_METRIC_EVAL_DURATION_ALIAS,
  VALUE_FIELD,
} from './constants';
import {
  CompletionBreakdown,
  MetricInfo,
  MetricOption,
  MetricScoreGroup,
  MetricScoresData,
  MetricStatCard,
  MetricStatistic,
  RunCostFigures,
  TestCaseStatusCounts,
} from './models';
import { toCount } from '@/src/utils/formatting/number-formatting';

/**
 * Query: count of test-case eval scores grouped by threshold `passed` and execution status.
 * Rows shape: `{ passed: boolean | null, execution_status: string, count: number }`.
 * When `excludeTestCaseIds` is non-empty, those test cases are excluded via
 * `NOT (test_case_id IN [...])` so counts describe the matched-only population used in run
 * comparison (backed by the backend's `unmatchedEvalTestCaseIds`).
 */
export const buildTestCasesStatusQuery = (runId: string, excludeTestCaseIds: string[] = []): StructuredQuery => {
  const runFilter = eq(RUN_ID_FIELD, ValueType.Uuid, runId);
  const filter =
    excludeTestCaseIds.length > 0
      ? and([runFilter, not(inValues(TEST_CASE_ID_FIELD, ValueType.Uuid, excludeTestCaseIds))])
      : runFilter;

  return aggregateQuery({
    entity: TEST_CASE_EVAL_SCORES_ENTITY,
    filter,
    groupBy: [PASSED_FIELD, EXECUTION_STATUS_FIELD],
    select: [col(field(PASSED_FIELD)), col(field(EXECUTION_STATUS_FIELD)), col(fn('count'), COUNT_ALIAS)],
  });
};

/**
 * Excludes `excludeEvalSummaryIds` rows from a run's `eval_summaries` filter so a total describes the
 * matched-only population used in run comparison.
 */
const buildEvalSummariesFilter = (runId: string, excludeEvalSummaryIds: string[]) => {
  const runFilter = eq(RUN_ID_FIELD, ValueType.Uuid, runId);
  return excludeEvalSummaryIds.length > 0
    ? and([runFilter, not(inValues(EVAL_SUMMARY_ID_FIELD, ValueType.Uuid, excludeEvalSummaryIds))])
    : runFilter;
};

/**
 * Query: total execution duration (ms) across a run's test-case eval summaries.
 * Rows shape: `[{ total_duration_ms: number }]`.
 */
export const buildTotalRunTimeQuery = (runId: string, excludeEvalSummaryIds: string[] = []): StructuredQuery =>
  aggregateQuery({
    entity: EVAL_SUMMARIES_ENTITY,
    filter: buildEvalSummariesFilter(runId, excludeEvalSummaryIds),
    select: [col(fn('sum', [field(EXEC_DURATION_MS_FIELD)]), TOTAL_DURATION_ALIAS)],
  });

/**
 * Query: total metric-evaluation duration (ms) across a run's test-case eval summaries.
 * Rows shape: `[{ total_metric_eval_duration_ms: number }]`.
 */
export const buildTotalMetricEvalDurationQuery = (
  runId: string,
  excludeEvalSummaryIds: string[] = [],
): StructuredQuery =>
  aggregateQuery({
    entity: EVAL_SUMMARIES_ENTITY,
    filter: buildEvalSummariesFilter(runId, excludeEvalSummaryIds),
    select: [col(fn('sum', [field(METRIC_EVAL_DURATION_MS_FIELD)]), TOTAL_METRIC_EVAL_DURATION_ALIAS)],
  });

/** Builds the flattened metric field path, e.g. `metric::Ragas Answer Relevancy::score`. */
export const getMetricFieldPath = (metricName: string, outputField: string): string =>
  [METRIC_FIELD_PREFIX, metricName, outputField].join(METRIC_FIELD_SEPARATOR);

/** A metric's numeric output fields (its `outputSchema` properties); falls back to `score`. */
export const getMetricOutputFields = (outputSchema?: JSONSchema7): string[] => {
  const keys = outputSchema?.properties ? Object.keys(outputSchema.properties) : [];
  return keys.length > 0 ? keys : [DEFAULT_METRIC_SCORE_FIELD];
};

/** A metric's output-field descriptions, from its `outputSchema` property `description`s. */
export const getMetricOutputDescriptions = (outputSchema?: JSONSchema7): Record<string, string> => {
  const descriptions: Record<string, string> = {};
  for (const [field, schema] of Object.entries(outputSchema?.properties ?? {})) {
    if (typeof schema === 'object' && typeof schema.description === 'string') {
      descriptions[field] = schema.description;
    }
  }
  return descriptions;
};

/**
 * Builds a `tsmdName -> MetricInfo` map for a run's metric snapshots, looking each snapshot's
 * `metricDeclarationId` up in the already-fetched declaration versions to pull the metric's own
 * description and its output-field descriptions.
 */
export const toMetricInfoByName = (
  snapshots: MetricSnapshot[] | null,
  declarationsById: Record<string, Metric>,
): Record<string, MetricInfo> => {
  const infoByName: Record<string, MetricInfo> = {};

  for (const snapshot of snapshots ?? []) {
    if (!snapshot.tsmdName || !snapshot.metricDeclarationId) {
      continue;
    }
    const declaration = declarationsById[snapshot.metricDeclarationId];
    infoByName[snapshot.tsmdName] = {
      description: declaration?.description,
      outputDescriptions: getMetricOutputDescriptions(declaration?.outputSchema),
    };
  }

  return infoByName;
};

/**
 * Merges per-metric description info onto the parsed bar groups. `MetricScoreGroup.name` matches a
 * snapshot's `tsmdName`, so groups without a matching entry in `infoByName` are returned unchanged.
 */
export const attachMetricInfo = (data: MetricScoresData, infoByName: Record<string, MetricInfo>): MetricScoresData => {
  const byStatistic: Record<string, MetricScoreGroup[]> = {};

  for (const [statistic, groups] of Object.entries(data.byStatistic)) {
    byStatistic[statistic] = groups.map((group) => {
      const info = infoByName[group.name];
      return info ? { ...group, description: info.description, barDescriptions: info.outputDescriptions } : group;
    });
  }

  return { ...data, byStatistic };
};

/**
 * Expands run metric snapshots into selectable Distribution options — one per metric output field.
 * `name` is the UI label (`<metric>.<field>`, e.g. `DeepEval: Answer Relevancy.score`); `field` is the
 * request path (`metric::<metric>::<field>`). Snapshots without a name/computation are skipped.
 * Options are sorted A–Z by `name` to match Metric Scores order.
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

  options.sort((a, b) => a.name.localeCompare(b.name));

  return options;
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
 * Ensures every configured metric appears in Metric Scores, even when `metric_score_results` has no
 * per-statistic rows (e.g. the metric 422'd on every test case). Missing bars are `null` so
 * `AnalyticsBarGroup` can render an em dash. When the run has configured metrics but no
 * statistic rows, AVG is seeded so the section has a selectable statistic.
 */
export const fillUnscoredMetricBars = (data: MetricScoresData, options: MetricOption[]): MetricScoresData => {
  if (options.length === 0) {
    return data;
  }

  const placeholderBarsByGroup = new Map<string, Record<string, number | null>>();
  for (const option of options) {
    const { group, bar } = splitMetricName(option.name);
    const bars = placeholderBarsByGroup.get(group) ?? {};
    if (!(bar in bars)) {
      bars[bar] = null;
    }
    placeholderBarsByGroup.set(group, bars);
  }

  const statistics = data.statistics.length > 0 ? data.statistics : [MetricStatistic.Avg];
  const byStatistic: Record<string, MetricScoreGroup[]> = {};

  for (const statistic of statistics) {
    const existing = data.byStatistic[statistic] ?? [];
    const byName = new Map(existing.map((group) => [group.name, { ...group, bars: { ...group.bars } }]));

    for (const [groupName, placeholderBars] of placeholderBarsByGroup) {
      const group = byName.get(groupName);
      if (!group) {
        byName.set(groupName, { name: groupName, bars: { ...placeholderBars } });
        continue;
      }
      for (const [bar, value] of Object.entries(placeholderBars)) {
        if (!(bar in group.bars)) {
          group.bars[bar] = value;
        }
      }
    }

    byStatistic[statistic] = [...byName.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }

  return { ...data, statistics: sortMetricStatistics(statistics), byStatistic };
};

/**
 * Folds `metric_score_results` rows into bar groups per statistic. For each statistic
 * (`metric_score_name`, e.g. AVG), metrics are grouped by their name prefix (before the last `.`),
 * and each leaf metric name becomes a bar with its value. Also collects the distinct statistic
 * names (canonical Metric Scores control order) that drive the statistic SegmentedControl.
 * Metric groups within each statistic are sorted alphabetically so order is stable across
 * full-run and matched-only data sources.
 */
export const parseMetricScores = (result: StructuredQueryResult | null): MetricScoresData => {
  const statistics: string[] = [];
  const byStatistic: Record<string, MetricScoreGroup[]> = {};
  let overallScore: number | null = null;

  for (const row of result?.rows ?? []) {
    const metricName = row[METRIC_NAME_FIELD];
    const statName = row[METRIC_SCORE_NAME_FIELD];
    const value = Number(row[VALUE_FIELD]);
    if (typeof metricName !== 'string' || typeof statName !== 'string' || !Number.isFinite(value)) {
      continue;
    }

    if (statName === OVERALL_METRIC_SCORE_NAME) {
      if (overallScore == null) {
        overallScore = Math.round(value * 1000) / 1000;
      }
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
    group.bars[barName] = Math.round(value * 1000) / 1000;
  }

  const sortedByStatistic: Record<string, MetricScoreGroup[]> = {};
  for (const [statistic, groups] of Object.entries(byStatistic)) {
    sortedByStatistic[statistic] = [...groups].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }

  return { overallScore, statistics: sortMetricStatistics(statistics), byStatistic: sortedByStatistic };
};

/**
 * Query: the raw metric-score values for a run's eval summaries, one row per test case. The values are
 * fed directly to `AnalyticsHistogram`, which buckets them into its 12 columns (a dedicated exact-`0`
 * bucket, ten 0.1-wide bands, and an exact-`1` band). Rows shape: `[{ value: number }]`.
 * When `excludeEvalSummaryIds` is non-empty, those rows are excluded via `NOT (id IN [...])` so the
 * histogram matches the compared (matched-only) population.
 */
export const buildDistributionQuery = (
  runId: string,
  metricField: string,
  excludeEvalSummaryIds: string[] = [],
): StructuredQuery => {
  return rowQuery({
    entity: EVAL_SUMMARIES_ENTITY,
    select: [col(field(metricField), DISTRIBUTION_VALUE_ALIAS)],
    filter: buildEvalSummariesFilter(runId, excludeEvalSummaryIds),
    page: offsetPage(0, DISTRIBUTION_ROW_LIMIT),
  });
};

/**
 * Adapts comparison-endpoint `scores` into the same `MetricScoresData` shape as `parseMetricScores`.
 */
export const parseComparisonMetricScores = (scores: MetricScoreValue[] | null | undefined): MetricScoresData =>
  parseMetricScores({
    rows: (scores ?? []).map((score) => ({
      [METRIC_NAME_FIELD]: score.metricName,
      [METRIC_SCORE_NAME_FIELD]: score.metricScoreName,
      [VALUE_FIELD]: score.value,
    })),
  });

/**
 * Extracts the raw metric-score values from the distribution rows for `AnalyticsHistogram`, which
 * buckets them into its 12 columns. Null / non-numeric values (e.g. unscored test cases) are skipped;
 * finite values are clamped to the histogram's 0–1 range so exact `0` and exact `1` land in their
 * dedicated columns.
 */
export const parseHistogramValues = (result: StructuredQueryResult | null): number[] => {
  const values: number[] = [];
  for (const row of result?.rows ?? []) {
    const raw = row[DISTRIBUTION_VALUE_ALIAS];
    if (raw == null) {
      continue;
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      continue;
    }
    values.push(Math.min(1, Math.max(0, num)));
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

/** True when a snapshotted (or live) overall score threshold is set, including `0`. */
export const hasOverallScoreThreshold = (threshold: number | null | undefined): boolean => threshold != null;

const isPassedTrue = (value: unknown): boolean => value === true || value === 'true';

const isPassedFalse = (value: unknown): boolean => value === false || value === 'false';

/**
 * Folds grouped rows into pass/fail/error buckets.
 * Non-SUCCESS execution (FAILED, TIMEOUT, ERROR) → error.
 * SUCCESS + `passed === true` → passed; SUCCESS + `passed === false` → failed.
 * SUCCESS with null `passed` (unscored) only increases total.
 */
export const parseTestCaseStatusCounts = (result: StructuredQueryResult | null): TestCaseStatusCounts => {
  const counts: TestCaseStatusCounts = { passed: 0, failed: 0, error: 0, unscored: 0, total: 0 };

  for (const row of result?.rows ?? []) {
    const status = row[EXECUTION_STATUS_FIELD];
    const passed = row[PASSED_FIELD];
    const count = toCount(row[COUNT_ALIAS]);
    counts.total += count;

    if (status !== ExtractionResultStatus.SUCCESS) {
      counts.error += count;
      continue;
    }

    if (isPassedTrue(passed)) {
      counts.passed += count;
    } else if (isPassedFalse(passed)) {
      counts.failed += count;
    } else {
      counts.unscored += count;
    }
  }

  return counts;
};

/**
 * Splits status counts into the Test Cases Completed breakdown. With a threshold, completed cases are
 * the scored SUCCESS ones (above + below); without one, every SUCCESS case is completed and the
 * above / below split does not apply. Everything else — non-SUCCESS, or SUCCESS the threshold could not
 * classify — is Error or N/A.
 */
export const toCompletionBreakdown = (counts: TestCaseStatusCounts, hasThreshold: boolean): CompletionBreakdown => {
  const above = hasThreshold ? counts.passed : 0;
  const below = hasThreshold ? counts.failed : 0;
  const completed = hasThreshold ? counts.passed + counts.failed : counts.passed + counts.failed + counts.unscored;

  return { total: counts.total, completed, above, below, errorOrNa: counts.total - completed };
};

/**
 * Completion / pass rate as a 0–1 fraction: above ÷ total with a threshold, completed ÷ total without.
 * Null when the run has no test cases.
 */
export const getCompletionRate = (breakdown: CompletionBreakdown, hasThreshold: boolean): number | null => {
  if (breakdown.total <= 0) {
    return null;
  }
  const numerator = hasThreshold ? breakdown.above : breakdown.completed;
  return numerator / breakdown.total;
};

/** Reads the single aggregated-duration value for the provided alias, rounded to a whole ms, or null when absent. */
export const parseDurationMs = (result: StructuredQueryResult | null, alias: string): number | null => {
  const raw = result?.rows?.[0]?.[alias];
  if (raw == null) {
    return null;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? Math.round(num) : null;
};

/** Display seconds from a duration in ms (one decimal place). */
export const formatRunTimeSeconds = (durationMs: number): number => Math.round(durationMs / 100) / 10;

/** Sum of the runtime parts that are present; null only when both are missing. */
export const sumRunTimeParts = (sourceMs: number | null, metricsMs: number | null): number | null =>
  sourceMs == null && metricsMs == null ? null : (sourceMs ?? 0) + (metricsMs ?? 0);

const RUN_COST_SIGNIFICANT_DIGITS = 2;

const stripTrailingZeros = (text: string): string =>
  text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;

/**
 * Formats a run cost as `$…`. Returns `null` when the value is missing/non-finite
 * so callers can render an em dash. Zero is a real value (`$0`).
 */
export const formatRunCost = (value: number | null | undefined): string | null => {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }
  if (value === 0) {
    return '$0';
  }

  const abs = Math.abs(value);
  if (abs >= 1) {
    return `$${stripTrailingZeros(value.toFixed(2))}`;
  }

  // Sub-dollar: significant digits so tiny averages stay legible (e.g. $0.0004 not $0.00).
  const exponent = Math.floor(Math.log10(abs));
  const decimals = -exponent + RUN_COST_SIGNIFICANT_DIGITS - 1;
  return `$${stripTrailingZeros(value.toFixed(decimals))}`;
};

const toFiniteOrNull = (value: number | null | undefined): number | null =>
  value != null && Number.isFinite(value) ? value : null;

/**
 * Reads a run's cost split out of a `POST /costs/total` response. The endpoint responds before the
 * backend has aggregated the run's usage logs, and that not-ready answer reaches the client in several
 * shapes — an empty list, an entry with null parts, or an empty body that `BaseApi` degrades to `''`.
 * All of them normalise to a figureless `{ null, null }` pair (see `hasRunCostFigure`), never to an
 * error; only a null response is an error.
 */
export const toRunCostFigures = (payload: RunTotalCosts[] | null | undefined, runId: string): RunCostFigures => {
  const entries = Array.isArray(payload) ? payload : [];
  const entry = entries.find((candidate) => candidate?.runId === runId) ?? entries[0];
  return { sourceCost: toFiniteOrNull(entry?.testCaseCost), metricsCost: toFiniteOrNull(entry?.metricEvalCost) };
};

/**
 * Whether cost figures actually carry a number — the not-ready shapes above are not a result, so the
 * caller must keep waiting rather than settle on them. Zero is a real figure.
 */
export const hasRunCostFigure = (costs: RunCostFigures | null | undefined): boolean =>
  costs?.sourceCost != null || costs?.metricsCost != null;

/** Total cost of the parts that are present; null only when both are missing. */
export const sumRunCostParts = (costs: RunCostFigures | null | undefined): number | null =>
  hasRunCostFigure(costs) ? (costs?.sourceCost ?? 0) + (costs?.metricsCost ?? 0) : null;

/**
 * Whether a model's pricing carries a usable rate. `prompt`/`completion` are the only flat rates a
 * model bills from (cache rates fall back to the prompt rate when unset, per `DialModelPricing`), so
 * a model with neither set has no price at all — any run against it can never produce a cost figure,
 * no matter how long `/costs` is polled.
 */
export const hasModelPricing = (pricing: DialModelPricing | undefined): boolean =>
  Boolean(pricing?.prompt) || Boolean(pricing?.completion);
