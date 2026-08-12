import { describe, expect, test } from 'vitest';

import {
  ComparisonOp,
  ExprType,
  LogicalOp,
  PageType,
  QueryMode,
  SortDir,
  ValueType,
} from '@/src/models/evaluation/structured-query';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import { FilterOperatorDto, SortDirectionDto } from '@/src/types/request';

import {
  buildTestSuitesFilter,
  buildTestSuitesQuery,
  buildTestSuitesSort,
  mapTestSuiteRow,
  mapTestSuitesQueryResult,
} from '../test-suites-query';

describe('test-suites-query', () => {
  test('buildTestSuitesFilter returns undefined for empty filters', () => {
    expect(buildTestSuitesFilter([])).toBeUndefined();
  });

  test('buildTestSuitesFilter builds a single field comparison', () => {
    expect(buildTestSuitesFilter([{ column: 'name', value: 'suite-1', operator: FilterOperatorDto.CONTAINS }])).toEqual(
      {
        op: ComparisonOp.Co,
        args: [
          { type: ExprType.Field, name: 'name' },
          { type: ExprType.Value, value_type: ValueType.String, value: 'suite-1' },
        ],
      },
    );
  });

  test('buildTestSuitesFilter maps suiteType and id value types', () => {
    expect(
      buildTestSuitesFilter([{ column: 'suiteType', value: 'DEPLOYMENT', operator: FilterOperatorDto.EQUALS }]),
    ).toEqual({
      op: ComparisonOp.Eq,
      args: [
        { type: ExprType.Field, name: 'suite_type' },
        { type: ExprType.Value, value_type: ValueType.String, value: 'DEPLOYMENT' },
      ],
    });

    expect(buildTestSuitesFilter([{ column: 'id', value: 'uuid-1', operator: FilterOperatorDto.EQUALS }])).toEqual({
      op: ComparisonOp.Eq,
      args: [
        { type: ExprType.Field, name: 'id' },
        { type: ExprType.Value, value_type: ValueType.Uuid, value: 'uuid-1' },
      ],
    });
  });

  test('buildTestSuitesFilter uses Long for date columns', () => {
    expect(
      buildTestSuitesFilter([{ column: 'createdAt', value: 1700000000000, operator: FilterOperatorDto.GREATER_THAN }]),
    ).toEqual({
      op: ComparisonOp.Gt,
      args: [
        { type: ExprType.Field, name: 'created_at_ms' },
        { type: ExprType.Value, value_type: ValueType.Long, value: '1700000000000' },
      ],
    });
  });

  test('buildTestSuitesFilter ANDs multiple column filters', () => {
    const node = buildTestSuitesFilter([
      { column: 'name', value: 'a', operator: FilterOperatorDto.CONTAINS },
      { column: 'suiteType', value: 'MCP_TOOL', operator: FilterOperatorDto.EQUALS },
    ]);

    expect(node?.op).toBe(LogicalOp.And);
    expect(node && 'args' in node ? node.args : []).toHaveLength(2);
  });

  test('buildTestSuitesFilter ORs application against both deployment name fields', () => {
    expect(
      buildTestSuitesFilter([{ column: 'application', value: 'google', operator: FilterOperatorDto.CONTAINS }]),
    ).toEqual({
      op: LogicalOp.Or,
      args: [
        {
          op: ComparisonOp.Co,
          args: [
            { type: ExprType.Field, name: 'deployment_ref::name' },
            { type: ExprType.Value, value_type: ValueType.String, value: 'google' },
          ],
        },
        {
          op: ComparisonOp.Co,
          args: [
            { type: ExprType.Field, name: 'mcp_deployment_ref::name' },
            { type: ExprType.Value, value_type: ValueType.String, value: 'google' },
          ],
        },
      ],
    });
  });

  test('buildTestSuitesFilter ignores unknown columns', () => {
    expect(
      buildTestSuitesFilter([{ column: 'method', value: 'POST', operator: FilterOperatorDto.EQUALS }]),
    ).toBeUndefined();
  });

  test('buildTestSuitesSort maps columns and directions', () => {
    expect(
      buildTestSuitesSort([
        { column: 'name', direction: SortDirectionDto.ASC },
        { column: 'createdAt', direction: SortDirectionDto.DESC },
        { column: 'application', direction: SortDirectionDto.ASC },
      ]),
    ).toEqual([
      { field: 'name', dir: SortDir.Asc, nulls: null },
      { field: 'created_at_ms', dir: SortDir.Desc, nulls: null },
    ]);
  });

  test('buildTestSuitesQuery assembles row query with offset page and include_total', () => {
    const query = buildTestSuitesQuery(
      2,
      50,
      [{ column: 'name', direction: SortDirectionDto.ASC }],
      [{ column: 'name', value: 'x', operator: FilterOperatorDto.CONTAINS }],
    );

    expect(query.entity).toBe('test_suites');
    expect(query.mode).toBe(QueryMode.Row);
    expect(query.page).toEqual({ type: PageType.Offset, offset: 100, limit: 50, include_total: true });
    expect(query.filter?.op).toBe(ComparisonOp.Co);
    expect(query.sort).toEqual([{ field: 'name', dir: SortDir.Asc, nulls: null }]);
    expect(query.select?.length).toBeGreaterThan(0);
  });

  test('mapTestSuiteRow remaps snake_case and JSONB refs', () => {
    expect(
      mapTestSuiteRow({
        id: 'id-1',
        name: 'Suite',
        description: 'desc',
        suite_type: 'DEPLOYMENT',
        created_by: 'alice',
        created_at_ms: 1,
        updated_at_ms: 2,
        dataset_id: 'ds-1',
        deployment_ref: { id: 'dep', name: 'App', version: '1' },
        mcp_deployment_ref: null,
        endpoint_ref: { method: 'POST', relativeUrlPattern: '/v1' },
        test_case_filter: { op: 'eq', args: [] },
      }),
    ).toEqual({
      id: 'id-1',
      name: 'Suite',
      description: 'desc',
      suiteType: SuiteType.Deployment,
      createdBy: 'alice',
      createdAt: 1,
      updatedAt: 2,
      datasetId: 'ds-1',
      deploymentRef: { id: 'dep', name: 'App', version: '1' },
      mcpDeploymentRef: undefined,
      endpointRef: { method: 'POST', relativeUrlPattern: '/v1' },
      testCaseFilter: { op: 'eq', args: [] },
    });
  });

  test('mapTestSuiteRow parses JSON string refs', () => {
    const suite = mapTestSuiteRow({
      deployment_ref: JSON.stringify({ id: 'd', name: 'N' }),
      test_case_filter: JSON.stringify({ op: 'co', args: [] }),
    });
    expect(suite.deploymentRef).toEqual({ id: 'd', name: 'N' });
    expect(suite.testCaseFilter).toEqual({ op: 'co', args: [] });
  });

  test('mapTestSuitesQueryResult returns null for null result', () => {
    expect(mapTestSuitesQueryResult(null, 0, 10)).toBeNull();
  });

  test('mapTestSuitesQueryResult builds EvaluationPageData', () => {
    const page = mapTestSuitesQueryResult(
      {
        rows: [{ id: '1', name: 'A' }],
        totalCount: 42,
      },
      1,
      10,
    );

    expect(page).toEqual({
      page: 1,
      size: 10,
      totalElements: 42,
      totalPages: 5,
      content: [
        {
          id: '1',
          name: 'A',
          description: undefined,
          suiteType: undefined,
          createdBy: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          datasetId: undefined,
          deploymentRef: undefined,
          mcpDeploymentRef: undefined,
          endpointRef: undefined,
          testCaseFilter: null,
        },
      ],
    });
  });
});
