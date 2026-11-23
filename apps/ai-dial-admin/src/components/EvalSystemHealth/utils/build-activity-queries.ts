import {
  LAST_RUN_ALIAS,
  RUN_STARTED_AT_FIELD,
  RUN_SUITE_ID_FIELD,
  SUITE_CREATED_AT_FIELD,
  SUITE_ID_FIELD,
  SUITES_ADDED_ROW_LIMIT,
  SUITES_RUN_ROW_LIMIT,
} from '@/src/components/EvalSystemHealth/constants';
import { ActivityPeriod, ActivityQueries, ActivityWindows } from '@/src/components/EvalSystemHealth/models';
import { buildExistingSuiteIdsQuery } from '@/src/components/EvalSystemHealth/utils/build-existing-suite-ids-query';
import {
  DEPLOYMENT_REF_ID_FIELD,
  MCP_DEPLOYMENT_REF_ID_FIELD,
  TEST_SUITE_RUNS_ENTITY,
  TEST_SUITES_ENTITY,
} from '@/src/components/ListView/Evaluation/utils/constants';
import { FilterNode, StructuredQuery, ValueType } from '@/src/models/evaluation/structured-query';
import {
  aggregateQuery,
  and,
  col,
  field,
  fn,
  ge,
  inSubquery,
  le,
  offsetPage,
  rowQuery,
} from '@/src/utils/structured-query/build';

const withinPeriod = (fieldName: string, { fromMs, toMs }: ActivityPeriod): FilterNode[] => [
  ge(fieldName, ValueType.Long, String(fromMs)),
  le(fieldName, ValueType.Long, String(toMs)),
];

/** A one-row page that carries only the backend's total, for counting without reading the rows. */
const countOnlyQuery = (filter?: FilterNode): StructuredQuery =>
  rowQuery({
    entity: TEST_SUITES_ENTITY,
    select: [col(field(SUITE_ID_FIELD))],
    ...(filter ? { filter } : {}),
    page: offsetPage(0, 1, true),
  });

/** One row per existing test suite with a run that started in the period. */
const suitesRunQuery = (period: ActivityPeriod): StructuredQuery =>
  aggregateQuery({
    entity: TEST_SUITE_RUNS_ENTITY,
    select: [col(field(RUN_SUITE_ID_FIELD)), col(fn('max', [field(RUN_STARTED_AT_FIELD)]), LAST_RUN_ALIAS)],
    filter: and([
      ...withinPeriod(RUN_STARTED_AT_FIELD, period),
      inSubquery(RUN_SUITE_ID_FIELD, buildExistingSuiteIdsQuery()),
    ]),
    groupBy: [RUN_SUITE_ID_FIELD],
    page: offsetPage(0, SUITES_RUN_ROW_LIMIT),
  });

/** The test suites created in the period, with the ids of what they target, and the backend's total. */
const suitesAddedQuery = (period: ActivityPeriod): StructuredQuery =>
  rowQuery({
    entity: TEST_SUITES_ENTITY,
    select: [col(field(DEPLOYMENT_REF_ID_FIELD)), col(field(MCP_DEPLOYMENT_REF_ID_FIELD))],
    filter: and(withinPeriod(SUITE_CREATED_AT_FIELD, period)),
    page: offsetPage(0, SUITES_ADDED_ROW_LIMIT, true),
  });

/** The five reads behind the two activity cards. The periods are parameters so the builder stays deterministic. */
export const buildActivityQueries = ({ current, previous }: ActivityWindows): ActivityQueries => ({
  totalSuites: countOnlyQuery(),
  suitesRunCurrent: suitesRunQuery(current),
  suitesRunPrevious: suitesRunQuery(previous),
  suitesAddedCurrent: suitesAddedQuery(current),
  suitesAddedPrevious: countOnlyQuery(and(withinPeriod(SUITE_CREATED_AT_FIELD, previous))),
});
