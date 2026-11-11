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

import { buildTestSuitesForDeploymentQuery, EVAL_TRENDS_SUITES_PAGE_SIZE } from '../build-suites-for-deployment-query';

describe('buildTestSuitesForDeploymentQuery', () => {
  test('filters by deployment_ref::id or mcp_deployment_ref::id and sorts by name', () => {
    const query = buildTestSuitesForDeploymentQuery('gpt-4', 0);

    expect(query).toMatchObject({
      entity: 'test_suites',
      mode: QueryMode.Row,
      filter: {
        op: LogicalOp.Or,
        args: [
          {
            op: ComparisonOp.Eq,
            args: [
              { type: ExprType.Field, name: 'deployment_ref::id' },
              { type: ExprType.Value, value_type: ValueType.String, value: 'gpt-4' },
            ],
          },
          {
            op: ComparisonOp.Eq,
            args: [
              { type: ExprType.Field, name: 'mcp_deployment_ref::id' },
              { type: ExprType.Value, value_type: ValueType.String, value: 'gpt-4' },
            ],
          },
        ],
      },
      sort: [{ field: 'name', dir: SortDir.Asc, nulls: null }],
      page: {
        type: PageType.Offset,
        offset: 0,
        limit: EVAL_TRENDS_SUITES_PAGE_SIZE,
        include_total: true,
      },
    });
    expect(query.select?.some((column) => column.expr.type === ExprType.Field && column.expr.name === 'id')).toBe(true);
  });

  test('offsets by page size for later pages', () => {
    const query = buildTestSuitesForDeploymentQuery('app-1', 2, 50);
    expect(query.page).toEqual({
      type: PageType.Offset,
      offset: 100,
      limit: 50,
      include_total: true,
    });
  });
});
