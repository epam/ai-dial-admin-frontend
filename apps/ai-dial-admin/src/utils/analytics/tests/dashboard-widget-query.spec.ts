import { describe, expect, test } from 'vitest';

import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { WidgetQueryKind } from '@/src/models/analytics/dashboard';
import {
  QueryExprType,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { QueryRequestKind } from '@/src/models/analytics/query-builder';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { buildWidgetRunRequest } from '@/src/utils/analytics/dashboard-widget-query';

const savedQuery: SavedQuery = {
  id: 'q1',
  name: 'Calls',
  scope: SavedQueryScope.Personal,
  result_view: QueryResultView.Table,
  generation: 1,
  created_at: '',
  updated_at: '',
};

const query: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Aggregate, group_by: ['deployment'] };
const timestampField = { name: 'timestamp', type: AnalyticsFieldType.Timestamp } as AnalyticsEntityField;
const range = { startDate: new Date(1_000), endDate: new Date(2_000) };

describe('buildWidgetRunRequest', () => {
  test('binds the range on the timestamp field and caps the page at the row limit', () => {
    const request = buildWidgetRunRequest(
      { kind: WidgetQueryKind.Structured, savedQuery, query, fields: [timestampField] },
      50,
      range,
    );

    expect(request).toEqual({
      kind: QueryRequestKind.Structured,
      query: {
        ...query,
        filter: {
          op: QueryLogicalOperator.And,
          args: [
            {
              op: QueryOperator.Ge,
              args: [{ type: QueryExprType.Field, name: 'timestamp' }, expect.objectContaining({ value: '1000' })],
            },
            {
              op: QueryOperator.Le,
              args: [{ type: QueryExprType.Field, name: 'timestamp' }, expect.objectContaining({ value: '2000' })],
            },
          ],
        },
        page: { type: QueryPageType.Offset, offset: 0, limit: 50, include_total: false },
      },
    });
  });

  test('runs without a time bound when the entity has no temporal field', () => {
    const request = buildWidgetRunRequest(
      { kind: WidgetQueryKind.Structured, savedQuery, query, fields: [] },
      100,
      range,
    );
    expect(request?.kind === QueryRequestKind.Structured && request.query.filter).toBeUndefined();
  });

  test('runs composite SQL as written', () => {
    const sql = 'SELECT * FROM a JOIN b ON a.id = b.id';
    expect(buildWidgetRunRequest({ kind: WidgetQueryKind.CompositeSql, savedQuery, sql }, 100, range)).toEqual({
      kind: QueryRequestKind.Sql,
      sql,
    });
  });

  test('has nothing to run for an unavailable query', () => {
    expect(buildWidgetRunRequest({ kind: WidgetQueryKind.Unavailable }, 100, range)).toBeNull();
  });

  test('has nothing to run for a query that failed to resolve', () => {
    expect(buildWidgetRunRequest({ kind: WidgetQueryKind.Failed }, 100, range)).toBeNull();
  });
});
