import { describe, expect, test } from 'vitest';

import { sqlFromQuery } from '@/src/components/Analytics/QueryBuilder/utils/sql-generate';
import {
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QuerySortDirection,
  QuerySortNulls,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';

describe('QueryBuilder :: sqlFromQuery', () => {
  test('bare row query selects everything', () => {
    const q: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Row };
    expect(sqlFromQuery(q)).toBe('SELECT\n  *\nFROM dial_usage_log');
  });

  test('renders aggregate query with group by, count alias, sort, and offset paging', () => {
    const q: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Aggregate,
      select: [
        { expr: { type: 'field', name: 'project_id' } },
        { expr: { type: 'fn', name: 'count', args: [] }, as: 'count' },
      ],
      group_by: ['project_id'],
      sort: [{ field: 'count', dir: QuerySortDirection.Desc, nulls: QuerySortNulls.Last }],
      page: { type: QueryPageType.Offset, offset: 50, limit: 25, include_total: false },
    };
    expect(sqlFromQuery(q)).toBe(
      'SELECT\n  project_id,\n  count() AS count\nFROM dial_usage_log\nGROUP BY project_id\nORDER BY count DESC NULLS LAST\nLIMIT 25 OFFSET 50',
    );
  });

  test('renders filters: literals, contains, in-list, is-null, nested group, epoch timestamps', () => {
    const q: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Row,
      filter: {
        op: QueryLogicalOperator.And,
        args: [
          {
            op: QueryOperator.Ge,
            args: [
              { type: 'field', name: 'request_time' },
              { type: 'value', value_type: QueryValueType.Timestamp, value: '1782259200000' },
            ],
          },
          {
            op: QueryOperator.Co,
            args: [
              { type: 'field', name: 'deployment' },
              { type: 'value', value_type: QueryValueType.String, value: "gpt'4" },
            ],
          },
          {
            op: QueryOperator.Eq,
            args: [
              { type: 'field', name: 'chat_id' },
              { type: 'value', value_type: QueryValueType.Null, value: null },
            ],
          },
          {
            op: QueryLogicalOperator.Or,
            args: [
              {
                op: QueryOperator.In,
                args: [
                  { type: 'field', name: 'project_id' },
                  {
                    type: 'array',
                    items: [
                      { type: 'value', value_type: QueryValueType.String, value: 'a' },
                      { type: 'value', value_type: QueryValueType.String, value: 'b' },
                    ],
                  },
                ],
              },
              {
                op: QueryOperator.Gt,
                args: [
                  { type: 'field', name: 'total_tokens' },
                  { type: 'value', value_type: QueryValueType.Long, value: '100' },
                ],
              },
            ],
          },
        ],
      },
    };
    expect(sqlFromQuery(q)).toBe(
      "SELECT\n  *\nFROM dial_usage_log\nWHERE request_time >= 1782259200000 AND deployment LIKE '%gpt''4%' AND chat_id IS NULL AND (project_id IN ('a', 'b') OR total_tokens > 100)",
    );
  });

  test('renders DISTINCT, having, date_bin fn args, and cursor paging as a plain limit', () => {
    const q: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Aggregate,
      distinct: true,
      select: [
        {
          expr: {
            type: 'fn',
            name: 'date_bin',
            args: [
              { type: 'value', value_type: QueryValueType.Integer, value: '5' },
              { type: 'value', value_type: QueryValueType.String, value: 'minute' },
              { type: 'field', name: 'request_time' },
            ],
          },
          as: 'bucket',
        },
      ],
      group_by: ['bucket'],
      having: {
        op: QueryOperator.Gt,
        args: [
          { type: 'field', name: 'count' },
          { type: 'value', value_type: QueryValueType.Long, value: '10' },
        ],
      },
      page: { type: QueryPageType.Cursor, cursor: null, limit: 100 },
    };
    expect(sqlFromQuery(q)).toBe(
      "SELECT DISTINCT\n  date_bin(5, 'minute', request_time) AS bucket\nFROM dial_usage_log\nGROUP BY bucket\nHAVING count > 10\nLIMIT 100",
    );
  });
});
