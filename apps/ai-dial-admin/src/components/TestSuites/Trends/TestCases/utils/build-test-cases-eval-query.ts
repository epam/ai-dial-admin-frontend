import { COUNT_ALIAS, EXECUTION_STATUS_FIELD } from '@/src/components/Runs/Summary/constants';
import { PASSED_FIELD, RUN_ID_FIELD, TEST_CASE_EVAL_SCORES_ENTITY } from '@/src/components/TestSuites/Trends/constants';
import { StructuredQuery, ValueType } from '@/src/models/evaluation/structured-query';
import { aggregateQuery, col, field, fn, inValues, offsetPage } from '@/src/utils/structured-query/build';

export const buildTrendsTestCasesEvalQuery = (runIds: string[]): StructuredQuery =>
  aggregateQuery({
    entity: TEST_CASE_EVAL_SCORES_ENTITY,
    filter: inValues(RUN_ID_FIELD, ValueType.Uuid, runIds),
    groupBy: [RUN_ID_FIELD, PASSED_FIELD, EXECUTION_STATUS_FIELD],
    select: [
      col(field(RUN_ID_FIELD)),
      col(field(PASSED_FIELD)),
      col(field(EXECUTION_STATUS_FIELD)),
      col(fn('count'), COUNT_ALIAS),
    ],
    page: offsetPage(0, Math.max(runIds.length * 12, 40), false),
  });
