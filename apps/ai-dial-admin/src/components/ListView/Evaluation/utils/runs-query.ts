import { Run, RunStatus } from '@/src/models/evaluation/run';
import {
  ComparisonOp,
  FilterNode,
  SortDir,
  StructuredQuery,
  StructuredQueryResult,
  ValueType,
} from '@/src/models/evaluation/structured-query';
import { McpDeploymentRef, SuiteType, TestSuiteDeploymentRef } from '@/src/models/evaluation/test-suite';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { SortDirectionDto } from '@/src/types/request';
import { and, col, compare, field, offsetPage, or, rowQuery, sortItem } from '@/src/utils/structured-query/build';

import {
  DEPLOYMENT_REF_NAME_FIELD,
  MCP_DEPLOYMENT_REF_NAME_FIELD,
  OPERATOR_TO_COMPARISON,
  RUN_COLUMN_TO_DSL_FIELD,
  RUN_DATE_DSL_FIELDS,
  RUN_NUMBER_DSL_FIELDS,
  RUN_SELECT_FIELDS,
  RUN_TARGET_FILTER_COLUMN,
  TEST_SUITE_RUNS_ENTITY,
} from './constants';

const valueTypeForField = (dslField: string): ValueType => {
  if (dslField === 'id' || dslField === 'test_suite_id') {
    return ValueType.Uuid;
  }
  if (RUN_DATE_DSL_FIELDS.has(dslField)) {
    return ValueType.Long;
  }
  if (RUN_NUMBER_DSL_FIELDS.has(dslField)) {
    return ValueType.Integer;
  }
  return ValueType.String;
};

const buildFieldFilter = (dslField: string, filter: FilterDto): FilterNode | null => {
  const op: ComparisonOp | undefined = OPERATOR_TO_COMPARISON[filter.operator];
  if (!op) {
    return null;
  }
  return compare(op, dslField, valueTypeForField(dslField), String(filter.value));
};

/** Same OR-across-both-refs shape as `buildApplicationFilter` in `test-suites-query.ts`. */
const buildRunTargetFilter = (filter: FilterDto): FilterNode | null => {
  const op: ComparisonOp | undefined = OPERATOR_TO_COMPARISON[filter.operator];
  if (!op) {
    return null;
  }
  const val = String(filter.value);
  return or([
    compare(op, DEPLOYMENT_REF_NAME_FIELD, ValueType.String, val),
    compare(op, MCP_DEPLOYMENT_REF_NAME_FIELD, ValueType.String, val),
  ]);
};

export const buildRunsFilter = (filters: FilterDto[]): FilterNode | undefined => {
  const nodes = filters
    .map((filter) => {
      if (filter.column === RUN_TARGET_FILTER_COLUMN) {
        return buildRunTargetFilter(filter);
      }
      const dslField = RUN_COLUMN_TO_DSL_FIELD[filter.column];
      return dslField ? buildFieldFilter(dslField, filter) : null;
    })
    .filter((node): node is FilterNode => node != null);

  if (nodes.length === 0) {
    return undefined;
  }
  return nodes.length === 1 ? nodes[0] : and(nodes);
};

export const buildRunsSort = (sorts: SortDto[]) =>
  sorts
    .map((sort) => {
      // Target has no single DSL field (see `buildRunTargetFilter`'s OR), so sorting approximates it by
      // the deployment name alone: MCP_TOOL rows, which carry no value there, sort together rather than
      // interleaving by their own name.
      const dslField =
        sort.column === RUN_TARGET_FILTER_COLUMN ? DEPLOYMENT_REF_NAME_FIELD : RUN_COLUMN_TO_DSL_FIELD[sort.column];
      if (!dslField) {
        return null;
      }
      return sortItem(dslField, sort.direction === SortDirectionDto.DESC ? SortDir.Desc : SortDir.Asc);
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

export const buildRunsQuery = (page: number, size: number, sorts: SortDto[], filters: FilterDto[]): StructuredQuery => {
  const filter = buildRunsFilter(filters);
  const sort = buildRunsSort(sorts);
  return rowQuery({
    entity: TEST_SUITE_RUNS_ENTITY,
    select: RUN_SELECT_FIELDS.map((name) => col(field(name))),
    ...(filter ? { filter } : {}),
    ...(sort.length > 0 ? { sort } : {}),
    page: offsetPage(page * size, size, true),
  });
};

const asNumber = (value: unknown): number | undefined => {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const asString = (value: unknown): string | undefined => (value == null ? undefined : String(value));

/** `metric_names` is an array field, but a JSON-encoded array is an equally valid wire form for one. */
const asStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : undefined;
  } catch {
    return undefined;
  }
};

/** A `::`-projected ref comes back one column per path, so it is reassembled here, or dropped whole. */
const asDeploymentRef = (row: Record<string, unknown>): TestSuiteDeploymentRef | undefined => {
  const name = asString(row['deployment_ref::name']);
  const id = asString(row['deployment_ref::id']);
  if (name == null && id == null) {
    return undefined;
  }
  return {
    id: id ?? '',
    name: name ?? '',
    version: asString(row['deployment_ref::version']),
    type: asString(row['deployment_ref::type']),
  } as TestSuiteDeploymentRef;
};

const asMcpDeploymentRef = (row: Record<string, unknown>): McpDeploymentRef | undefined => {
  const name = asString(row['mcp_deployment_ref::name']);
  const id = asString(row['mcp_deployment_ref::id']);
  if (name == null && id == null) {
    return undefined;
  }
  return {
    id: id ?? '',
    name: name ?? '',
    type: asString(row['mcp_deployment_ref::type']) ?? '',
  };
};

export const mapRunRow = (row: Record<string, unknown>): Run => {
  const deploymentRef = asDeploymentRef(row);
  const mcpDeploymentRef = asMcpDeploymentRef(row);
  const suiteType = asString(row.suite_type) as SuiteType | undefined;
  const numberOfRuns = asNumber(row.number_of_runs);

  return {
    id: asString(row.id),
    testSuiteId: asString(row.test_suite_id),
    testRunName: asString(row.test_run_name),
    status: asString(row.status) as RunStatus | undefined,
    numberOfTestCases: asNumber(row.number_of_test_cases),
    startedAt: asNumber(row.started_at_ms),
    completedAt: asNumber(row.completed_at_ms),
    errorMessage: asString(row.error_message),
    createdAt: asNumber(row.created_at_ms),
    updatedAt: asNumber(row.updated_at_ms),
    metricNames: asStringArray(row.metric_names),
    overallScoreValue: asNumber(row.overall_score_value),
    totalCost: asNumber(row.total_cost),
    ...((suiteType || deploymentRef || mcpDeploymentRef) && {
      suiteSnapshot: { suiteType, deploymentRef, mcpDeploymentRef },
    }),
    ...(numberOfRuns != null && {
      runConfig: { numberOfRuns },
    }),
  };
};

export const mapRunsQueryResult = (
  result: StructuredQueryResult | null,
  page: number,
  size: number,
): EvaluationPageData<Run> | null => {
  if (result == null) {
    return null;
  }

  const content = (result.rows ?? []).map(mapRunRow);
  const totalElements = result.totalCount ?? content.length;
  return {
    page,
    size,
    totalElements,
    totalPages: size > 0 ? Math.ceil(totalElements / size) : 0,
    content,
  };
};
