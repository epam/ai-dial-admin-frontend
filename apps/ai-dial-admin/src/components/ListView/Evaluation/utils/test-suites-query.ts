import {
  ComparisonOp,
  FilterNode,
  SortDir,
  StructuredQuery,
  StructuredQueryResult,
  ValueType,
} from '@/src/models/evaluation/structured-query';
import {
  McpDeploymentRef,
  SuiteType,
  TestSuite,
  TestSuiteDeploymentRef,
  TestSuiteEndpointRef,
} from '@/src/models/evaluation/test-suite';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { FilterOperatorDto, SortDirectionDto } from '@/src/types/request';
import { and, col, compare, field, offsetPage, or, rowQuery, sortItem } from '@/src/utils/structured-query/build';

import {
  APPLICATION_FILTER_COLUMN,
  DATE_DSL_FIELDS,
  DEPLOYMENT_REF_NAME_FIELD,
  MCP_DEPLOYMENT_REF_NAME_FIELD,
  TEST_SUITE_COLUMN_TO_DSL_FIELD,
  TEST_SUITE_SELECT_FIELDS,
  TEST_SUITES_ENTITY,
} from './constants';

const OPERATOR_TO_COMPARISON: Record<FilterOperatorDto, ComparisonOp | undefined> = {
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

const valueTypeForField = (dslField: string): ValueType => {
  if (dslField === 'id') {
    return ValueType.Uuid;
  }
  if (DATE_DSL_FIELDS.has(dslField)) {
    return ValueType.Long;
  }
  return ValueType.String;
};

const filterValueAsString = (value: string | number): string => String(value);

const buildFieldFilter = (dslField: string, filter: FilterDto): FilterNode | null => {
  const op = OPERATOR_TO_COMPARISON[filter.operator];
  if (!op) {
    return null;
  }
  return compare(op, dslField, valueTypeForField(dslField), filterValueAsString(filter.value));
};

const buildApplicationFilter = (filter: FilterDto): FilterNode | null => {
  const op = OPERATOR_TO_COMPARISON[filter.operator];
  if (!op) {
    return null;
  }
  const valueType = ValueType.String;
  const val = filterValueAsString(filter.value);
  return or([
    compare(op, DEPLOYMENT_REF_NAME_FIELD, valueType, val),
    compare(op, MCP_DEPLOYMENT_REF_NAME_FIELD, valueType, val),
  ]);
};

export const buildTestSuitesFilter = (filters: FilterDto[]): FilterNode | undefined => {
  const nodes = filters
    .map((filter) => {
      if (filter.column === APPLICATION_FILTER_COLUMN) {
        return buildApplicationFilter(filter);
      }
      const dslField = TEST_SUITE_COLUMN_TO_DSL_FIELD[filter.column];
      if (!dslField) {
        return null;
      }
      return buildFieldFilter(dslField, filter);
    })
    .filter((node): node is FilterNode => node != null);

  if (nodes.length === 0) {
    return undefined;
  }
  if (nodes.length === 1) {
    return nodes[0];
  }
  return and(nodes);
};

export const buildTestSuitesSort = (sorts: SortDto[]) =>
  sorts
    .map((sort) => {
      const dslField = TEST_SUITE_COLUMN_TO_DSL_FIELD[sort.column];
      if (!dslField || sort.column === APPLICATION_FILTER_COLUMN) {
        return null;
      }
      const dir = sort.direction === SortDirectionDto.DESC ? SortDir.Desc : SortDir.Asc;
      return sortItem(dslField, dir);
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

export const buildTestSuitesQuery = (
  page: number,
  size: number,
  sorts: SortDto[],
  filters: FilterDto[],
): StructuredQuery => {
  const filter = buildTestSuitesFilter(filters);
  const sort = buildTestSuitesSort(sorts);
  return rowQuery({
    entity: TEST_SUITES_ENTITY,
    select: TEST_SUITE_SELECT_FIELDS.map((name) => col(field(name))),
    ...(filter ? { filter } : {}),
    ...(sort.length > 0 ? { sort } : {}),
    page: offsetPage(page * size, size, true),
  });
};

const asObject = <T>(value: unknown): T | undefined => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
  if (typeof value === 'object') {
    return value as T;
  }
  return undefined;
};

export const mapTestSuiteRow = (row: Record<string, unknown>): TestSuite => ({
  id: row.id != null ? String(row.id) : undefined,
  name: row.name != null ? String(row.name) : undefined,
  description: row.description != null ? String(row.description) : undefined,
  suiteType: row.suite_type != null ? (String(row.suite_type) as SuiteType) : undefined,
  createdBy: row.created_by != null ? String(row.created_by) : undefined,
  createdAt: row.created_at_ms != null ? (row.created_at_ms as TestSuite['createdAt']) : undefined,
  updatedAt: row.updated_at_ms != null ? (row.updated_at_ms as TestSuite['updatedAt']) : undefined,
  datasetId: row.dataset_id != null ? String(row.dataset_id) : undefined,
  deploymentRef: asObject<TestSuiteDeploymentRef>(row.deployment_ref),
  mcpDeploymentRef: asObject<McpDeploymentRef>(row.mcp_deployment_ref),
  endpointRef: asObject<TestSuiteEndpointRef>(row.endpoint_ref),
  testCaseFilter: asObject<FilterNode>(row.test_case_filter) ?? null,
});

export const mapTestSuitesQueryResult = (
  result: StructuredQueryResult | null,
  page: number,
  size: number,
): EvaluationPageData<TestSuite> | null => {
  if (result == null) {
    return null;
  }
  const content = (result.rows ?? []).map(mapTestSuiteRow);
  const totalElements = result.totalCount ?? content.length;
  return {
    page,
    size,
    totalElements,
    totalPages: size > 0 ? Math.ceil(totalElements / size) : 0,
    content,
  };
};
