import { describe, expect, test } from 'vitest';

import {
  deriveSavedQueryEditor,
  savedQueryEntityName,
  toBuilderRestore,
  toSavedQueryRequest,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import {
  createGroupByColumn,
  createInitialState,
  createPredicate,
  createSort,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryLogicalOperator, QueryMode, QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { ChartType, QueryBuilderState, QueryResultView } from '@/src/models/analytics/query-builder';
import {
  SavedQuery,
  SavedQueryCaptureInput,
  SavedQueryEditor,
  SavedQueryScope,
  SavedQueryTimeAction,
  SavedQueryTimeMode,
} from '@/src/models/analytics/saved-query';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'dial_usage_log' },
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'dial_usage_log' },
  { name: 'turn_count', type: AnalyticsFieldType.Integer, source: 'dial_usage_log' },
];

const RANGE = { startDate: new Date('2026-08-01T00:00:00.000Z'), endDate: new Date('2026-08-03T00:00:00.000Z') };

const baseState = (): QueryBuilderState => {
  const state = createInitialState(TEST_FUNCTIONS);
  state.entityName = 'dial_usage_log';
  state.fields = FIELDS;
  return state;
};

const captureInput = (overrides: Partial<SavedQueryCaptureInput> = {}): SavedQueryCaptureInput => ({
  state: baseState(),
  sqlText: null,
  name: 'Top chats',
  description: '',
  tag: '',
  scope: SavedQueryScope.Personal,
  timePeriod: '2d',
  isCustom: false,
  timeRange: RANGE,
  captureTime: true,
  resultView: QueryResultView.Table,
  chartConfig: { type: ChartType.Bar, xField: null, yField: null },
  ...overrides,
});

const savedFixture = (overrides: Partial<SavedQuery> = {}): SavedQuery => ({
  id: 'sq_1',
  name: 'Top chats',
  scope: SavedQueryScope.Personal,
  source: 'dial_usage_log',
  query: buildQuery(baseState(), null),
  result_view: QueryResultView.Table,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
  ...overrides,
});

describe('toSavedQueryRequest — the nine accepted fields', () => {
  test('carries only the accepted fields and no server-assigned member', () => {
    const request = toSavedQueryRequest(captureInput());

    expect(Object.keys(request).sort()).toEqual(['name', 'query', 'result_view', 'scope', 'time'].sort());
    ['id', 'owner_id', 'owner_email', 'source', 'generation', 'created_at', 'updated_at', 'params'].forEach((key) =>
      expect(request).not.toHaveProperty(key),
    );
  });

  test('absent optional members are omitted rather than sent as null', () => {
    const request = toSavedQueryRequest(captureInput({ description: '  ', tag: '  ' }));

    expect(request).not.toHaveProperty('description');
    expect(request).not.toHaveProperty('tag');
    expect(request).not.toHaveProperty('chart');
    expect(request).not.toHaveProperty('sql');
  });

  test('present optional members are trimmed and sent', () => {
    const request = toSavedQueryRequest(captureInput({ description: '  used weekly  ', tag: ' Adoption ' }));

    expect(request.description).toBe('used weekly');
    expect(request.tag).toBe('Adoption');
  });

  test('a blank name is trimmed to blank rather than padded', () => {
    expect(toSavedQueryRequest(captureInput({ name: '  Top chats  ' })).name).toBe('Top chats');
  });
});

describe('toSavedQueryRequest — the time bound is stripped from the body', () => {
  test('the saved query carries no ge/le pair on the timestamp column while a run does', () => {
    const state = baseState();
    const bound = { field: 'request_time', range: RANGE };

    const saved = toSavedQueryRequest(captureInput({ state }));
    const run = buildQuery(state, bound);

    // The run's filter carries the toolbar bound; the saved body has no filter at all.
    expect(run.filter).toBeDefined();
    expect(JSON.stringify(run.filter)).toContain('request_time');
    expect(saved.query?.filter).toBeUndefined();
  });

  test("the user's own filter survives while the time bound does not", () => {
    const state = baseState();
    const predicate = createPredicate();
    predicate.field = 'turn_count';
    predicate.op = QueryOperator.Ge;
    predicate.valueType = QueryValueType.Integer;
    predicate.value = '20';
    state.filter.children.push(predicate);

    const saved = toSavedQueryRequest(captureInput({ state }));

    expect(JSON.stringify(saved.query?.filter)).toContain('turn_count');
    expect(JSON.stringify(saved.query?.filter)).not.toContain('request_time');
  });
});

describe('toSavedQueryRequest — time intent', () => {
  test('a preset is stored as a relative intent', () => {
    const request = toSavedQueryRequest(captureInput({ isCustom: false, timePeriod: '2d' }));

    expect(request.time).toEqual({ mode: SavedQueryTimeMode.Relative, period: '2d' });
  });

  test('a custom range is stored as an absolute intent', () => {
    const request = toSavedQueryRequest(captureInput({ isCustom: true }));

    expect(request.time).toEqual({
      mode: SavedQueryTimeMode.Absolute,
      from: RANGE.startDate.toISOString(),
      to: RANGE.endDate.toISOString(),
    });
  });

  test('an inverted custom range is ordered so from is never after to', () => {
    const inverted = { startDate: RANGE.endDate, endDate: RANGE.startDate };
    const request = toSavedQueryRequest(captureInput({ isCustom: true, timeRange: inverted }));

    expect(request.time).toEqual({
      mode: SavedQueryTimeMode.Absolute,
      from: RANGE.startDate.toISOString(),
      to: RANGE.endDate.toISOString(),
    });
  });

  test('an unchecked time box omits time entirely', () => {
    expect(toSavedQueryRequest(captureInput({ captureTime: false }))).not.toHaveProperty('time');
  });

  test('a relative period is never resolved into instants', () => {
    const request = toSavedQueryRequest(captureInput({ isCustom: false, timePeriod: '30d' }));

    expect(JSON.stringify(request.time)).not.toContain('2026-08');
  });
});

describe('time preset ids satisfy the service token rule', () => {
  test('every configured period id matches ^[a-z0-9_]{1,32}$', () => {
    timePeriodOptionsConfig.forEach((option) => expect(option.value).toMatch(/^[a-z0-9_]{1,32}$/));
  });
});

describe('toSavedQueryRequest — chart', () => {
  test('chart is omitted for a table view', () => {
    const request = toSavedQueryRequest(captureInput({ resultView: QueryResultView.Table }));

    expect(request.result_view).toBe(QueryResultView.Table);
    expect(request).not.toHaveProperty('chart');
  });

  test('an unpicked axis is sent as an explicit null so it re-derives on open', () => {
    const request = toSavedQueryRequest(
      captureInput({
        resultView: QueryResultView.Chart,
        chartConfig: { type: ChartType.Line, xField: null, yField: null },
      }),
    );

    expect(request.chart).toEqual({ type: ChartType.Line, x_field: null, y_field: null });
  });

  test('a deliberate axis pick is stored verbatim', () => {
    const request = toSavedQueryRequest(
      captureInput({
        resultView: QueryResultView.Chart,
        chartConfig: { type: ChartType.Bar, xField: 'Request time (Date bin)', yField: null },
      }),
    );

    expect(request.chart).toEqual({ type: ChartType.Bar, x_field: 'Request time (Date bin)', y_field: null });
  });
});

describe('toSavedQueryRequest — exactly one body', () => {
  test('the SQL view sends sql and no query', () => {
    const request = toSavedQueryRequest(captureInput({ sqlText: 'SELECT 1' }));

    expect(request.sql).toBe('SELECT 1');
    expect(request).not.toHaveProperty('query');
  });

  test('a blank sql counts as absent and the structured body is sent instead', () => {
    const request = toSavedQueryRequest(captureInput({ sqlText: '   ' }));

    expect(request).not.toHaveProperty('sql');
    expect(request.query).toBeDefined();
  });
});

describe('deriveSavedQueryEditor', () => {
  test('sql set opens the SQL editor', () => {
    expect(deriveSavedQueryEditor({ sql: 'SELECT 1' })).toBe(SavedQueryEditor.Sql);
  });

  test('a blank sql is not a SQL body', () => {
    expect(deriveSavedQueryEditor({ sql: '   ', query: buildQuery(baseState(), null) })).toBe(SavedQueryEditor.Builder);
  });

  test('a representable structured body opens the Builder', () => {
    expect(deriveSavedQueryEditor({ query: buildQuery(baseState(), null) })).toBe(SavedQueryEditor.Builder);
  });

  test('a body the builder cannot draw opens JSON', () => {
    const deep = {
      entity: 'dial_usage_log',
      mode: QueryMode.Row,
      filter: {
        op: QueryLogicalOperator.And,
        args: [
          {
            op: QueryLogicalOperator.Or,
            args: [{ op: QueryLogicalOperator.And, args: [{ op: QueryLogicalOperator.And, args: [] }] }],
          },
        ],
      },
    };

    expect(deriveSavedQueryEditor({ query: deep })).toBe(SavedQueryEditor.Json);
  });

  test('a body with neither member falls back to JSON rather than throwing', () => {
    expect(deriveSavedQueryEditor({})).toBe(SavedQueryEditor.Json);
  });
});

describe('savedQueryEntityName', () => {
  test('prefers the structured body entity and falls back to the derived source', () => {
    expect(savedQueryEntityName(savedFixture())).toBe('dial_usage_log');
    expect(savedQueryEntityName(savedFixture({ query: undefined, sql: 'SELECT 1', source: 'conversations' }))).toBe(
      'conversations',
    );
  });
});

describe('toBuilderRestore', () => {
  const restore = (saved: SavedQuery, knownPeriods = ['2d', '30d']) =>
    toBuilderRestore({ saved, fields: FIELDS, functions: TEST_FUNCTIONS, knownPeriods });

  test('a relative period is applied as a period, not as instants', () => {
    const result = restore(savedFixture({ time: { mode: SavedQueryTimeMode.Relative, period: '30d' } }));

    expect(result.time).toEqual({ action: SavedQueryTimeAction.ApplyPeriod, period: '30d' });
  });

  test('an unknown period leaves the toolbar alone rather than failing the load', () => {
    const result = restore(savedFixture({ time: { mode: SavedQueryTimeMode.Relative, period: 'last_decade' } }));

    expect(result.time).toEqual({ action: SavedQueryTimeAction.Leave });
  });

  test('an absolute intent becomes a custom range', () => {
    const result = restore(
      savedFixture({
        time: {
          mode: SavedQueryTimeMode.Absolute,
          from: RANGE.startDate.toISOString(),
          to: RANGE.endDate.toISOString(),
        },
      }),
    );

    expect(result.time.action).toBe(SavedQueryTimeAction.ApplyRange);
    expect(result.time.range?.startDate.toISOString()).toBe(RANGE.startDate.toISOString());
  });

  test('an unparseable absolute intent leaves the toolbar alone', () => {
    const result = restore(
      savedFixture({ time: { mode: SavedQueryTimeMode.Absolute, from: 'yesterday', to: 'today' } }),
    );

    expect(result.time).toEqual({ action: SavedQueryTimeAction.Leave });
  });

  test('a stored time of none leaves the toolbar alone', () => {
    expect(restore(savedFixture()).time).toEqual({ action: SavedQueryTimeAction.Leave });
  });

  test('a chart is restored and a table view leaves the chart config alone', () => {
    const charted = restore(
      savedFixture({
        result_view: QueryResultView.Chart,
        chart: { type: ChartType.Pie, x_field: 'project_id', y_field: null },
      }),
    );

    expect(charted.resultView).toBe(QueryResultView.Chart);
    expect(charted.chartConfig).toEqual({ type: ChartType.Pie, xField: 'project_id', yField: null });
    expect(restore(savedFixture()).chartConfig).toBeUndefined();
  });

  test('a SQL body restores the editor, its text and the entity from the derived source', () => {
    const result = restore(savedFixture({ query: undefined, sql: 'SELECT 1', source: 'conversations' }));

    expect(result.editor).toBe(SavedQueryEditor.Sql);
    expect(result.sqlText).toBe('SELECT 1');
    expect(result.state.entityName).toBe('conversations');
  });

  test('the caller’s own fields are used, not anything from the saved query', () => {
    const result = restore(savedFixture());

    expect(result.state.fields).toBe(FIELDS);
  });
});

describe('round trip — builder state to request and back', () => {
  test('a row-mode query survives capture and restore', () => {
    const state = baseState();
    state.select = ['project_id', 'turn_count'];
    const sort = createSort();
    sort.field = 'turn_count';
    state.sort = [sort];
    state.page.limit = 20;

    const request = toSavedQueryRequest(captureInput({ state }));
    const restored = toBuilderRestore({
      saved: savedFixture({ query: request.query, time: request.time }),
      fields: FIELDS,
      functions: TEST_FUNCTIONS,
      knownPeriods: ['2d'],
    });

    expect(restored.state.select).toEqual(['project_id', 'turn_count']);
    expect(restored.state.sort.map((s) => s.field)).toEqual(['turn_count']);
    expect(restored.state.page.limit).toBe(20);
    // Capturing the restored state again yields the same body — which is what makes the dirty
    // comparison mean "the user changed something" rather than "the round trip is lossy".
    expect(toSavedQueryRequest(captureInput({ state: restored.state }))).toEqual(request);
  });

  test('an aggregate query survives capture and restore', () => {
    const state = baseState();
    state.mode = QueryMode.Aggregate;
    state.groupBy = [createGroupByColumn('project_id')];

    const request = toSavedQueryRequest(captureInput({ state }));
    const restored = toBuilderRestore({
      saved: savedFixture({ query: request.query, time: request.time }),
      fields: FIELDS,
      functions: TEST_FUNCTIONS,
      knownPeriods: ['2d'],
    });

    expect(restored.state.mode).toBe(QueryMode.Aggregate);
    expect(restored.state.groupBy.map((g) => g.field)).toEqual(['project_id']);
    expect(toSavedQueryRequest(captureInput({ state: restored.state }))).toEqual(request);
  });
});
