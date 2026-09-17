import {
  EVAL_SUMMARIES_ENTITY,
  PASSED_FIELD,
  RUN_ID_FIELD,
  SCORE_FIELD,
  TEST_CASE_NAME_FIELD,
  TRENDS_STABILITY_ROW_LIMIT,
} from '@/src/components/TestSuites/Trends/constants';
import { SortDir, StructuredQuery, ValueType } from '@/src/models/evaluation/structured-query';
import { col, field, inValues, offsetPage, rowQuery, sortItem } from '@/src/utils/structured-query/build';

/**
 * Row query of eval_summaries for Trends-window run IDs (Test Case Stability).
 * Matches the BE contract: IN run ids, select run/name/score/passed, limit 200.
 */
export const buildTrendsStabilityQuery = (runIds: string[]): StructuredQuery =>
  rowQuery({
    entity: EVAL_SUMMARIES_ENTITY,
    select: [
      col(field(RUN_ID_FIELD)),
      col(field(TEST_CASE_NAME_FIELD)),
      col(field(SCORE_FIELD)),
      col(field(PASSED_FIELD)),
    ],
    filter: inValues(RUN_ID_FIELD, ValueType.Uuid, runIds),
    sort: [sortItem(RUN_ID_FIELD, SortDir.Desc), sortItem(TEST_CASE_NAME_FIELD, SortDir.Asc)],
    page: offsetPage(0, TRENDS_STABILITY_ROW_LIMIT, false),
  });
