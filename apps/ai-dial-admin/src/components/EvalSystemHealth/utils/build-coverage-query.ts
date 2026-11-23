import {
  COVERAGE_ROW_LIMIT,
  LAST_RUN_ALIAS,
  RUN_STARTED_AT_FIELD,
  RUN_SUITE_ID_FIELD,
} from '@/src/components/EvalSystemHealth/constants';
import { buildExistingSuiteIdsQuery } from '@/src/components/EvalSystemHealth/utils/build-existing-suite-ids-query';
import {
  DEPLOYMENT_REF_ID_FIELD,
  MCP_DEPLOYMENT_REF_ID_FIELD,
  TEST_SUITE_RUNS_ENTITY,
} from '@/src/components/ListView/Evaluation/utils/constants';
import { StructuredQuery, ValueType } from '@/src/models/evaluation/structured-query';
import { aggregateQuery, and, col, field, fn, ge, inSubquery, offsetPage } from '@/src/utils/structured-query/build';

/**
 * One row per distinct evaluatee that a run started on or after `windowStartMs` targeted, by the ref that
 * carried it (`deployment_ref` for models and applications, `mcp_deployment_ref` for toolsets). Runs of a
 * suite that no longer exists are left out. `windowStartMs` is a parameter so the builder stays deterministic.
 */
export const buildCoverageQuery = (windowStartMs: number): StructuredQuery =>
  aggregateQuery({
    entity: TEST_SUITE_RUNS_ENTITY,
    select: [
      col(field(DEPLOYMENT_REF_ID_FIELD)),
      col(field(MCP_DEPLOYMENT_REF_ID_FIELD)),
      col(fn('max', [field(RUN_STARTED_AT_FIELD)]), LAST_RUN_ALIAS),
    ],
    filter: and([
      ge(RUN_STARTED_AT_FIELD, ValueType.Long, String(windowStartMs)),
      inSubquery(RUN_SUITE_ID_FIELD, buildExistingSuiteIdsQuery()),
    ]),
    groupBy: [DEPLOYMENT_REF_ID_FIELD, MCP_DEPLOYMENT_REF_ID_FIELD],
    page: offsetPage(0, COVERAGE_ROW_LIMIT),
  });
