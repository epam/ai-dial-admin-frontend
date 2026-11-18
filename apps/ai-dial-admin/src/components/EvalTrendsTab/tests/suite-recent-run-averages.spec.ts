import { describe, expect, test, vi } from 'vitest';

import {
  ComparisonOp,
  ExprType,
  LogicalOp,
  PageType,
  QueryMode,
  SortDir,
  ValueType,
} from '@/src/models/evaluation/structured-query';

import {
  aggregateSuiteRecentRunAverages,
  buildSuiteRecentRunsQuery,
  EVAL_TRENDS_RECENT_RUNS_PER_SUITE,
  EVAL_TRENDS_SUITE_AVG_BATCH_SIZE,
  loadSuiteRecentRunAverages,
} from '../suite-recent-run-averages';

describe('buildSuiteRecentRunsQuery', () => {
  test('returns null when there are no suite ids', () => {
    expect(buildSuiteRecentRunsQuery([])).toBeNull();
    expect(buildSuiteRecentRunsQuery([''])).toBeNull();
  });

  test('uses a single in-subquery filter for one suite (no or wrapper)', () => {
    const suiteId = 'a0d61972-f9f6-4f34-86df-c4e4c1cfc9b3';
    const query = buildSuiteRecentRunsQuery([suiteId]);

    expect(query).toMatchObject({
      entity: 'test_suite_runs',
      mode: QueryMode.Row,
      filter: {
        op: ComparisonOp.In,
        args: [
          { type: ExprType.Field, name: 'id' },
          {
            type: ExprType.Subquery,
            query: {
              entity: 'test_suite_runs',
              mode: QueryMode.Row,
              filter: {
                op: ComparisonOp.Eq,
                args: [
                  { type: ExprType.Field, name: 'test_suite_id' },
                  { type: ExprType.Value, value_type: ValueType.Uuid, value: suiteId },
                ],
              },
              sort: [{ field: 'created_at_ms', dir: SortDir.Desc, nulls: null }],
              page: {
                type: PageType.Offset,
                offset: 0,
                limit: EVAL_TRENDS_RECENT_RUNS_PER_SUITE,
                include_total: false,
              },
            },
          },
        ],
      },
      sort: [
        { field: 'test_suite_id', dir: SortDir.Asc, nulls: null },
        { field: 'created_at_ms', dir: SortDir.Desc, nulls: null },
      ],
      page: {
        type: PageType.Offset,
        offset: 0,
        limit: EVAL_TRENDS_RECENT_RUNS_PER_SUITE,
        include_total: false,
      },
    });
    expect(query?.filter).not.toMatchObject({ op: LogicalOp.Or });
  });

  test('ors one in-subquery window per suite and sizes the outer page to suiteCount * 10', () => {
    const ids = ['a0d61972-f9f6-4f34-86df-c4e4c1cfc9b3', 'c7b413b2-1200-4586-a492-a884d5934409'];
    const query = buildSuiteRecentRunsQuery(ids);

    expect(query?.filter).toMatchObject({ op: LogicalOp.Or });
    expect(query?.filter && 'args' in query.filter ? query.filter.args : []).toHaveLength(2);
    expect(query?.page).toEqual({
      type: PageType.Offset,
      offset: 0,
      limit: ids.length * EVAL_TRENDS_RECENT_RUNS_PER_SUITE,
      include_total: false,
    });
  });

  test('selects only id, test_suite_id, and created_at_ms (score and cost are post-query)', () => {
    const query = buildSuiteRecentRunsQuery(['a0d61972-f9f6-4f34-86df-c4e4c1cfc9b3']);
    const fieldNames =
      query?.select
        ?.filter((column) => column.expr.type === ExprType.Field)
        .map((column) => (column.expr.type === ExprType.Field ? column.expr.name : '')) ?? [];

    expect(fieldNames).toEqual(['id', 'test_suite_id', 'created_at_ms']);
    expect(fieldNames).not.toContain('overall_score_value');
    expect(fieldNames).not.toContain('total_cost');
  });
});

describe('aggregateSuiteRecentRunAverages', () => {
  test('groups by suite and averages only finite score and cost values', () => {
    const averages = aggregateSuiteRecentRunAverages([
      { id: 'r1', test_suite_id: 'suite-a', overall_score_value: 0.5, total_cost: 1 },
      { id: 'r2', test_suite_id: 'suite-a', overall_score_value: 0.7, total_cost: null },
      { id: 'r3', test_suite_id: 'suite-b', overall_score_value: 1, total_cost: 0.2 },
      { id: 'r4', test_suite_id: 'suite-b', overall_score_value: 'not-a-number', total_cost: 0.4 },
    ]);

    expect(averages).toHaveLength(2);
    expect(averages[0]).toEqual({ suiteId: 'suite-a', runCount: 2, avgScore: 0.6, avgCost: 1 });
    expect(averages[1].suiteId).toBe('suite-b');
    expect(averages[1].runCount).toBe(2);
    expect(averages[1].avgScore).toBe(1);
    expect(averages[1].avgCost).toBeCloseTo(0.3);
  });

  test('keeps suite windows separate and skips rows without a suite id', () => {
    const averages = aggregateSuiteRecentRunAverages([
      { id: 'r1', test_suite_id: 'suite-a', overall_score_value: 0.2, total_cost: 0.1 },
      { id: 'orphan', overall_score_value: 0.9, total_cost: 9 },
      { id: 'r2', test_suite_id: 'suite-b', overall_score_value: 0.8, total_cost: 0.5 },
    ]);

    expect(averages).toHaveLength(2);
    expect(averages.find((row) => row.suiteId === 'suite-a')).toEqual({
      suiteId: 'suite-a',
      runCount: 1,
      avgScore: 0.2,
      avgCost: 0.1,
    });
    expect(averages.find((row) => row.suiteId === 'suite-b')).toEqual({
      suiteId: 'suite-b',
      runCount: 1,
      avgScore: 0.8,
      avgCost: 0.5,
    });
  });

  test('returns null averages when a suite window has no numeric values', () => {
    expect(
      aggregateSuiteRecentRunAverages([
        { id: 'r1', test_suite_id: 'suite-a', overall_score_value: null, total_cost: undefined },
      ]),
    ).toEqual([{ suiteId: 'suite-a', runCount: 1, avgScore: null, avgCost: null }]);
  });
});

describe('loadSuiteRecentRunAverages', () => {
  test('returns an empty list without calling execute when there are no suite ids', async () => {
    const execute = vi.fn();
    await expect(loadSuiteRecentRunAverages([], execute)).resolves.toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  test('executes one query for a single batch and aggregates its rows', async () => {
    const execute = vi.fn().mockResolvedValue({
      rows: [
        { id: 'r1', test_suite_id: 'suite-a', overall_score_value: 0.4, total_cost: 0.2 },
        { id: 'r2', test_suite_id: 'suite-a', overall_score_value: 0.6, total_cost: 0.4 },
      ],
    });

    const averages = await loadSuiteRecentRunAverages(['suite-a'], execute);
    expect(averages).toHaveLength(1);
    expect(averages[0].suiteId).toBe('suite-a');
    expect(averages[0].runCount).toBe(2);
    expect(averages[0].avgScore).toBe(0.5);
    expect(averages[0].avgCost).toBeCloseTo(0.3);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  test('splits suite ids into page-sized batches and flattens the results', async () => {
    const ids = Array.from({ length: EVAL_TRENDS_SUITE_AVG_BATCH_SIZE + 1 }, (_, index) => `suite-${index}`);
    const execute = vi.fn().mockImplementation(async (query: { page?: { limit?: number } }) => ({
      rows: [
        {
          id: `run-${query.page?.limit}`,
          test_suite_id: ids[0],
          overall_score_value: 1,
          total_cost: 1,
        },
      ],
    }));

    const averages = await loadSuiteRecentRunAverages(ids, execute);

    expect(execute).toHaveBeenCalledTimes(2);
    expect(averages).toHaveLength(2);
    expect(averages.every((row) => row.suiteId === ids[0])).toBe(true);
  });

  test('propagates execute failures to the caller', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('query failed'));
    await expect(loadSuiteRecentRunAverages(['suite-a'], execute)).rejects.toThrow('query failed');
  });
});
