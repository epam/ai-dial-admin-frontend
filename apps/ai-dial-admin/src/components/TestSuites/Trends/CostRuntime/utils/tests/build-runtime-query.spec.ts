import { describe, expect, test } from 'vitest';

import {
  AVG_DURATION_ALIAS,
  AVG_METRIC_EVAL_DURATION_ALIAS,
  EVAL_SUMMARIES_ENTITY,
  EXEC_DURATION_MS_FIELD,
  METRIC_EVAL_DURATION_MS_FIELD,
  RUN_ID_FIELD,
} from '@/src/components/Runs/Summary/constants';
import { buildTrendsRuntimeQuery } from '@/src/components/TestSuites/Trends/CostRuntime/utils/build-runtime-query';
import { ComparisonOp, ExprType, PageType, QueryMode, ValueType } from '@/src/models/evaluation/structured-query';

describe('buildTrendsRuntimeQuery', () => {
  test('aggregates exec and metric-eval duration averages by run id', () => {
    const query = buildTrendsRuntimeQuery(['run-a', 'run-b']);

    expect(query).toEqual({
      entity: EVAL_SUMMARIES_ENTITY,
      mode: QueryMode.Aggregate,
      group_by: [RUN_ID_FIELD],
      select: [
        { expr: { type: ExprType.Field, name: RUN_ID_FIELD } },
        {
          expr: { type: ExprType.Fn, name: 'avg', args: [{ type: ExprType.Field, name: EXEC_DURATION_MS_FIELD }] },
          as: AVG_DURATION_ALIAS,
        },
        {
          expr: {
            type: ExprType.Fn,
            name: 'avg',
            args: [{ type: ExprType.Field, name: METRIC_EVAL_DURATION_MS_FIELD }],
          },
          as: AVG_METRIC_EVAL_DURATION_ALIAS,
        },
      ],
      filter: {
        op: ComparisonOp.In,
        args: [
          { type: ExprType.Field, name: RUN_ID_FIELD },
          {
            type: ExprType.Array,
            items: [
              { type: ExprType.Value, value_type: ValueType.Uuid, value: 'run-a' },
              { type: ExprType.Value, value_type: ValueType.Uuid, value: 'run-b' },
            ],
          },
        ],
      },
      page: {
        type: PageType.Offset,
        offset: 0,
        limit: 10,
        include_total: false,
      },
    });
  });
});
