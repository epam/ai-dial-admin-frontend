import { describe, expect, test } from 'vitest';

import { DashboardWidget, WidgetQuery, WidgetQueryKind, WidgetQuerySource } from '@/src/models/analytics/dashboard';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQueryScope } from '@/src/models/analytics/saved-query';
import {
  copyPersonalQueries,
  formatQueryPreview,
  getWidgetQueryKey,
  getWidgetQuerySource,
  toInlineQuery,
  toSqlInlineQuery,
} from '@/src/utils/analytics/widget-source';

const structured: StructuredQuery = { entity: 'usage', mode: QueryMode.Aggregate };

const widget = (patch: Partial<DashboardWidget> = {}): DashboardWidget => ({
  id: 'w1',
  saved_query_id: 'q1',
  row_limit: 100,
  layout: { x: 0, y: 0, w: 6, h: 4 },
  ...patch,
});

const source = (patch: Partial<WidgetQuerySource> = {}): WidgetQuerySource => ({
  id: 'q1',
  name: 'Spend',
  scope: SavedQueryScope.Personal,
  sql: 'SELECT 1',
  result_view: QueryResultView.Chart,
  ...patch,
});

const compositeQuery = (savedQuery: WidgetQuerySource): WidgetQuery => ({
  kind: WidgetQueryKind.CompositeSql,
  savedQuery,
  sql: savedQuery.sql ?? '',
});

describe('getWidgetQueryKey', () => {
  test('keys a saved query widget by its saved query id', () => {
    expect(getWidgetQueryKey({ id: 'w1', saved_query_id: 'q1' })).toBe('q1');
  });

  test('keys an inline query widget by its own id', () => {
    expect(getWidgetQueryKey({ id: 'w1' })).toBe('inline:w1');
  });
});

describe('getWidgetQuerySource', () => {
  test('gives the query a resolved widget query was made from', () => {
    const savedQuery = source();
    expect(getWidgetQuerySource(compositeQuery(savedQuery))).toBe(savedQuery);
  });

  test.each([WidgetQueryKind.Unavailable, WidgetQueryKind.Failed] as const)('gives none for a %s query', (kind) => {
    expect(getWidgetQuerySource({ kind })).toBeNull();
  });

  test('gives none for a query still being resolved', () => {
    expect(getWidgetQuerySource(undefined)).toBeNull();
  });
});

describe('toInlineQuery', () => {
  test('keeps only the body, the view and the chart, and of two bodies the SQL one', () => {
    const chart = { type: 'bar' } as unknown as WidgetQuerySource['chart'];
    expect(toInlineQuery(source({ query: structured, chart }))).toEqual({
      name: 'Spend',
      sql: 'SELECT 1',
      result_view: QueryResultView.Chart,
      chart,
    });
  });

  test('defaults an absent result view to a table and leaves absent members out', () => {
    expect(toInlineQuery(source({ sql: undefined, query: structured, result_view: undefined }))).toEqual({
      name: 'Spend',
      query: structured,
      result_view: QueryResultView.Table,
    });
  });
});

describe('toSqlInlineQuery', () => {
  test('names the statement by the widget title and draws it as a table', () => {
    expect(toSqlInlineQuery('Top users', 'SELECT 2')).toEqual({
      name: 'Top users',
      sql: 'SELECT 2',
      result_view: QueryResultView.Table,
    });
  });
});

describe('formatQueryPreview', () => {
  test('shows a SQL statement as written', () => {
    expect(formatQueryPreview({ sql: 'SELECT 1', query: structured })).toBe('SELECT 1');
  });

  test('shows a structured body as indented JSON', () => {
    expect(formatQueryPreview({ query: structured })).toBe(JSON.stringify(structured, null, 2));
  });

  test('shows nothing for a query with no body', () => {
    expect(formatQueryPreview({})).toBe('');
  });
});

describe('copyPersonalQueries', () => {
  test('keeps a widget on a common query as a reference', () => {
    const common = widget({ saved_query_id: 'c1' });
    const queries = { c1: compositeQuery(source({ id: 'c1', scope: SavedQueryScope.Common })) };

    const result = copyPersonalQueries([common], queries);
    expect(result.widgets).toEqual([common]);
    expect(result.copiedNames).toEqual([]);
  });

  test('keeps a widget whose query is unavailable or an inline widget as it is', () => {
    const unavailable = widget({ saved_query_id: 'gone' });
    const inline = widget({ id: 'w2', saved_query_id: undefined, inline_query: toSqlInlineQuery('X', 'SELECT 3') });

    const failed = widget({ id: 'w3', saved_query_id: 'flaky' });

    const result = copyPersonalQueries([unavailable, inline, failed], {
      gone: { kind: WidgetQueryKind.Unavailable },
      flaky: { kind: WidgetQueryKind.Failed },
    });
    expect(result.widgets).toEqual([unavailable, inline, failed]);
    expect(result.copiedNames).toEqual([]);
  });

  test('copies a personal query into the widget, keeping its title', () => {
    const queries = { q1: compositeQuery(source()) };

    const result = copyPersonalQueries([widget({ title: 'My spend' })], queries);
    expect(result.widgets).toEqual([
      {
        id: 'w1',
        title: 'My spend',
        row_limit: 100,
        layout: { x: 0, y: 0, w: 6, h: 4 },
        inline_query: { name: 'Spend', sql: 'SELECT 1', result_view: QueryResultView.Chart },
      },
    ]);
    expect(result.copiedNames).toEqual(['Spend']);
  });

  test('titles an untitled copy with the query name', () => {
    const result = copyPersonalQueries([widget({ title: '' })], { q1: compositeQuery(source()) });
    expect(result.widgets[0].title).toBe('Spend');
  });

  test('resolves each copy under its new key and leaves the original entry in place', () => {
    const queries = { q1: compositeQuery(source()) };

    const result = copyPersonalQueries([widget()], queries);
    expect(result.queries['inline:w1']).toEqual({
      kind: WidgetQueryKind.CompositeSql,
      sql: 'SELECT 1',
      savedQuery: { name: 'Spend', sql: 'SELECT 1', result_view: QueryResultView.Chart },
    });
    expect(result.queries.q1).toBe(queries.q1);
  });

  test('names a personal query used by two widgets once', () => {
    const queries = {
      q1: compositeQuery(source()),
      q2: compositeQuery(source({ id: 'q2', name: 'Latency' })),
    };

    const result = copyPersonalQueries(
      [widget(), widget({ id: 'w2', saved_query_id: 'q2' }), widget({ id: 'w3' })],
      queries,
    );
    expect(result.copiedNames).toEqual(['Spend', 'Latency']);
    expect(result.widgets.every((item) => item.saved_query_id === undefined)).toBe(true);
  });
});
