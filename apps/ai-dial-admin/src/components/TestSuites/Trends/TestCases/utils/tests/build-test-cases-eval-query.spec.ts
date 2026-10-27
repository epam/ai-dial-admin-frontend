import { describe, expect, test } from 'vitest';

import { COUNT_ALIAS, EXECUTION_STATUS_FIELD } from '@/src/components/Runs/Summary/constants';
import { PASSED_FIELD, RUN_ID_FIELD, TEST_CASE_EVAL_SCORES_ENTITY } from '@/src/components/TestSuites/Trends/constants';
import { buildTrendsTestCasesEvalQuery } from '@/src/components/TestSuites/Trends/TestCases/utils/build-test-cases-eval-query';
import { ComparisonOp, ExprType, PageType, QueryMode, ValueType } from '@/src/models/evaluation/structured-query';

describe('buildTrendsTestCasesEvalQuery', () => {
  test('aggregates count by run, passed, and execution status', () => {
    const query = buildTrendsTestCasesEvalQuery(['run-a', 'run-b']);

    expect(query).toEqual({
      entity: TEST_CASE_EVAL_SCORES_ENTITY,
      mode: QueryMode.Aggregate,
      group_by: [RUN_ID_FIELD, PASSED_FIELD, EXECUTION_STATUS_FIELD],
      select: [
        { expr: { type: ExprType.Field, name: RUN_ID_FIELD } },
        { expr: { type: ExprType.Field, name: PASSED_FIELD } },
        { expr: { type: ExprType.Field, name: EXECUTION_STATUS_FIELD } },
        { expr: { type: ExprType.Fn, name: 'count', args: [] }, as: COUNT_ALIAS },
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
        limit: 40,
        include_total: false,
      },
    });
  });
});
