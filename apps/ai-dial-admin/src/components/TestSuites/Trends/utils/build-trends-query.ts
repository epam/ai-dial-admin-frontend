import {
  COMPUTED_AT_MS_FIELD,
  LAST_COMPUTED_ALIAS,
  METRIC_NAME_FIELD,
  METRIC_SCORE_NAME_FIELD,
  METRIC_SCORE_RESULTS_ENTITY,
  RUN_ID_FIELD,
  TEST_SUITE_ID_FIELD,
  TRENDS_RUN_WINDOW,
  TRENDS_SCORE_ROW_LIMIT,
  VALUE_FIELD,
} from '@/src/components/TestSuites/Trends/constants';
import { SortDir, StructuredQuery, ValueType } from '@/src/models/evaluation/structured-query';
import {
  aggregateQuery,
  and,
  col,
  eq,
  field,
  fn,
  inSubquery,
  offsetPage,
  rowQuery,
  sortItem,
} from '@/src/utils/structured-query/build';

/**
 * Row query of metric_score_results for the N most recently computed runs of a suite.
 * Uses an aggregate subquery for the run window (BE subquery membership support).
 */
export const buildTrendsMetricScoresQuery = (
  suiteId: string,
  runWindow: number = TRENDS_RUN_WINDOW,
): StructuredQuery => {
  const lastRunsSubquery = aggregateQuery({
    entity: METRIC_SCORE_RESULTS_ENTITY,
    select: [col(field(RUN_ID_FIELD)), col(fn('max', [field(COMPUTED_AT_MS_FIELD)]), LAST_COMPUTED_ALIAS)],
    filter: eq(TEST_SUITE_ID_FIELD, ValueType.Uuid, suiteId),
    groupBy: [RUN_ID_FIELD],
    sort: [sortItem(LAST_COMPUTED_ALIAS, SortDir.Desc)],
    page: offsetPage(0, runWindow),
  });

  return rowQuery({
    entity: METRIC_SCORE_RESULTS_ENTITY,
    select: [
      col(field(RUN_ID_FIELD)),
      col(field(METRIC_NAME_FIELD)),
      col(field(METRIC_SCORE_NAME_FIELD)),
      col(field(VALUE_FIELD)),
      col(field(COMPUTED_AT_MS_FIELD)),
    ],
    filter: and([eq(TEST_SUITE_ID_FIELD, ValueType.Uuid, suiteId), inSubquery(RUN_ID_FIELD, lastRunsSubquery)]),
    sort: [sortItem(COMPUTED_AT_MS_FIELD, SortDir.Desc)],
    page: offsetPage(0, TRENDS_SCORE_ROW_LIMIT),
  });
};
