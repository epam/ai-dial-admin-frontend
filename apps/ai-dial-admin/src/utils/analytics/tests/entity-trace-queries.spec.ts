import { describe, expect, test } from 'vitest';

import { USAGE_LOG_ENTITY } from '@/src/constants/analytics/sessions-trace';
import {
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryOperator,
  QuerySortDirection,
  QueryValueType,
} from '@/src/models/analytics/query';
import { ApplicationRoute } from '@/src/types/routes';
import { buildEntityCallPageQuery, entityCallClauses } from '@/src/utils/analytics/entity-trace-queries';

const clause = (fieldName: string, val: string): QueryFilterNode => ({
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name: fieldName },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value: val },
  ],
});

const RANGE = { fromMs: 1000, toMs: 9000 };

describe('entityCallClauses', () => {
  test('selects a model by the name the log records its calls under', () => {
    expect(entityCallClauses(ApplicationRoute.Models, 'a-model')).toEqual([clause('deployment', 'a-model')]);
  });

  test('selects an application by its own calls only', () => {
    expect(entityCallClauses(ApplicationRoute.Applications, 'an-app')).toEqual([clause('deployment', 'an-app')]);
  });

  test('narrows a toolset to its tool calls', () => {
    expect(entityCallClauses(ApplicationRoute.Toolsets, 'a-toolset')).toEqual([
      clause('deployment', 'a-toolset'),
      { op: QueryLogicalOperator.And, args: [clause('event_kind', 'mcp'), clause('mcp_method', 'tools/call')] },
    ]);
  });

  test('yields no clauses for an entity with no name to match', () => {
    expect(entityCallClauses(ApplicationRoute.Models, null)).toBeNull();
  });
});

describe('buildEntityCallPageQuery', () => {
  const clauses = [clause('deployment', 'a-model')];

  test('reads call rows of the usage log, newest first with a span-id tie-break', () => {
    const query = buildEntityCallPageQuery(clauses, RANGE, 50);

    expect(query.entity).toBe(USAGE_LOG_ENTITY);
    expect(query.sort).toEqual([
      expect.objectContaining({ field: 'request_time', dir: QuerySortDirection.Desc }),
      expect.objectContaining({ field: 'core_span_id', dir: QuerySortDirection.Desc }),
    ]);
    expect(query.page).toEqual(expect.objectContaining({ offset: 0, limit: 50 }));
  });

  test('projects the fields the call tier states', () => {
    const query = buildEntityCallPageQuery(clauses, RANGE, 50);
    const names = query.select?.map(({ expr }) => (expr as { name: string }).name);

    expect(names).toEqual(expect.arrayContaining(['trace_id', 'core_span_id', 'parent_deployment', 'project_id']));
  });

  test('bounds the first page by the period alone', () => {
    const query = buildEntityCallPageQuery(clauses, RANGE, 50);

    expect(query.filter).toEqual({
      op: QueryLogicalOperator.And,
      args: [
        ...clauses,
        expect.objectContaining({ op: QueryOperator.Ge }),
        expect.objectContaining({ op: QueryOperator.Le }),
      ],
    });
  });

  test('reads a further page strictly after the last call shown', () => {
    const query = buildEntityCallPageQuery(clauses, RANGE, 50, { requestTime: 5000, coreSpanId: 'span-9' });
    const after = (query.filter as { args: unknown[] }).args.at(-1);

    expect(after).toEqual({
      op: QueryLogicalOperator.Or,
      args: [
        expect.objectContaining({ op: QueryOperator.Lt }),
        {
          op: QueryLogicalOperator.And,
          args: [expect.objectContaining({ op: QueryOperator.Eq }), expect.objectContaining({ op: QueryOperator.Lt })],
        },
      ],
    });
  });
});
