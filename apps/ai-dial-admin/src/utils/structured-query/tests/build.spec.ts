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
import { aggregateQuery, and, col, eq, field, fn, offsetPage, rowQuery, sortItem, value } from '../build';

describe('structured-query build helpers', () => {
  test('field builds a field expression', () => {
    expect(field('execution_status')).toEqual({ type: ExprType.Field, name: 'execution_status' });
  });

  test('value builds a typed value expression', () => {
    expect(value(ValueType.Uuid, 'run-1')).toEqual({
      type: ExprType.Value,
      value_type: ValueType.Uuid,
      value: 'run-1',
    });
  });

  test('fn defaults args to an empty list', () => {
    expect(fn('count')).toEqual({ type: ExprType.Fn, name: 'count', args: [] });
    expect(fn('avg', [field('exec_duration_ms')])).toEqual({
      type: ExprType.Fn,
      name: 'avg',
      args: [{ type: ExprType.Field, name: 'exec_duration_ms' }],
    });
  });

  test('col omits alias when not provided and includes it when given', () => {
    expect(col(field('id'))).toEqual({ expr: { type: ExprType.Field, name: 'id' } });
    expect(col(fn('count'), 'total')).toEqual({ expr: { type: ExprType.Fn, name: 'count', args: [] }, as: 'total' });
  });

  test('eq builds an equality comparison node', () => {
    expect(eq('test_suite_run_id', ValueType.Uuid, 'run-1')).toEqual({
      op: ComparisonOp.Eq,
      args: [
        { type: ExprType.Field, name: 'test_suite_run_id' },
        { type: ExprType.Value, value_type: ValueType.Uuid, value: 'run-1' },
      ],
    });
  });

  test('and wraps nodes in a logical AND', () => {
    const node = eq('a', ValueType.String, 'x');
    expect(and([node])).toEqual({ op: LogicalOp.And, args: [node] });
  });

  test('offsetPage builds an offset page spec', () => {
    expect(offsetPage(0, 25, true)).toEqual({
      type: PageType.Offset,
      offset: 0,
      limit: 25,
      include_total: true,
    });
    expect(offsetPage(10, 5)).toEqual({ type: PageType.Offset, offset: 10, limit: 5, include_total: false });
  });

  test('aggregateQuery assembles a full aggregate query with defaults', () => {
    const query = aggregateQuery({
      entity: 'eval_summaries',
      select: [col(fn('count'), 'total')],
      filter: eq('test_suite_run_id', ValueType.Uuid, 'run-1'),
      groupBy: ['execution_status'],
    });

    expect(query).toEqual({
      entity: 'eval_summaries',
      mode: QueryMode.Aggregate,
      select: [{ expr: { type: ExprType.Fn, name: 'count', args: [] }, as: 'total' }],
      filter: eq('test_suite_run_id', ValueType.Uuid, 'run-1'),
      group_by: ['execution_status'],
      page: { type: PageType.Offset, offset: 0, limit: 100, include_total: false },
    });
  });

  test('aggregateQuery omits optional sections when not provided', () => {
    const query = aggregateQuery({ entity: 'eval_summaries', select: [col(fn('count'))] });

    expect(query.filter).toBeUndefined();
    expect(query.group_by).toBeUndefined();
    expect(query.page).toEqual({ type: PageType.Offset, offset: 0, limit: 100, include_total: false });
  });

  test('sortItem builds a sort clause with null nulls by default', () => {
    expect(sortItem('metric_name', SortDir.Asc)).toEqual({ field: 'metric_name', dir: SortDir.Asc, nulls: null });
  });

  test('rowQuery assembles a row-mode query with sort and a default 1000-row page', () => {
    const query = rowQuery({
      entity: 'metric_score_results',
      select: [col(field('metric_name'))],
      filter: eq('test_suite_run_id', ValueType.Uuid, 'run-1'),
      sort: [sortItem('metric_name', SortDir.Asc)],
    });

    expect(query).toEqual({
      entity: 'metric_score_results',
      mode: QueryMode.Row,
      select: [{ expr: { type: ExprType.Field, name: 'metric_name' } }],
      filter: eq('test_suite_run_id', ValueType.Uuid, 'run-1'),
      sort: [{ field: 'metric_name', dir: SortDir.Asc, nulls: null }],
      page: { type: PageType.Offset, offset: 0, limit: 1000, include_total: false },
    });
  });
});
