import { describe, expect, test } from 'vitest';

import { buildActivityQueries } from '@/src/components/EvalSystemHealth/utils/build-activity-queries';
import {
  ComparisonNode,
  ExprType,
  LogicalNode,
  QueryMode,
  SubqueryExpr,
  ValueType,
} from '@/src/models/evaluation/structured-query';

const WINDOWS = { current: { fromMs: 1000, toMs: 2000 }, previous: { fromMs: 10, toMs: 20 } };

const queries = buildActivityQueries(WINDOWS);

const periodNodes = (filter: LogicalNode | ComparisonNode | undefined) =>
  (filter as LogicalNode).args as ComparisonNode[];

const valueOf = (node: ComparisonNode) => node.args[1];

const fieldOf = (node: ComparisonNode) => node.args[0];

describe('buildActivityQueries', () => {
  test('reads the total of existing test suites from a one-row page that asks for the total', () => {
    expect(queries.totalSuites).toMatchObject({
      entity: 'test_suites',
      mode: QueryMode.Row,
      page: { limit: 1, include_total: true },
    });
    expect(queries.totalSuites.filter).toBeUndefined();
  });

  test('groups the runs of the current period by test suite', () => {
    expect(queries.suitesRunCurrent).toMatchObject({
      entity: 'test_suite_runs',
      mode: QueryMode.Aggregate,
      group_by: ['test_suite_id'],
    });
    expect(queries.suitesRunCurrent.select?.map((column) => column.as)).toEqual([undefined, 'last_run_ms']);
  });

  test('bounds the run query by the period on both ends, inclusive', () => {
    const [from, to] = periodNodes(queries.suitesRunCurrent.filter);

    expect(from.op).toBe('ge');
    expect(fieldOf(from)).toEqual({ type: ExprType.Field, name: 'started_at_ms' });
    expect(valueOf(from)).toEqual({ type: ExprType.Value, value_type: ValueType.Long, value: '1000' });
    expect(to.op).toBe('le');
    expect(fieldOf(to)).toEqual({ type: ExprType.Field, name: 'started_at_ms' });
    expect(valueOf(to)).toEqual({ type: ExprType.Value, value_type: ValueType.Long, value: '2000' });
  });

  test('drops runs of deleted suites by requiring the suite id among existing test suites', () => {
    const suiteNode = periodNodes(queries.suitesRunCurrent.filter)[2];
    const subquery = suiteNode.args[1] as SubqueryExpr;

    expect(suiteNode.op).toBe('in');
    expect(fieldOf(suiteNode)).toEqual({ type: ExprType.Field, name: 'test_suite_id' });
    expect(subquery.query.entity).toBe('test_suites');
  });

  test('builds the previous run query over the previous period', () => {
    const [from, to] = periodNodes(queries.suitesRunPrevious.filter);

    expect(valueOf(from)).toMatchObject({ value: '10' });
    expect(valueOf(to)).toMatchObject({ value: '20' });
  });

  test('reads the test suites created in the current period with their targets and the total', () => {
    const query = queries.suitesAddedCurrent;
    const [from, to] = periodNodes(query.filter);

    expect(query).toMatchObject({ entity: 'test_suites', mode: QueryMode.Row, page: { include_total: true } });
    expect(query.select?.map((column) => (column.expr as { name: string }).name)).toEqual([
      'deployment_ref::id',
      'mcp_deployment_ref::id',
    ]);
    expect(from.op).toBe('ge');
    expect(fieldOf(from)).toEqual({ type: ExprType.Field, name: 'created_at_ms' });
    expect(valueOf(from)).toMatchObject({ value: '1000' });
    expect(to.op).toBe('le');
    expect(valueOf(to)).toMatchObject({ value: '2000' });
  });

  test('pages the created-suites rows wider than the default size', () => {
    expect(queries.suitesAddedCurrent.page?.limit).toBeGreaterThan(100);
  });

  test('counts the test suites created in the previous period from a one-row page', () => {
    const query = queries.suitesAddedPrevious;
    const [from, to] = periodNodes(query.filter);

    expect(query.page).toMatchObject({ limit: 1, include_total: true });
    expect(valueOf(from)).toMatchObject({ value: '10' });
    expect(valueOf(to)).toMatchObject({ value: '20' });
  });

  test('is deterministic for the same periods and differs for different ones', () => {
    expect(buildActivityQueries(WINDOWS)).toEqual(queries);
    expect(buildActivityQueries({ ...WINDOWS, current: { fromMs: 5, toMs: 6 } })).not.toEqual(queries);
  });
});
