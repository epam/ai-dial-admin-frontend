import { describe, expect, test } from 'vitest';

import {
  COMPUTED_AT_MS_FIELD,
  LAST_COMPUTED_ALIAS,
  METRIC_NAME_FIELD,
  METRIC_SCORE_NAME_FIELD,
  METRIC_SCORE_RESULTS_ENTITY,
  RUN_ID_FIELD,
  TEST_SUITE_ID_FIELD,
  TRENDS_RUN_WINDOW,
  TRENDS_SCORE_ROW_LIMIT,
  VALUE_FIELD,
} from '@/src/components/TestSuites/Trends/constants';
import { buildTrendsMetricScoresQuery } from '@/src/components/TestSuites/Trends/utils/build-trends-query';
import {
  ComparisonOp,
  ExprType,
  LogicalOp,
  PageType,
  QueryMode,
  SortDir,
  ValueType,
} from '@/src/models/evaluation/structured-query';

describe('buildTrendsMetricScoresQuery', () => {
  test('builds a row query filtered by suite id and last-N-runs subquery', () => {
    const query = buildTrendsMetricScoresQuery('suite-1');

    expect(query.entity).toBe(METRIC_SCORE_RESULTS_ENTITY);
    expect(query.mode).toBe(QueryMode.Row);
    expect(query.select).toEqual([
      { expr: { type: ExprType.Field, name: RUN_ID_FIELD } },
      { expr: { type: ExprType.Field, name: METRIC_NAME_FIELD } },
      { expr: { type: ExprType.Field, name: METRIC_SCORE_NAME_FIELD } },
      { expr: { type: ExprType.Field, name: VALUE_FIELD } },
      { expr: { type: ExprType.Field, name: COMPUTED_AT_MS_FIELD } },
    ]);
    expect(query.sort).toEqual([{ field: COMPUTED_AT_MS_FIELD, dir: SortDir.Desc, nulls: null }]);
    expect(query.page).toEqual({
      type: PageType.Offset,
      offset: 0,
      limit: TRENDS_SCORE_ROW_LIMIT,
      include_total: false,
    });

    expect(query.filter?.op).toBe(LogicalOp.And);
    const args = query.filter && 'args' in query.filter ? query.filter.args : [];
    expect(args[0]).toEqual({
      op: ComparisonOp.Eq,
      args: [
        { type: ExprType.Field, name: TEST_SUITE_ID_FIELD },
        { type: ExprType.Value, value_type: ValueType.Uuid, value: 'suite-1' },
      ],
    });

    const inNode = args[1] as {
      op: ComparisonOp;
      args: [{ type: ExprType; name: string }, { type: ExprType; query: Record<string, unknown> }];
    };
    expect(inNode.op).toBe(ComparisonOp.In);
    expect(inNode.args[0]).toEqual({ type: ExprType.Field, name: RUN_ID_FIELD });
    expect(inNode.args[1].type).toBe(ExprType.Subquery);

    const subquery = inNode.args[1].query;
    expect(subquery).toMatchObject({
      entity: METRIC_SCORE_RESULTS_ENTITY,
      mode: QueryMode.Aggregate,
      group_by: [RUN_ID_FIELD],
      page: { type: PageType.Offset, offset: 0, limit: TRENDS_RUN_WINDOW, include_total: false },
      sort: [{ field: LAST_COMPUTED_ALIAS, dir: SortDir.Desc, nulls: null }],
    });
    expect(subquery.select).toEqual([
      { expr: { type: ExprType.Field, name: RUN_ID_FIELD } },
      {
        expr: {
          type: ExprType.Fn,
          name: 'max',
          args: [{ type: ExprType.Field, name: COMPUTED_AT_MS_FIELD }],
        },
        as: LAST_COMPUTED_ALIAS,
      },
    ]);
  });

  test('honors a custom run window', () => {
    const query = buildTrendsMetricScoresQuery('suite-1', 3);
    const args = query.filter && 'args' in query.filter ? query.filter.args : [];
    const inNode = args[1] as { args: [unknown, { query: { page?: { limit: number } } }] };
    expect(inNode.args[1].query.page?.limit).toBe(3);
  });
});
