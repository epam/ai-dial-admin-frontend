import { describe, expect, test } from 'vitest';

import {
  deriveSavedQueryEditor,
  toMetadataReplaceRequest,
  savedQueryEntityName,
  toBuilderRestore,
  toSavedQueryRequest,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import { createGroup, createInitialState, createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { DEFAULT_PAGE_LIMIT } from '@/src/constants/analytics/query-builder';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  QueryExprType,
  QueryFilterNode,
  QueryGroup,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QueryPredicate,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { ChartType, QueryBuilderState, QueryResultView } from '@/src/models/analytics/query-builder';
import {
  SavedQuery,
  SavedQueryCaptureInput,
  SavedQueryEditor,
  SavedQueryScope,
  SavedQueryTimeAction,
  SavedQueryTimeMode,
} from '@/src/models/analytics/saved-query';

const TIMESTAMP_FIELD = 'request_time';

const FIELDS: AnalyticsEntityField[] = [
  { name: TIMESTAMP_FIELD, type: AnalyticsFieldType.Timestamp, source: TIMESTAMP_FIELD },
  { name: 'project', type: AnalyticsFieldType.String, source: 'project' },
];

const KNOWN_PERIODS = ['15m', '2d', '7d'];

const baseState = (): QueryBuilderState => ({
  ...createInitialState(TEST_FUNCTIONS),
  entityName: 'dial_usage_log',
  fields: FIELDS,
});

const stateWithFilter = (): QueryBuilderState => {
  const state = baseState();
  const predicate = createPredicate(AnalyticsFieldType.String);
  predicate.field = 'project';
  predicate.op = QueryOperator.Eq;
  predicate.value = 'alpha';
  state.filter = { ...createGroup(), children: [predicate] };
  return state;
};

const baseCapture = (overrides?: Partial<SavedQueryCaptureInput>): SavedQueryCaptureInput => ({
  name: 'Top chats',
  scope: SavedQueryScope.Personal,
  state: baseState(),
  resultView: QueryResultView.Table,
  ...overrides,
});

// A filter nested deeper than the visual builder can display — root + one group is its limit.
const DEEPLY_NESTED_BODY: StructuredQuery = {
  entity: 'dial_usage_log',
  mode: QueryMode.Row,
  filter: {
    op: QueryLogicalOperator.And,
    args: [
      {
        op: QueryLogicalOperator.Or,
        args: [
          {
            op: QueryLogicalOperator.And,
            args: [
              {
                op: QueryOperator.Eq,
                args: [
                  { type: QueryExprType.Field, name: 'project' },
                  { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'a' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

const RANGE = {
  startDate: new Date('2026-08-01T00:00:00.000Z'),
  endDate: new Date('2026-08-08T00:00:00.000Z'),
};

const LOGICAL_OPERATORS: string[] = Object.values(QueryLogicalOperator);

const operatorsOnField = (node: QueryFilterNode | undefined, field: string): QueryOperator[] => {
  if (!node) return [];

  if (LOGICAL_OPERATORS.includes((node as QueryGroup).op)) {
    const args = (node as QueryGroup).args ?? [];
    return args.flatMap((child) => operatorsOnField(child, field));
  }

  const predicate = node as QueryPredicate;
  if (!Array.isArray(predicate.args)) return [];
  const namesField = predicate.args.some(
    (arg) => arg?.type === QueryExprType.Field && (arg as { name?: string }).name === field,
  );
  return namesField ? [predicate.op] : [];
};

describe('toSavedQueryRequest', () => {
  test('carries only the nine accepted members and no server-assigned one', () => {
    const request = toSavedQueryRequest(
      baseCapture({
        description: 'For Monday',
        tag: 'Adoption',
        time: { period: '2d', isCustom: false, range: RANGE },
      }),
    );

    expect(Object.keys(request).sort()).toEqual(
      ['description', 'name', 'query', 'result_view', 'scope', 'tag', 'time'].sort(),
    );
    ['id', 'owner_id', 'owner_email', 'source', 'generation', 'created_at', 'updated_at', 'params'].forEach(
      (member) => {
        expect(member in request).toBeFalsy();
      },
    );
  });

  test('trims the name and omits a blank description and tag', () => {
    const request = toSavedQueryRequest(baseCapture({ name: '  Top chats  ', description: '   ', tag: '' }));

    expect(request.name).toBe('Top chats');
    expect('description' in request).toBeFalsy();
    expect('tag' in request).toBeFalsy();
  });

  test('sends a structured body when the query was authored in the builder', () => {
    const request = toSavedQueryRequest(baseCapture());

    expect(request.query?.entity).toBe('dial_usage_log');
    expect(request.query?.mode).toBe(QueryMode.Row);
    expect('sql' in request).toBeFalsy();
  });

  test('sends the builder paging so the stored query is bounded as authored', () => {
    const request = toSavedQueryRequest(baseCapture());

    expect(request.query?.page).toEqual({
      type: QueryPageType.Offset,
      offset: 0,
      limit: DEFAULT_PAGE_LIMIT,
      include_total: false,
    });
  });

  test('sends a SQL body when the SQL buffer holds the authored query', () => {
    const request = toSavedQueryRequest(baseCapture({ sqlText: 'SELECT count(*) FROM dial_usage_log' }));

    expect(request.sql).toBe('SELECT count(*) FROM dial_usage_log');
    expect('query' in request).toBeFalsy();
  });

  test('treats a blank SQL buffer alongside a structured body as one body', () => {
    const request = toSavedQueryRequest(baseCapture({ sqlText: '   ' }));

    expect('sql' in request).toBeFalsy();
    expect(request.query).toBeTruthy();
  });

  test('stores a preset period as an unresolved relative token', () => {
    const request = toSavedQueryRequest(baseCapture({ time: { period: '7d', isCustom: false, range: RANGE } }));

    expect(request.time).toEqual({ mode: SavedQueryTimeMode.Relative, period: '7d' });
  });

  test('stores a custom range as an absolute pair', () => {
    const request = toSavedQueryRequest(baseCapture({ time: { period: '7d', isCustom: true, range: RANGE } }));

    expect(request.time).toEqual({
      mode: SavedQueryTimeMode.Absolute,
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-08T00:00:00.000Z',
    });
  });

  test('orders an inverted absolute range rather than sending it inverted', () => {
    const inverted = { startDate: RANGE.endDate, endDate: RANGE.startDate };
    const request = toSavedQueryRequest(baseCapture({ time: { period: '7d', isCustom: true, range: inverted } }));

    expect(request.time).toEqual({
      mode: SavedQueryTimeMode.Absolute,
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-08T00:00:00.000Z',
    });
  });

  test('omits time entirely when no range was captured', () => {
    const request = toSavedQueryRequest(baseCapture());

    expect('time' in request).toBeFalsy();
  });

  test('emits a chart configuration only for a query stored as a chart', () => {
    const chartConfig = { type: ChartType.Bar, xField: 'project', yField: 'count' };

    const asChart = toSavedQueryRequest(baseCapture({ resultView: QueryResultView.Chart, chartConfig }));
    const asTable = toSavedQueryRequest(baseCapture({ resultView: QueryResultView.Table, chartConfig }));

    expect(asChart.chart).toEqual({ type: ChartType.Bar, x_field: 'project', y_field: 'count' });
    expect('chart' in asTable).toBeFalsy();
  });

  test('passes an unpicked chart axis through as null', () => {
    const request = toSavedQueryRequest(
      baseCapture({
        resultView: QueryResultView.Chart,
        chartConfig: { type: ChartType.Pie, xField: null, yField: null },
      }),
    );

    expect(request.chart).toEqual({ type: ChartType.Pie, x_field: null, y_field: null });
  });

  test('persists a diverged JSON buffer as the body, since the builder state does not carry its edits', () => {
    const request = toSavedQueryRequest(baseCapture({ divergedJsonText: JSON.stringify(DEEPLY_NESTED_BODY) }));

    expect(request.query).toEqual(DEEPLY_NESTED_BODY);
  });

  test('prefers a SQL buffer over a diverged JSON buffer', () => {
    const request = toSavedQueryRequest(
      baseCapture({ sqlText: 'SELECT 1', divergedJsonText: JSON.stringify(DEEPLY_NESTED_BODY) }),
    );

    expect(request.sql).toBe('SELECT 1');
    expect('query' in request).toBeFalsy();
  });

  test('falls back to the builder state when a diverged buffer does not parse', () => {
    const request = toSavedQueryRequest(baseCapture({ divergedJsonText: '{ not json' }));

    expect(request.query?.entity).toBe('dial_usage_log');
  });

  test('ignores a blank diverged buffer', () => {
    const request = toSavedQueryRequest(baseCapture({ divergedJsonText: '   ' }));

    expect(request.query?.entity).toBe('dial_usage_log');
  });

  test('serializes the same content to the same JSON string, so a dirty check can compare them', () => {
    const first = toSavedQueryRequest(baseCapture({ description: 'd', tag: 't' }));
    const second = toSavedQueryRequest(baseCapture({ description: 'd', tag: 't' }));

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});

describe('toSavedQueryRequest — the persisted body carries no time bound', () => {
  test('adds no ge/le predicate on the timestamp field even with a custom range selected', () => {
    const request = toSavedQueryRequest(
      baseCapture({ state: stateWithFilter(), time: { period: '7d', isCustom: true, range: RANGE } }),
    );

    const operators = operatorsOnField(request.query?.filter, TIMESTAMP_FIELD);
    expect(operators).toEqual([]);
    expect(request.time).toBeTruthy();
  });

  test('adds no ge/le predicate on the timestamp field with a preset period selected', () => {
    const request = toSavedQueryRequest(baseCapture({ time: { period: '2d', isCustom: false, range: RANGE } }));

    expect(operatorsOnField(request.query?.filter, TIMESTAMP_FIELD)).toEqual([]);
  });

  test('preserves the authored filter while excluding the time bound', () => {
    const request = toSavedQueryRequest(
      baseCapture({ state: stateWithFilter(), time: { period: '2d', isCustom: false, range: RANGE } }),
    );

    expect(operatorsOnField(request.query?.filter, 'project')).toEqual([QueryOperator.Eq]);
  });
});

describe('deriveSavedQueryEditor', () => {
  const representable: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Row };

  test('reports SQL for a query carrying a SQL body', () => {
    expect(deriveSavedQueryEditor({ sql: 'SELECT 1' }, null)).toBe(SavedQueryEditor.Sql);
  });

  test('reports Builder for a representable structured body', () => {
    expect(deriveSavedQueryEditor({ query: representable }, null)).toBe(SavedQueryEditor.Builder);
  });

  test('reports JSON for a structured body the builder cannot represent', () => {
    expect(deriveSavedQueryEditor({ query: DEEPLY_NESTED_BODY }, null)).toBe(SavedQueryEditor.Json);
  });

  test('ignores a blank SQL body', () => {
    expect(deriveSavedQueryEditor({ sql: '   ', query: representable }, null)).toBe(SavedQueryEditor.Builder);
  });
});

describe('savedQueryEntityName', () => {
  test('prefers the body entity', () => {
    expect(savedQueryEntityName({ query: { entity: 'a', mode: QueryMode.Row }, source: 'b' })).toBe('a');
  });

  test('falls back to the derived source for a SQL body', () => {
    expect(savedQueryEntityName({ source: 'b' })).toBe('b');
  });

  test('returns an empty name when neither is present', () => {
    expect(savedQueryEntityName({})).toBe('');
  });
});

describe('toBuilderRestore', () => {
  const saved = (overrides?: Partial<SavedQuery>): SavedQuery => ({
    id: 'sq_1',
    name: 'Top chats',
    scope: SavedQueryScope.Personal,
    generation: 1,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-02T00:00:00Z',
    ...overrides,
  });

  const restore = (overrides?: Partial<SavedQuery>) =>
    toBuilderRestore({
      saved: saved(overrides),
      fields: FIELDS,
      functions: TEST_FUNCTIONS,
      knownPeriods: KNOWN_PERIODS,
    });

  test('opens a representable structured body in the builder, reflecting the query', () => {
    const result = restore({ query: { entity: 'dial_usage_log', mode: QueryMode.Aggregate } });

    expect(result.editor).toBe(SavedQueryEditor.Builder);
    expect(result.state.entityName).toBe('dial_usage_log');
    expect(result.state.mode).toBe(QueryMode.Aggregate);
    expect(result.state.fields).toEqual(FIELDS);
  });

  test('leaves builder state untouched for a body the builder cannot represent', () => {
    const result = restore({ query: DEEPLY_NESTED_BODY });

    expect(result.editor).toBe(SavedQueryEditor.Json);
    expect(result.state.filter.children).toEqual([]);
    expect(result.jsonText).toContain('dial_usage_log');
  });

  test('opens a SQL body in the SQL view with the stored statement intact', () => {
    const result = restore({ sql: 'SELECT count(*) FROM dial_usage_log', source: 'dial_usage_log' });

    expect(result.editor).toBe(SavedQueryEditor.Sql);
    expect(result.sqlText).toBe('SELECT count(*) FROM dial_usage_log');
    expect(result.state.entityName).toBe('dial_usage_log');
  });

  test('pretty-prints the JSON buffer from a structured body', () => {
    const query: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Row };
    const result = restore({ query });

    expect(result.jsonText).toBe(JSON.stringify(query, null, 2));
  });

  test('defaults the result view to table when the stored query has none', () => {
    expect(restore({ query: { entity: 'a', mode: QueryMode.Row } }).resultView).toBe(QueryResultView.Table);
  });

  test('restores a stored chart configuration', () => {
    const result = restore({
      query: { entity: 'a', mode: QueryMode.Row },
      result_view: QueryResultView.Chart,
      chart: { type: ChartType.Line, x_field: 'project', y_field: 'count' },
    });

    expect(result.resultView).toBe(QueryResultView.Chart);
    expect(result.chartConfig).toEqual({ type: ChartType.Line, xField: 'project', yField: 'count' });
  });

  test('leaves the chart configuration absent when the stored query has none', () => {
    expect(restore({ query: { entity: 'a', mode: QueryMode.Row } }).chartConfig).toBeUndefined();
  });

  test('applies a recognised relative period', () => {
    const result = restore({ time: { mode: SavedQueryTimeMode.Relative, period: '7d' } });

    expect(result.time).toEqual({ action: SavedQueryTimeAction.ApplyPeriod, period: '7d' });
  });

  test('leaves the toolbar alone for an unrecognised relative period, and still loads', () => {
    const result = restore({
      query: { entity: 'dial_usage_log', mode: QueryMode.Row },
      time: { mode: SavedQueryTimeMode.Relative, period: 'last_fortnight' },
    });

    expect(result.time).toEqual({ action: SavedQueryTimeAction.Leave });
    expect(result.state.entityName).toBe('dial_usage_log');
  });

  test('applies an absolute range', () => {
    const result = restore({
      time: {
        mode: SavedQueryTimeMode.Absolute,
        from: '2026-08-01T00:00:00.000Z',
        to: '2026-08-08T00:00:00.000Z',
      },
    });

    expect(result.time.action).toBe(SavedQueryTimeAction.ApplyRange);
    expect(result.time.range?.startDate.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(result.time.range?.endDate.toISOString()).toBe('2026-08-08T00:00:00.000Z');
  });

  test('orders an inverted stored absolute range', () => {
    const result = restore({
      time: {
        mode: SavedQueryTimeMode.Absolute,
        from: '2026-08-08T00:00:00.000Z',
        to: '2026-08-01T00:00:00.000Z',
      },
    });

    expect(result.time.range?.startDate.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  test('leaves the toolbar alone for an unparseable instant', () => {
    const result = restore({
      time: { mode: SavedQueryTimeMode.Absolute, from: 'not-a-date', to: '2026-08-08T00:00:00.000Z' },
    });

    expect(result.time).toEqual({ action: SavedQueryTimeAction.Leave });
  });

  test('leaves the toolbar alone when no time intent was stored', () => {
    expect(restore().time).toEqual({ action: SavedQueryTimeAction.Leave });
  });
});

describe('toSavedQueryRequest ⇄ toBuilderRestore round trip', () => {
  test('a captured relative period comes back as the same period', () => {
    const request = toSavedQueryRequest(baseCapture({ time: { period: '2d', isCustom: false, range: RANGE } }));

    const result = toBuilderRestore({
      saved: {
        id: 'sq_1',
        name: request.name,
        scope: request.scope,
        query: request.query,
        time: request.time,
        generation: 1,
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-02T00:00:00Z',
      },
      fields: FIELDS,
      functions: TEST_FUNCTIONS,
      knownPeriods: KNOWN_PERIODS,
    });

    expect(result.time).toEqual({ action: SavedQueryTimeAction.ApplyPeriod, period: '2d' });
  });
});

describe('toMetadataReplaceRequest', () => {
  const stored: SavedQuery = {
    id: 'sq_1',
    name: 'Top chats',
    description: 'For Monday',
    tag: 'Adoption',
    scope: SavedQueryScope.Personal,
    source: 'dial_usage_log',
    query: { entity: 'dial_usage_log', mode: QueryMode.Aggregate },
    time: { mode: SavedQueryTimeMode.Relative, period: '7d' },
    result_view: QueryResultView.Chart,
    chart: { type: ChartType.Bar, x_field: 'project', y_field: 'count' },
    generation: 2,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-02T00:00:00Z',
  };

  const meta = { name: 'Renamed', description: 'd', tag: 't', scope: SavedQueryScope.Common };

  test('replaces the metadata and carries the body across untouched', () => {
    const request = toMetadataReplaceRequest(stored, meta);

    expect(request.name).toBe('Renamed');
    expect(request.scope).toBe(SavedQueryScope.Common);
    expect(request.query).toEqual(stored.query);
    expect(request.time).toEqual(stored.time);
    expect(request.chart).toEqual(stored.chart);
  });

  test('carries a SQL body instead of a structured one', () => {
    const request = toMetadataReplaceRequest({ ...stored, query: void 0, sql: 'SELECT 1' }, meta);

    expect(request.sql).toBe('SELECT 1');
    expect('query' in request).toBeFalsy();
  });

  test('sends no server-assigned member', () => {
    const request = toMetadataReplaceRequest(stored, meta);

    ['id', 'owner_id', 'owner_email', 'source', 'generation', 'created_at', 'updated_at'].forEach((member) => {
      expect(member in request).toBeFalsy();
    });
  });

  test('trims and omits blank metadata like the capture path does', () => {
    const request = toMetadataReplaceRequest(stored, { ...meta, name: '  Renamed  ', description: '  ', tag: '' });

    expect(request.name).toBe('Renamed');
    expect('description' in request).toBeFalsy();
    expect('tag' in request).toBeFalsy();
  });

  test('serializes identically to the capture path for the same content', () => {
    // Both go through one assembly, so a metadata replace cannot read as a body change to the dirty check.
    const viaCapture = toSavedQueryRequest({
      name: 'Renamed',
      description: 'd',
      tag: 't',
      scope: SavedQueryScope.Common,
      state: baseState(),
      resultView: QueryResultView.Table,
    });
    const viaMetadata = toMetadataReplaceRequest(
      { ...stored, query: viaCapture.query, time: void 0, result_view: QueryResultView.Table, chart: void 0 },
      meta,
    );

    expect(Object.keys(viaMetadata)).toEqual(Object.keys(viaCapture));
  });
});
