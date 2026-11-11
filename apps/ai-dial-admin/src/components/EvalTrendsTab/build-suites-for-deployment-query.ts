import {
  DEPLOYMENT_REF_ID_FIELD,
  MCP_DEPLOYMENT_REF_ID_FIELD,
  TEST_SUITE_SELECT_FIELDS,
  TEST_SUITES_ENTITY,
} from '@/src/components/ListView/Evaluation/utils/constants';
import { SortDir, StructuredQuery, ValueType } from '@/src/models/evaluation/structured-query';
import { col, eq, field, offsetPage, or, rowQuery, sortItem } from '@/src/utils/structured-query/build';

/** Page size when loading every suite for an entity Eval Trends dropdown. */
export const EVAL_TRENDS_SUITES_PAGE_SIZE = 100;

/**
 * Suites whose deployment or MCP deployment id matches the entity name (authoring
 * `deploymentRef.id` / `mcpDeploymentRef.id`).
 */
export const buildTestSuitesForDeploymentQuery = (
  deploymentId: string,
  page: number,
  size: number = EVAL_TRENDS_SUITES_PAGE_SIZE,
): StructuredQuery =>
  rowQuery({
    entity: TEST_SUITES_ENTITY,
    select: TEST_SUITE_SELECT_FIELDS.map((name) => col(field(name))),
    filter: or([
      eq(DEPLOYMENT_REF_ID_FIELD, ValueType.String, deploymentId),
      eq(MCP_DEPLOYMENT_REF_ID_FIELD, ValueType.String, deploymentId),
    ]),
    sort: [sortItem('name', SortDir.Asc)],
    page: offsetPage(page * size, size, true),
  });
