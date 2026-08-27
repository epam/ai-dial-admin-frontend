import { describe, expect, test } from 'vitest';

import {
  buildExecutedMeta,
  classifyResultColumns,
  resolveGroupByColumns,
} from '@/src/components/Analytics/QueryBuilder/utils/executed-meta';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryExprType, QueryMode, StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { QueryRequestKind, QueryRunRequest } from '@/src/models/analytics/query-builder';

const query = (partial: Partial<StructuredQuery>): StructuredQuery => ({
  entity: 'dial_usage_log',
  mode: QueryMode.Aggregate,
  ...partial,
});

const field = (name: string, as?: string) => ({ expr: { type: QueryExprType.Field as const, name }, as });
const fn = (name: string, as?: string) => ({ expr: { type: QueryExprType.Fn as const, name, args: [] }, as });

describe('QueryBuilder :: executed-meta :: resolveGroupByColumns', () => {
  test('an aliased plain column resolves to the alias the rows are keyed by', () => {
    const translated = query({
      group_by: ['usage_request_summary.model'],
      select: [field('usage_request_summary.model', 'client'), fn('count', 'turns')],
    });

    expect(resolveGroupByColumns(translated, ['client', 'turns'])).toEqual(['client']);
  });

  test('an aliased expression is already named by its alias', () => {
    const translated = query({ group_by: ['d'], select: [fn('date_trunc', 'd'), fn('count', 'turns')] });

    expect(resolveGroupByColumns(translated, ['d', 'turns'])).toEqual(['d']);
  });

  test('an un-aliased plain column passes through', () => {
    const translated = query({ group_by: ['deployment'], select: [field('deployment'), fn('count', 'n')] });

    expect(resolveGroupByColumns(translated, ['deployment', 'n'])).toEqual(['deployment']);
  });

  test('an un-aliased expression keeps the name the service gave it', () => {
    const translated = query({ group_by: ['date_trunc'], select: [fn('date_trunc'), fn('count', 'n')] });

    expect(resolveGroupByColumns(translated, ['date_trunc', 'n'])).toEqual(['date_trunc']);
  });

  test('a positional GROUP BY arrives already resolved to its column', () => {
    const translated = query({ group_by: ['response_status'], select: [field('response_status'), fn('count', 'n')] });

    expect(resolveGroupByColumns(translated, ['response_status', 'n'])).toEqual(['response_status']);
  });

  test('resolves each entry of a multi-column grouping independently', () => {
    const translated = query({
      group_by: ['d', 'usage_request_summary.model'],
      select: [
        fn('date_trunc', 'd'),
        field('usage_request_summary.model', 'client'),
        fn('count', 'turns'),
        fn('sum', 'tokens'),
      ],
    });

    expect(resolveGroupByColumns(translated, ['d', 'client', 'turns', 'tokens'])).toEqual(['d', 'client']);
  });

  // A column the result actually carries wins over an alias of that same column elsewhere in select.
  test('a returned column keeps its own name even when it is also selected under an alias', () => {
    const translated = query({
      group_by: ['deployment'],
      select: [field('deployment'), field('deployment', 'dep'), fn('count', 'n')],
    });

    expect(resolveGroupByColumns(translated, ['deployment', 'dep', 'n'])).toEqual(['deployment']);
  });

  test('an alias on a function expression never re-maps a plain column of the same name', () => {
    const translated = query({ group_by: ['deployment'], select: [fn('deployment', 'renamed')] });

    expect(resolveGroupByColumns(translated, ['deployment'])).toEqual(['deployment']);
  });

  test('an entry matching no returned column is dropped rather than offered as an axis', () => {
    const translated = query({ group_by: ['ghost'], select: [fn('count', 'n')] });

    expect(resolveGroupByColumns(translated, ['n'])).toEqual([]);
  });

  test('a query with no grouping yields no dimensions', () => {
    expect(resolveGroupByColumns(query({ mode: QueryMode.Row }), ['a'])).toEqual([]);
  });
});

describe('QueryBuilder :: executed-meta :: classifyResultColumns', () => {
  test('offers every column as a dimension and only the numeric ones as aggregates', () => {
    const rows = [
      { d: '2026-08-20T00:00:00Z', client: 'web', turns: 12, cost: 1.5 },
      { d: '2026-08-21T00:00:00Z', client: 'api', turns: 7, cost: 0.25 },
    ];

    expect(classifyResultColumns(['d', 'client', 'turns', 'cost'], rows)).toEqual({
      dimensionColumns: ['d', 'client', 'turns', 'cost'],
      aggregateColumns: ['turns', 'cost'],
    });
  });

  test('a date-like column is not offered as a value', () => {
    expect(classifyResultColumns(['d', 'n'], [{ d: '2026-08-20T00:00:00Z', n: 1 }]).aggregateColumns).toEqual(['n']);
  });

  test('a column that is null anywhere is not offered as a value', () => {
    const rows = [
      { client: null, n: 1 },
      { client: 'web', n: 2 },
    ];

    expect(classifyResultColumns(['client', 'n'], rows).aggregateColumns).toEqual(['n']);
  });

  test('boolean and array columns are not offered as values', () => {
    const rows = [
      { success: true, tags: [], n: 1 },
      { success: false, tags: ['a'], n: 2 },
    ];

    expect(classifyResultColumns(['success', 'tags', 'n'], rows).aggregateColumns).toEqual(['n']);
  });

  test('numeric strings still count as values', () => {
    expect(classifyResultColumns(['n'], [{ n: '12' }, { n: '7.5' }]).aggregateColumns).toEqual(['n']);
  });

  test('an empty result yields no aggregate columns', () => {
    expect(classifyResultColumns(['a', 'b'], [])).toEqual({ dimensionColumns: ['a', 'b'], aggregateColumns: [] });
  });
});

describe('QueryBuilder :: executed-meta :: buildExecutedMeta', () => {
  const FIELDS: AnalyticsEntityField[] = [
    {
      name: 'deployment',
      type: AnalyticsFieldType.String,
      source: 'deployment',
      tag: 'lineage',
      display_name: 'Model',
    },
  ];
  const result = (rows: Array<Record<string, unknown>>): StructuredQueryResult => ({ rows });
  const sqlRequest: QueryRunRequest = { kind: QueryRequestKind.Sql, sql: 'SELECT 1' };

  test('a translated SQL run reports the translated mode and grouping', () => {
    const translated = query({ group_by: ['deployment'], select: [field('deployment'), fn('count', 'total')] });

    const meta = buildExecutedMeta(sqlRequest, result([{ deployment: 'gpt-4o', total: 3 }]), [], '', translated);

    expect(meta).toMatchObject({
      kind: QueryRequestKind.Sql,
      mode: QueryMode.Aggregate,
      dimensionColumns: ['deployment'],
      aggregateColumns: ['total'],
    });
  });

  // The run reports what executed; it is not relabelled to slip past a chart-availability check.
  test('an untranslatable SQL run stays row-mode and classifies from the rows', () => {
    const meta = buildExecutedMeta(sqlRequest, result([{ deployment: 'gpt-4o', total: 3 }]), FIELDS, '', null);

    expect(meta.mode).toBe(QueryMode.Row);
    expect(meta.kind).toBe(QueryRequestKind.Sql);
    expect(meta.dimensionColumns).toEqual(['deployment', 'total']);
    expect(meta.aggregateColumns).toEqual(['total']);
    expect(meta.columnLabels).toEqual({});
  });

  test('schema display names apply when the translated entity is the selected one', () => {
    const translated = query({ entity: 'dial_usage_log', group_by: ['deployment'], select: [field('deployment')] });

    const meta = buildExecutedMeta(
      sqlRequest,
      result([{ deployment: 'gpt-4o', total: 3 }]),
      FIELDS,
      'dial_usage_log',
      translated,
    );

    expect(meta.columnLabels).toEqual({ deployment: 'Model' });
  });

  test('schema display names are withheld when the SQL ran against another entity', () => {
    const translated = query({ entity: 'conversations', group_by: ['deployment'], select: [field('deployment')] });

    const meta = buildExecutedMeta(
      sqlRequest,
      result([{ deployment: 'gpt-4o', total: 3 }]),
      FIELDS,
      'dial_usage_log',
      translated,
    );

    expect(meta.columnLabels).toEqual({});
  });

  test('a structured aggregate run keeps its group-by as dimensions and labels its columns', () => {
    const request: QueryRunRequest = { kind: QueryRequestKind.Structured, query: query({ group_by: ['deployment'] }) };

    const meta = buildExecutedMeta(request, result([{ deployment: 'gpt-4o', total: 3 }]), FIELDS, 'dial_usage_log');

    expect(meta).toMatchObject({
      kind: QueryRequestKind.Structured,
      mode: QueryMode.Aggregate,
      dimensionColumns: ['deployment'],
      aggregateColumns: ['total'],
      columnLabels: { deployment: 'Model' },
    });
  });

  test('a structured row-mode run has no dimensions, so nothing can be charted', () => {
    const request: QueryRunRequest = { kind: QueryRequestKind.Structured, query: query({ mode: QueryMode.Row }) };

    const meta = buildExecutedMeta(request, result([{ deployment: 'gpt-4o' }]), FIELDS, 'dial_usage_log');

    expect(meta.dimensionColumns).toEqual([]);
    expect(meta.mode).toBe(QueryMode.Row);
  });
});
