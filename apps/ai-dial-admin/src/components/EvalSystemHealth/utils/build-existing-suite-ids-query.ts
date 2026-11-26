import { SUITE_ID_FIELD, SUITE_IDS_SUBQUERY_LIMIT } from '@/src/components/EvalSystemHealth/constants';
import { TEST_SUITES_ENTITY } from '@/src/components/ListView/Evaluation/utils/constants';
import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { aggregateQuery, col, field, offsetPage } from '@/src/utils/structured-query/build';

/** The ids of the test suites that exist, as a subquery that drops the runs of deleted suites. */
export const buildExistingSuiteIdsQuery = (): StructuredQuery =>
  aggregateQuery({
    entity: TEST_SUITES_ENTITY,
    select: [col(field(SUITE_ID_FIELD))],
    groupBy: [SUITE_ID_FIELD],
    page: offsetPage(0, SUITE_IDS_SUBQUERY_LIMIT),
  });
