import { TEST_SUITE_RUNS_ENTITY } from '@/src/components/ListView/Evaluation/utils/constants';
import {
  ComparisonNode,
  FilterNode,
  SortDir,
  StructuredQuery,
  StructuredQueryResult,
  ValueType,
} from '@/src/models/evaluation/structured-query';
import { col, eq, field, inSubquery, offsetPage, or, rowQuery, sortItem } from '@/src/utils/structured-query/build';

/** Latest runs considered per suite for the Eval Trends score pill. */
export const EVAL_TRENDS_RECENT_RUNS_PER_SUITE = 10;

/**
 * Max suites per execute call so the outer page stays within the eval query page ceiling
 * (`suiteCount * EVAL_TRENDS_RECENT_RUNS_PER_SUITE` ≤ 1000).
 */
export const EVAL_TRENDS_SUITE_AVG_BATCH_SIZE = 100;

export interface SuiteRecentRunAverage {
  suiteId: string;
  /** Rows in the latest-run window (≤ {@link EVAL_TRENDS_RECENT_RUNS_PER_SUITE}). */
  runCount: number;
  /** Mean of finite `overall_score_value` in the window; null when none are numeric. */
  avgScore: number | null;
  /** Mean of finite `total_cost` in the window; null when none are numeric. */
  avgCost: number | null;
}

const asNumber = (value: unknown): number | undefined => {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const asString = (value: unknown): string | undefined => (value == null ? undefined : String(value));

const buildLatestRunIdsSubquery = (suiteId: string): StructuredQuery =>
  rowQuery({
    entity: TEST_SUITE_RUNS_ENTITY,
    select: [col(field('id'), 'id')],
    filter: eq('test_suite_id', ValueType.Uuid, suiteId),
    sort: [sortItem('created_at_ms', SortDir.Desc)],
    page: offsetPage(0, EVAL_TRENDS_RECENT_RUNS_PER_SUITE, false),
  });

const buildSuiteWindowFilter = (suiteId: string): ComparisonNode =>
  inSubquery('id', buildLatestRunIdsSubquery(suiteId));

/**
 * Latest-up-to-N runs for each suite id. Score and cost are not selected — the eval service
 * appends `overall_score_value` / `total_cost` to each row after the query runs.
 */
export const buildSuiteRecentRunsQuery = (suiteIds: string[]): StructuredQuery | null => {
  const ids = suiteIds.filter(Boolean);
  if (ids.length === 0) {
    return null;
  }

  const windows = ids.map(buildSuiteWindowFilter);
  const filter: FilterNode = windows.length === 1 ? windows[0] : or(windows);

  return rowQuery({
    entity: TEST_SUITE_RUNS_ENTITY,
    select: [col(field('id'), 'id'), col(field('test_suite_id')), col(field('created_at_ms'))],
    filter,
    sort: [sortItem('test_suite_id', SortDir.Asc), sortItem('created_at_ms', SortDir.Desc)],
    page: offsetPage(0, ids.length * EVAL_TRENDS_RECENT_RUNS_PER_SUITE, false),
  });
};

const meanOf = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

/**
 * Groups query rows by suite and averages finite score/cost values. A run without a numeric
 * field still counts toward `runCount` (window size) but is skipped in that field's mean.
 */
export const aggregateSuiteRecentRunAverages = (rows: Record<string, unknown>[]): SuiteRecentRunAverage[] => {
  const bySuite = new Map<string, { scores: number[]; costs: number[]; runCount: number }>();

  for (const row of rows) {
    const suiteId = asString(row.test_suite_id);
    if (!suiteId) {
      continue;
    }
    const bucket = bySuite.get(suiteId) ?? { scores: [], costs: [], runCount: 0 };
    bucket.runCount += 1;
    const score = asNumber(row.overall_score_value);
    if (score != null) {
      bucket.scores.push(score);
    }
    const cost = asNumber(row.total_cost);
    if (cost != null) {
      bucket.costs.push(cost);
    }
    bySuite.set(suiteId, bucket);
  }

  return [...bySuite.entries()].map(([suiteId, bucket]) => ({
    suiteId,
    runCount: bucket.runCount,
    avgScore: meanOf(bucket.scores),
    avgCost: meanOf(bucket.costs),
  }));
};

const chunkSuiteIds = (suiteIds: string[], size: number): string[][] => {
  const batches: string[][] = [];
  for (let offset = 0; offset < suiteIds.length; offset += size) {
    batches.push(suiteIds.slice(offset, offset + size));
  }
  return batches;
};

/**
 * Loads per-suite recent-run averages, batching ids so each execute stays within the page ceiling.
 * Failures propagate to the caller (the Eval Trends hook clears pills on error).
 */
export const loadSuiteRecentRunAverages = async (
  suiteIds: string[],
  execute: (query: StructuredQuery) => Promise<StructuredQueryResult | null>,
): Promise<SuiteRecentRunAverage[]> => {
  const batches = chunkSuiteIds(suiteIds, EVAL_TRENDS_SUITE_AVG_BATCH_SIZE);
  if (batches.length === 0) {
    return [];
  }

  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      const query = buildSuiteRecentRunsQuery(batch);
      if (!query) {
        return [] as SuiteRecentRunAverage[];
      }
      const result = await execute(query);
      return aggregateSuiteRecentRunAverages(result?.rows ?? []);
    }),
  );

  return batchResults.flat();
};
