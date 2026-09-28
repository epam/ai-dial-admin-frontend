import { ComparisonOp } from '@/src/models/evaluation/structured-query';
import { FilterOperatorDto } from '@/src/types/request';

export const TEST_SUITES_ENTITY = 'test_suites';

export const TEST_SUITE_RUNS_ENTITY = 'test_suite_runs';

/** Grid filter operator → Query DSL comparison. Shared by every entity's query builder. */
export const OPERATOR_TO_COMPARISON: Record<FilterOperatorDto, ComparisonOp | undefined> = {
  [FilterOperatorDto.EQUALS]: ComparisonOp.Eq,
  [FilterOperatorDto.NOT_EQUAL]: ComparisonOp.Ne,
  [FilterOperatorDto.CONTAINS]: ComparisonOp.Co,
  [FilterOperatorDto.NOT_CONTAINS]: ComparisonOp.Nc,
  [FilterOperatorDto.GREATER_THAN]: ComparisonOp.Gt,
  [FilterOperatorDto.GREATER_THAN_OR_EQUAL]: ComparisonOp.Ge,
  [FilterOperatorDto.LESS_THAN]: ComparisonOp.Lt,
  [FilterOperatorDto.LESS_THAN_OR_EQUAL]: ComparisonOp.Le,
  [FilterOperatorDto.INCLUDES]: ComparisonOp.In,
};

export const APPLICATION_FILTER_COLUMN = 'application';

/** The runs-list Target column: same OR-across-both-refs shape as `APPLICATION_FILTER_COLUMN`. */
export const RUN_TARGET_FILTER_COLUMN = 'target';

export const DEPLOYMENT_REF_NAME_FIELD = 'deployment_ref::name';
export const MCP_DEPLOYMENT_REF_NAME_FIELD = 'mcp_deployment_ref::name';

/** AG Grid column id/field → Query DSL field name. */
export const TEST_SUITE_COLUMN_TO_DSL_FIELD: Record<string, string> = {
  name: 'name',
  description: 'description',
  id: 'id',
  suiteType: 'suite_type',
  createdBy: 'created_by',
  createdAt: 'created_at_ms',
  updatedAt: 'updated_at_ms',
};

export const TEST_SUITE_SELECT_FIELDS = [
  'id',
  'name',
  'description',
  'suite_type',
  'created_by',
  'created_at_ms',
  'updated_at_ms',
  'dataset_id',
  'deployment_ref',
  'mcp_deployment_ref',
  'endpoint_ref',
  'test_case_filter',
] as const;

export const DATE_DSL_FIELDS = new Set(['created_at_ms', 'updated_at_ms']);

/** AG Grid column id/field → Query DSL field name for `test_suite_runs`. */
export const RUN_COLUMN_TO_DSL_FIELD: Record<string, string> = {
  id: 'id',
  testSuiteId: 'test_suite_id',
  testRunName: 'test_run_name',
  status: 'status',
  numberOfTestCases: 'number_of_test_cases',
  startedAt: 'started_at_ms',
  completedAt: 'completed_at_ms',
  createdAt: 'created_at_ms',
  updatedAt: 'updated_at_ms',
  metrics: 'metric_names',
  // The grid keeps this column's colId as `runConfig.numberOfRuns` (its legacy REST-shape field path),
  // even though the query API's own field is flat — see `Run.numberOfRuns`'s doc comment.
  'runConfig.numberOfRuns': 'number_of_runs',
};

/**
 * Every field the entity declares. The `::` paths are projections out of the run's `suite_snapshot`,
 * which the DSL addresses by path rather than returning as an object.
 *
 * `overall_score_value` and `total_cost` are deliberately absent: the backend appends them to a row
 * after the query itself runs, so they cannot be named in a `select` (or a `filter`/`sort`) — they are
 * read straight off the row in `mapRunRow` regardless of what is selected here.
 */
export const RUN_SELECT_FIELDS = [
  'id',
  'test_suite_id',
  'test_run_name',
  'number_of_runs',
  'status',
  'number_of_test_cases',
  'started_at_ms',
  'completed_at_ms',
  'error_message',
  'created_at_ms',
  'updated_at_ms',
  'suite_type',
  'deployment_ref::id',
  'deployment_ref::name',
  'deployment_ref::version',
  'deployment_ref::type',
  'mcp_deployment_ref::id',
  'mcp_deployment_ref::name',
  'mcp_deployment_ref::type',
  'mcp_deployment_ref::transport',
  'metric_names',
] as const;

export const RUN_DATE_DSL_FIELDS = new Set(['started_at_ms', 'completed_at_ms', 'created_at_ms', 'updated_at_ms']);

export const RUN_NUMBER_DSL_FIELDS = new Set(['number_of_test_cases', 'number_of_runs']);
