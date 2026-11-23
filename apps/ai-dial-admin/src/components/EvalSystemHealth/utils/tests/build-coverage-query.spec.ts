import { describe, expect, test } from 'vitest';

import { buildCoverageQuery } from '@/src/components/EvalSystemHealth/utils/build-coverage-query';
import {
  ComparisonNode,
  ComparisonOp,
  ExprType,
  LogicalNode,
  LogicalOp,
  QueryMode,
  SubqueryExpr,
  ValueType,
} from '@/src/models/evaluation/structured-query';

const WINDOW_START = 1_700_000_000_000;

const getFilter = (windowStartMs: number) => buildCoverageQuery(windowStartMs).filter as LogicalNode;

describe('buildCoverageQuery', () => {
  test('aggregates test suite runs grouped by the two deployment refs', () => {
    const query = buildCoverageQuery(WINDOW_START);

    expect(query.entity).toBe('test_suite_runs');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual(['deployment_ref::id', 'mcp_deployment_ref::id']);
  });

  test('selects both ref ids and the latest run start', () => {
    const select = buildCoverageQuery(WINDOW_START).select ?? [];

    expect(select.map((column) => column.as)).toEqual([undefined, undefined, 'last_run_ms']);
    expect(select[0].expr).toMatchObject({ type: ExprType.Field, name: 'deployment_ref::id' });
    expect(select[1].expr).toMatchObject({ type: ExprType.Field, name: 'mcp_deployment_ref::id' });
    expect(select[2].expr).toMatchObject({ type: ExprType.Fn, name: 'max' });
  });

  test('keeps only runs that started at or after the window start', () => {
    const filter = getFilter(WINDOW_START);
    const windowNode = filter.args[0] as ComparisonNode;

    expect(filter.op).toBe(LogicalOp.And);
    expect(windowNode.op).toBe(ComparisonOp.Ge);
    expect(windowNode.args).toEqual([
      { type: ExprType.Field, name: 'started_at_ms' },
      { type: ExprType.Value, value_type: ValueType.Long, value: String(WINDOW_START) },
    ]);
  });

  test('takes the window start from its parameter, not from the clock', () => {
    expect(getFilter(1)).not.toEqual(getFilter(2));
    expect(getFilter(WINDOW_START)).toEqual(getFilter(WINDOW_START));
  });

  test('drops runs of deleted suites by requiring the suite id among existing test suites', () => {
    const suiteNode = getFilter(WINDOW_START).args[1] as ComparisonNode;
    const subquery = suiteNode.args[1] as SubqueryExpr;

    expect(suiteNode.op).toBe(ComparisonOp.In);
    expect(suiteNode.args[0]).toEqual({ type: ExprType.Field, name: 'test_suite_id' });
    expect(subquery.type).toBe(ExprType.Subquery);
    expect(subquery.query.entity).toBe('test_suites');
    expect(subquery.query.group_by).toEqual(['id']);
  });

  test('pages wide enough that neither the evaluatee rows nor the suite ids are cut at the default size', () => {
    const query = buildCoverageQuery(WINDOW_START);
    const subquery = ((query.filter as LogicalNode).args[1] as ComparisonNode).args[1] as SubqueryExpr;

    expect(query.page?.limit).toBeGreaterThan(100);
    expect(subquery.query.page?.limit).toBeGreaterThan(100);
  });
});
