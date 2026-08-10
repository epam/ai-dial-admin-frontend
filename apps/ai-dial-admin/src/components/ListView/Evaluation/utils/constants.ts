export const TEST_SUITES_ENTITY = 'test_suites';

export const APPLICATION_FILTER_COLUMN = 'application';

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
] as const;

export const DATE_DSL_FIELDS = new Set(['created_at_ms', 'updated_at_ms']);
