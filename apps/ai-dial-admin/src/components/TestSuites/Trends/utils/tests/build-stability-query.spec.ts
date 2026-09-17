import { describe, expect, test } from 'vitest';

import {
  EVAL_SUMMARIES_ENTITY,
  PASSED_FIELD,
  RUN_ID_FIELD,
  SCORE_FIELD,
  TEST_CASE_NAME_FIELD,
  TRENDS_STABILITY_ROW_LIMIT,
} from '@/src/components/TestSuites/Trends/constants';
import { buildTrendsStabilityQuery } from '@/src/components/TestSuites/Trends/utils/build-stability-query';
import {
  ComparisonOp,
  ExprType,
  PageType,
  QueryMode,
  SortDir,
  ValueType,
} from '@/src/models/evaluation/structured-query';

describe('buildTrendsStabilityQuery', () => {
  test('matches the BE eval_summaries row contract', () => {
    const query = buildTrendsStabilityQuery(['run-a', 'run-b']);

    expect(query).toEqual({
      entity: EVAL_SUMMARIES_ENTITY,
      mode: QueryMode.Row,
      select: [
        { expr: { type: ExprType.Field, name: RUN_ID_FIELD } },
        { expr: { type: ExprType.Field, name: TEST_CASE_NAME_FIELD } },
        { expr: { type: ExprType.Field, name: SCORE_FIELD } },
        { expr: { type: ExprType.Field, name: PASSED_FIELD } },
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
      sort: [
        { field: RUN_ID_FIELD, dir: SortDir.Desc, nulls: null },
        { field: TEST_CASE_NAME_FIELD, dir: SortDir.Asc, nulls: null },
      ],
      page: {
        type: PageType.Offset,
        offset: 0,
        limit: TRENDS_STABILITY_ROW_LIMIT,
        include_total: false,
      },
    });
  });
});
