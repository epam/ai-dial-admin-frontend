import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryRequest, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { CreateRuleDto, RuleEnabledFilter, TriggerKind } from '@/src/models/analytics/rule';
import { AnalyticsTableType, CreateTableDto } from '@/src/models/analytics/table';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { AnalyticsDataApi } from '../analytics-data-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

describe('Server :: AnalyticsDataApi', () => {
  const instance = new AnalyticsDataApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getEntities issues GET /v1/queries/entities and returns the parsed list', async () => {
    const entities = [{ name: 'conversation' }, { name: 'message', complex: true }];
    fetch.mockResponseOnce(JSON.stringify(entities), JSON_HEADERS);

    const res = await instance.getEntities(TOKEN_MOCK);

    expect(res).toEqual(entities);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/queries/entities'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getEntitySchema issues GET with a URL-encoded entity name', async () => {
    const schema = { fields: [{ name: 'id', type: AnalyticsFieldType.Uuid, source: 'id' }] };
    fetch.mockResponseOnce(JSON.stringify(schema), JSON_HEADERS);

    const res = await instance.getEntitySchema('my entity', TOKEN_MOCK);

    expect(res).toEqual(schema);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/queries/entities/schema/my%20entity'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getFunctions issues GET /v1/queries/functions and returns the parsed catalog', async () => {
    const functions = [
      {
        name: 'count',
        group: 'aggregate',
        signature: 'count([value])',
        returns: 'long',
        distinct_supported: true,
        description: 'row count',
        args: [],
      },
    ];
    fetch.mockResponseOnce(JSON.stringify(functions), JSON_HEADERS);

    const res = await instance.getFunctions(TOKEN_MOCK);

    expect(res).toEqual(functions);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/queries/functions'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('executeAction POSTs the structured-query envelope to /v1/queries/execute', async () => {
    const query: StructuredQuery = { entity: 'conversation', mode: QueryMode.Row };
    fetch.mockResponseOnce(JSON.stringify({ columns: ['id'], rows: [{ id: '1' }] }));

    const res = await instance.executeAction(query, TOKEN_MOCK);

    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/queries/execute'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(query) }),
    );
  });

  test('executeSqlAction POSTs { sql } to /v1/queries/execute-sql', async () => {
    const sql = 'SELECT id FROM conversation LIMIT 10';
    fetch.mockResponseOnce(JSON.stringify({ columns: ['id'], rows: [{ id: '1' }] }));

    const res = await instance.executeSqlAction(sql, TOKEN_MOCK);

    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/queries/execute-sql'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ sql }) }),
    );
  });

  test('translateAction POSTs the structured query to /v1/queries/translate', async () => {
    const query: StructuredQuery = { entity: 'conversation', mode: QueryMode.Row };
    fetch.mockResponseOnce(JSON.stringify({ sql: 'SELECT *\nFROM conversation' }));

    const res = await instance.translateAction(query, TOKEN_MOCK);

    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/queries/translate'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(query) }),
    );
  });

  test('translateSqlAction POSTs { sql } to /v1/queries/translate-sql', async () => {
    const sql = 'SELECT id FROM conversation';
    fetch.mockResponseOnce(JSON.stringify({ query: { entity: 'conversation', mode: 'row' } }));

    const res = await instance.translateSqlAction(sql, TOKEN_MOCK);

    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/queries/translate-sql'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ sql }) }),
    );
  });

  test('translateAction surfaces a backend 400 as a failed response', async () => {
    fetch.mockResponseOnce(JSON.stringify({ message: 'include_total not expressible' }), { status: 400 });

    const res = await instance.translateAction({ entity: 'conversation', mode: QueryMode.Row }, TOKEN_MOCK);

    expect(res.success).toBe(false);
  });

  test('getEntities returns null on a failed response', async () => {
    fetch.mockResponseOnce('nope', { status: 500 });

    const res = await instance.getEntities(TOKEN_MOCK);

    expect(res).toBeNull();
  });

  test('getTables issues GET /v1/tables and unwraps the { tables } envelope', async () => {
    const tables = [{ name: 'dial_usage_log', type: AnalyticsTableType.Source }];
    fetch.mockResponseOnce(JSON.stringify({ tables }), { headers: { 'content-type': 'application/json' } });

    const res = await instance.getTables(TOKEN_MOCK);

    expect(res).toEqual(tables);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getTable URL-encodes the table name', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'a/b', type: AnalyticsTableType.Source }));

    await instance.getTable('a/b', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/a%2Fb'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('createTable POSTs the identity-only create payload to /v1/tables', async () => {
    const dto: CreateTableDto = { name: 'events', type: AnalyticsTableType.Source, description: 'Raw events' };
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const res = await instance.createTable(dto, TOKEN_MOCK);

    expect(res).toEqual({ response: JSON.stringify({ success: true }), success: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(dto) }),
    );
  });

  test('updateTable PUTs the metadata payload to /v1/tables/{name}', async () => {
    const dto = { description: 'Updated', tag_order: ['pii'] };
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.updateTable('events', dto, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/events'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(dto) }),
    );
  });

  test('deleteTable issues DELETE on the encoded table URL', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.deleteTable('events', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/events'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('defineTableSchema POSTs the complete schema to /v1/tables/{name}/schema (defines + materializes)', async () => {
    const schema = {
      columns: [{ source_name: 'ts', name: 'timestamp', type: AnalyticsFieldType.Timestamp }],
      ordering_key: ['ts'],
    };
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.defineTableSchema('events', schema, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/events/schema'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(schema) }),
    );
  });

  test('getTable returns the scan-metadata pair as sent by the service', async () => {
    const table = {
      name: 'events',
      type: AnalyticsTableType.Source,
      ordering_key: ['event_id'],
      identity_column: 'event_id',
      version_column: '_ingested_at',
    };
    fetch.mockResponseOnce(JSON.stringify(table), { headers: { 'content-type': 'application/json' } });

    expect(await instance.getTable('events', TOKEN_MOCK)).toEqual(table);
  });

  test('defineTableSchema sends the scan-metadata pair only when declared', async () => {
    const withPair = {
      columns: [{ source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp }],
      ordering_key: ['seen_at'],
      identity_column: 'order_id',
      version_column: 'seen_at',
    };
    fetch.mockResponseOnce(JSON.stringify({ success: true }));
    await instance.defineTableSchema('events', withPair, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/events/schema'),
      expect.objectContaining({ body: JSON.stringify(withPair) }),
    );

    // An omitted member leaves any stored value untouched, so the absent keys must not be sent as null.
    const withoutPair = { columns: withPair.columns, ordering_key: withPair.ordering_key };
    fetch.mockResponseOnce(JSON.stringify({ success: true }));
    await instance.defineTableSchema('events', withoutPair, TOKEN_MOCK);
    const body = (fetch as unknown as { mock: { calls: [string, { body: string }][] } }).mock.calls.at(-1)![1].body;
    expect(JSON.parse(body)).not.toHaveProperty('identity_column');
    expect(JSON.parse(body)).not.toHaveProperty('version_column');
  });

  test('updateTableSchema PATCHes /v1/tables/{name}/schema with the patch body', async () => {
    const patch = { drop: ['old_col'] };
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.updateTableSchema('events', patch, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/events/schema'),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(patch) }),
    );
  });

  test('addRows POSTs to /v1/tables/{name}/rows', async () => {
    const dto = { rows: [{ id: '1' }] };
    fetch.mockResponseOnce(JSON.stringify({ inserted: 1 }));

    await instance.addRows('events', dto, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/events/rows'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(dto) }),
    );
  });

  test('getTableAccess issues GET /v1/tables/{name}/access and returns the parsed lists', async () => {
    const access = { write: ['analytics-writer'], modify: [] };
    fetch.mockResponseOnce(JSON.stringify(access), JSON_HEADERS);

    const res = await instance.getTableAccess('events', TOKEN_MOCK);

    expect(res).toEqual(access);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/events/access'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('replaceTableAccess PUTs the lists to /v1/tables/{name}/access', async () => {
    const access = { write: ['w'], modify: ['m'] };
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.replaceTableAccess('events', access, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables/events/access'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(access) }),
    );
  });
});

describe('Server :: AnalyticsDataApi — saved queries', () => {
  const instance = new AnalyticsDataApi({ host: TEST_URL });

  const savedQuery: SavedQuery = {
    id: 'sq_1',
    name: 'Top chats',
    scope: SavedQueryScope.Personal,
    result_view: QueryResultView.Table,
    generation: 1,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-02T00:00:00Z',
  };

  const request: SavedQueryRequest = {
    name: 'Top chats',
    scope: SavedQueryScope.Personal,
    result_view: QueryResultView.Table,
    query: { entity: 'dial_usage_log', mode: QueryMode.Row },
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('listSavedQueries issues GET with the scope as a query parameter', async () => {
    fetch.mockResponseOnce(JSON.stringify({ saved_queries: [savedQuery] }), JSON_HEADERS);

    await instance.listSavedQueries(SavedQueryScope.Common, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/saved-queries?scope=common'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('listSavedQueries unwraps the { saved_queries } envelope to a bare array', async () => {
    fetch.mockResponseOnce(JSON.stringify({ saved_queries: [savedQuery] }), JSON_HEADERS);

    const res = await instance.listSavedQueries(SavedQueryScope.Personal, TOKEN_MOCK);

    expect(res).toEqual([savedQuery]);
  });

  test('listSavedQueries returns null when the envelope is absent', async () => {
    fetch.mockResponseOnce(JSON.stringify({}), JSON_HEADERS);

    const res = await instance.listSavedQueries(SavedQueryScope.Personal, TOKEN_MOCK);

    expect(res).toBeNull();
  });

  test('getSavedQuery issues GET on the encoded saved-query URL and returns the parsed query', async () => {
    fetch.mockResponseOnce(JSON.stringify(savedQuery), JSON_HEADERS);

    const res = await instance.getSavedQuery('sq /1', TOKEN_MOCK);

    expect(res).toEqual(savedQuery);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/saved-queries/sq%20%2F1'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('createSavedQuery POSTs the payload to /v1/saved-queries', async () => {
    fetch.mockResponseOnce(JSON.stringify(savedQuery), JSON_HEADERS);

    const res = await instance.createSavedQuery(request, TOKEN_MOCK);

    expect(res.success).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/saved-queries'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }),
    );
  });

  test('createSavedQuery surfaces the machine error code on the failure envelope', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 422, error: 'validation_error', message: 'blank name' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    });

    const res = await instance.createSavedQuery(request, TOKEN_MOCK);

    expect(res.success).toBeFalsy();
    expect(res.errorHeader).toBe('validation_error');
    expect(res.errorMessage).toBe('blank name');
  });

  test('updateSavedQuery PUTs the payload to the encoded saved-query URL', async () => {
    fetch.mockResponseOnce(JSON.stringify(savedQuery), JSON_HEADERS);

    await instance.updateSavedQuery('sq_1', request, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/saved-queries/sq_1'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(request) }),
    );
  });

  test('updateSavedQuery sends no If-Match header — the service takes no precondition', async () => {
    fetch.mockResponseOnce(JSON.stringify(savedQuery), JSON_HEADERS);

    await instance.updateSavedQuery('sq_1', request, TOKEN_MOCK);

    const sentHeaders = (fetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(Object.keys(sentHeaders).some((key) => key.toLowerCase() === 'if-match')).toBeFalsy();
  });

  test('deleteSavedQuery issues DELETE on the encoded saved-query URL', async () => {
    fetch.mockResponseOnce('');

    await instance.deleteSavedQuery('sq_1', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/saved-queries/sq_1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
  describe('rules', () => {
    const rule = {
      id: 'r_1',
      name: 'turn-feedback-live',
      evaluator_name: 'feedback-rollup',
      evaluator_version: 2,
      evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
      target_enrichment: 'turn_feedback',
      source: 'response_ratings',
      grain_key: 'response_id',
      trigger_kind: TriggerKind.OnIngest,
      enabled: true,
      generation: 5,
      created_at: '2026-08-20T14:39:05Z',
      updated_at: '2026-08-21T09:37:29Z',
    };

    const createDto: CreateRuleDto = {
      name: 'new-rule',
      evaluator_name: 'feedback-rollup',
      target_enrichment: 'turn_feedback',
      trigger_kind: TriggerKind.OnIngest,
      enabled: false,
    };

    test('getRules unwraps the {items} envelope, not {tables}', async () => {
      fetch.mockResponseOnce(JSON.stringify({ items: [rule] }), JSON_HEADERS);

      const res = await instance.getRules(undefined, TOKEN_MOCK);

      expect(res).toEqual([rule]);
    });

    test('getRules returns null when neither shape is present', async () => {
      fetch.mockResponseOnce(JSON.stringify({}), JSON_HEADERS);

      expect(await instance.getRules(undefined, TOKEN_MOCK)).toBeNull();
    });

    // Deployed builds disagree: some answer a bare array, some the wrapper.
    test('getRules accepts a bare array as well as the wrapper', async () => {
      fetch.mockResponseOnce(JSON.stringify([rule]), JSON_HEADERS);

      expect(await instance.getRules(undefined, TOKEN_MOCK)).toEqual([rule]);
    });

    test('getRules reads an empty bare array as no rules rather than a failure', async () => {
      fetch.mockResponseOnce(JSON.stringify([]), JSON_HEADERS);

      expect(await instance.getRules(undefined, TOKEN_MOCK)).toEqual([]);
    });

    test('getRules omits enabled entirely when no preference is expressed', async () => {
      fetch.mockResponseOnce(JSON.stringify({ items: [] }), JSON_HEADERS);

      await instance.getRules({ enabled: RuleEnabledFilter.All }, TOKEN_MOCK);

      const url = fetch.mock.calls[0][0] as string;
      expect(url).not.toContain('enabled');
      expect(url).not.toContain('?');
    });

    test('getRules sends enabled=true for the enabled-only filter', async () => {
      fetch.mockResponseOnce(JSON.stringify({ items: [] }), JSON_HEADERS);

      await instance.getRules({ enabled: RuleEnabledFilter.Enabled }, TOKEN_MOCK);

      expect(fetch.mock.calls[0][0] as string).toContain('enabled=true');
    });

    test('getRules sends enabled=false for the disabled-only filter', async () => {
      fetch.mockResponseOnce(JSON.stringify({ items: [] }), JSON_HEADERS);

      await instance.getRules({ enabled: RuleEnabledFilter.Disabled }, TOKEN_MOCK);

      expect(fetch.mock.calls[0][0] as string).toContain('enabled=false');
    });

    test('getRules combines both filters rather than one replacing the other', async () => {
      fetch.mockResponseOnce(JSON.stringify({ items: [] }), JSON_HEADERS);

      await instance.getRules({ enabled: RuleEnabledFilter.Enabled, updatedSince: '2026-08-01T00:00:00Z' }, TOKEN_MOCK);

      const url = fetch.mock.calls[0][0] as string;
      expect(url).toContain('enabled=true');
      expect(url).toContain('updated_since=2026-08-01T00%3A00%3A00Z');
    });

    test('getRules sends updated_since alone when enabled is unfiltered', async () => {
      fetch.mockResponseOnce(JSON.stringify({ items: [] }), JSON_HEADERS);

      await instance.getRules({ enabled: RuleEnabledFilter.All, updatedSince: '2026-08-01T00:00:00Z' }, TOKEN_MOCK);

      const url = fetch.mock.calls[0][0] as string;
      expect(url).toContain('updated_since=');
      expect(url).not.toContain('enabled');
    });

    test('getRule issues GET on the encoded rule URL', async () => {
      fetch.mockResponseOnce(JSON.stringify(rule), JSON_HEADERS);

      const res = await instance.getRule('r 1', TOKEN_MOCK);

      expect(res).toEqual(rule);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/rules/r%201'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    test('createRule POSTs the whole rule in one request', async () => {
      fetch.mockResponseOnce(JSON.stringify(rule), JSON_HEADERS);

      await instance.createRule(createDto, TOKEN_MOCK);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/rules'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify(createDto) }),
      );
    });

    test('updateRule PUTs the complete object', async () => {
      fetch.mockResponseOnce(JSON.stringify(rule), JSON_HEADERS);

      await instance.updateRule('r_1', createDto, TOKEN_MOCK);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/rules/r_1'),
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(createDto) }),
      );
    });

    test('deleteRule issues DELETE on the encoded rule URL', async () => {
      fetch.mockResponseOnce('');

      await instance.deleteRule('r_1', TOKEN_MOCK);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/rules/r_1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('evaluators', () => {
    const evaluator = {
      name: 'conversation-insights',
      version: 4,
      type: EvaluatorType.Llm,
      output_vars: [{ name: 'title', type: 'string' }],
    };

    test('getEvaluators unwraps the {items} envelope', async () => {
      const items = [{ name: 'conversation-insights', latest_version: 4 }];
      fetch.mockResponseOnce(JSON.stringify({ items }), JSON_HEADERS);

      expect(await instance.getEvaluators(TOKEN_MOCK)).toEqual(items);
    });

    test('getEvaluators accepts a bare array as well as the wrapper', async () => {
      const items = [{ name: 'conversation-insights', latest_version: 4 }];
      fetch.mockResponseOnce(JSON.stringify(items), JSON_HEADERS);

      expect(await instance.getEvaluators(TOKEN_MOCK)).toEqual(items);
    });

    test('getEvaluator issues GET on the encoded evaluator URL', async () => {
      fetch.mockResponseOnce(JSON.stringify(evaluator), JSON_HEADERS);

      const res = await instance.getEvaluator('my evaluator', TOKEN_MOCK);

      expect(res).toEqual(evaluator);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/evaluators/my%20evaluator'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    test('getEvaluatorVersion issues GET on the pinned-version URL', async () => {
      fetch.mockResponseOnce(JSON.stringify(evaluator), JSON_HEADERS);

      await instance.getEvaluatorVersion('conversation-insights', 4, TOKEN_MOCK);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/evaluators/conversation-insights/versions/4'),
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });
});
