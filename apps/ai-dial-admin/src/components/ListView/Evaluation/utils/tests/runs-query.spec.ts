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
import { RunStatus } from '@/src/models/evaluation/run';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import { FilterOperatorDto, SortDirectionDto } from '@/src/types/request';

import { buildRunsFilter, buildRunsQuery, buildRunsSort, mapRunRow, mapRunsQueryResult } from '../runs-query';

describe('runs-query', () => {
  test('buildRunsFilter returns undefined for empty filters', () => {
    expect(buildRunsFilter([])).toBeUndefined();
  });

  test('buildRunsFilter maps a known column to its DSL field', () => {
    expect(buildRunsFilter([{ column: 'testRunName', value: 'Run #1', operator: FilterOperatorDto.CONTAINS }])).toEqual(
      {
        op: ComparisonOp.Co,
        args: [
          { type: ExprType.Field, name: 'test_run_name' },
          { type: ExprType.Value, value_type: ValueType.String, value: 'Run #1' },
        ],
      },
    );
  });

  test('buildRunsFilter uses Uuid for id and test suite id, Long for dates, Integer for the test-case count', () => {
    expect(buildRunsFilter([{ column: 'id', value: 'uuid-1', operator: FilterOperatorDto.EQUALS }])?.args?.[1]).toEqual(
      { type: ExprType.Value, value_type: ValueType.Uuid, value: 'uuid-1' },
    );
    expect(
      buildRunsFilter([{ column: 'startedAt', value: 1700000000000, operator: FilterOperatorDto.GREATER_THAN }])
        ?.args?.[1],
    ).toEqual({ type: ExprType.Value, value_type: ValueType.Long, value: '1700000000000' });
    expect(
      buildRunsFilter([{ column: 'numberOfTestCases', value: 10, operator: FilterOperatorDto.EQUALS }])?.args?.[1],
    ).toEqual({ type: ExprType.Value, value_type: ValueType.Integer, value: '10' });
  });

  test('buildRunsFilter ORs Target against both deployment name fields', () => {
    expect(buildRunsFilter([{ column: 'target', value: 'gpt-4o', operator: FilterOperatorDto.CONTAINS }])).toEqual({
      op: LogicalOp.Or,
      args: [
        {
          op: ComparisonOp.Co,
          args: [
            { type: ExprType.Field, name: 'deployment_ref::name' },
            { type: ExprType.Value, value_type: ValueType.String, value: 'gpt-4o' },
          ],
        },
        {
          op: ComparisonOp.Co,
          args: [
            { type: ExprType.Field, name: 'mcp_deployment_ref::name' },
            { type: ExprType.Value, value_type: ValueType.String, value: 'gpt-4o' },
          ],
        },
      ],
    });
  });

  test('buildRunsFilter maps Metrics to the real metric_names field', () => {
    expect(
      buildRunsFilter([{ column: 'metrics', value: 'Faithfulness', operator: FilterOperatorDto.CONTAINS }]),
    ).toEqual({
      op: ComparisonOp.Co,
      args: [
        { type: ExprType.Field, name: 'metric_names' },
        { type: ExprType.Value, value_type: ValueType.String, value: 'Faithfulness' },
      ],
    });
  });

  test('buildRunsFilter ignores unknown columns', () => {
    expect(buildRunsFilter([{ column: 'cost', value: 1, operator: FilterOperatorDto.EQUALS }])).toBeUndefined();
  });

  test('buildRunsSort maps a known column, and Metrics against its real field', () => {
    expect(
      buildRunsSort([
        { column: 'startedAt', direction: SortDirectionDto.DESC },
        { column: 'metrics', direction: SortDirectionDto.ASC },
      ]),
    ).toEqual([
      { field: 'started_at_ms', dir: SortDir.Desc, nulls: null },
      { field: 'metric_names', dir: SortDir.Asc, nulls: null },
    ]);
  });

  test('buildRunsSort approximates Target by the deployment name alone, since it has no unified field', () => {
    expect(buildRunsSort([{ column: 'target', direction: SortDirectionDto.ASC }])).toEqual([
      { field: 'deployment_ref::name', dir: SortDir.Asc, nulls: null },
    ]);
  });

  test('buildRunsSort maps the Runs column to its real query-API field', () => {
    expect(buildRunsSort([{ column: 'runConfig.numberOfRuns', direction: SortDirectionDto.DESC }])).toEqual([
      { field: 'number_of_runs', dir: SortDir.Desc, nulls: null },
    ]);
  });

  test('buildRunsQuery assembles a row query with offset page and include_total', () => {
    const query = buildRunsQuery(
      1,
      20,
      [{ column: 'startedAt', direction: SortDirectionDto.DESC }],
      [{ column: 'status', value: 'COMPLETED', operator: FilterOperatorDto.EQUALS }],
    );

    expect(query.entity).toBe('test_suite_runs');
    expect(query.mode).toBe(QueryMode.Row);
    expect(query.page).toEqual({ type: PageType.Offset, offset: 20, limit: 20, include_total: true });
    expect(query.filter?.op).toBe(ComparisonOp.Eq);
    expect(query.sort).toEqual([{ field: 'started_at_ms', dir: SortDir.Desc, nulls: null }]);
  });

  test('mapRunRow reads the deployment target, metric names and post-query display values', () => {
    expect(
      mapRunRow({
        id: 'run-1',
        test_suite_id: 'suite-1',
        test_run_name: 'Run #1837',
        status: 'COMPLETED',
        number_of_test_cases: 2,
        started_at_ms: 1790319683310,
        completed_at_ms: 1790319687162,
        created_at_ms: 1790319683269,
        updated_at_ms: 1790319687162,
        suite_type: 'DEPLOYMENT',
        'deployment_ref::id': 'msh-anthropic',
        'deployment_ref::name': 'msh-anthropic',
        'deployment_ref::type': 'dial-model',
        metric_names: ['Messages Match'],
        overall_score_value: 1,
        total_cost: 0.000612,
      }),
    ).toEqual({
      id: 'run-1',
      testSuiteId: 'suite-1',
      testRunName: 'Run #1837',
      status: RunStatus.COMPLETED,
      numberOfTestCases: 2,
      startedAt: 1790319683310,
      completedAt: 1790319687162,
      errorMessage: undefined,
      createdAt: 1790319683269,
      updatedAt: 1790319687162,
      metricNames: ['Messages Match'],
      overallScoreValue: 1,
      totalCost: 0.000612,
      suiteSnapshot: {
        suiteType: SuiteType.Deployment,
        deploymentRef: { id: 'msh-anthropic', name: 'msh-anthropic', version: undefined, type: 'dial-model' },
        mcpDeploymentRef: undefined,
      },
    });
  });

  test('mapRunRow nests number_of_runs under runConfig, matching the legacy REST shape the Runs column reads', () => {
    expect(mapRunRow({ id: 'run-1', number_of_runs: 3 }).runConfig).toEqual({ numberOfRuns: 3 });
  });

  test('mapRunRow keeps a zero run count as a value, not as a missing one', () => {
    expect(mapRunRow({ id: 'run-1', number_of_runs: 0 }).runConfig).toEqual({ numberOfRuns: 0 });
  });

  test('mapRunRow leaves runConfig unset when the backend omits number_of_runs', () => {
    expect(mapRunRow({ id: 'run-1' }).runConfig).toBeUndefined();
  });

  test('mapRunRow leaves the post-query values undefined when the backend omits them', () => {
    const run = mapRunRow({ id: 'run-2', status: 'RUNNING' });
    expect(run.overallScoreValue).toBeUndefined();
    expect(run.totalCost).toBeUndefined();
  });

  test('mapRunsQueryResult returns null for a null result', () => {
    expect(mapRunsQueryResult(null, 0, 10)).toBeNull();
  });

  test('mapRunsQueryResult builds EvaluationPageData from the query rows', () => {
    const page = mapRunsQueryResult({ rows: [{ id: 'run-1', status: 'COMPLETED' }], totalCount: 1 }, 0, 10);

    expect(page?.totalElements).toBe(1);
    expect(page?.content).toHaveLength(1);
    expect(page?.content[0].id).toBe('run-1');
  });
});
