import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryRequest, SavedQueryScope } from '@/src/models/analytics/saved-query';
import {
  CreatePipelineDto,
  PipelineEnabledFilter,
  PipelineKind,
  TriggerKind,
  TransformType,
} from '@/src/models/analytics/pipeline';
import { TableWriteMode, AnalyticsTableType, CreateTableDto } from '@/src/models/analytics/table';
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

    expect(res).toEqual(expect.objectContaining({ success: true, response: entities }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/queries/entities'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getEntitySchema issues GET with a URL-encoded entity name', async () => {
    const schema = { fields: [{ name: 'id', type: AnalyticsFieldType.Uuid, source: 'id' }] };
    fetch.mockResponseOnce(JSON.stringify(schema), JSON_HEADERS);

    const res = await instance.getEntitySchema('my entity', TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: schema }));
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

    expect(res).toEqual(expect.objectContaining({ success: true, response: functions }));
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

  test('getEntities carries a failed response as an unsuccessful envelope', async () => {
    fetch.mockResponseOnce('nope', { status: 500 });

    const res = await instance.getEntities(TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: false, status: 500 }));
    expect(res.response).toBeUndefined();
  });

  test('getTables issues GET /v1/tables and unwraps the { tables } envelope', async () => {
    const tables = [{ name: 'dial_usage_log', type: AnalyticsTableType.Source }];
    fetch.mockResponseOnce(JSON.stringify({ tables }), { headers: { 'content-type': 'application/json' } });

    const res = await instance.getTables(TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: tables }));
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
    const dto: CreateTableDto = {
      name: 'events',
      type: AnalyticsTableType.Source,
      description: 'Raw events',
      write: TableWriteMode.Append,
    };
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

    expect(await instance.getTable('events', TOKEN_MOCK)).toEqual(
      expect.objectContaining({ success: true, response: table }),
    );
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

    expect(res).toEqual(expect.objectContaining({ success: true, response: access }));
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

    expect(res).toEqual(expect.objectContaining({ success: true, response: [savedQuery] }));
  });

  test('listSavedQueries reads a missing envelope as an unreadable body', async () => {
    fetch.mockResponseOnce(JSON.stringify({}), JSON_HEADERS);

    const res = await instance.listSavedQueries(SavedQueryScope.Personal, TOKEN_MOCK);

    expect(res.success).toBe(false);
    expect(res.response).toBeUndefined();
  });

  test('getSavedQuery issues GET on the encoded saved-query URL and returns the parsed query', async () => {
    fetch.mockResponseOnce(JSON.stringify(savedQuery), JSON_HEADERS);

    const res = await instance.getSavedQuery('sq /1', TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: savedQuery }));
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
  describe('pipelines', () => {
    const pipeline = {
      name: 'turn_feedback_live',
      kind: PipelineKind.Enrich,
      target: 'turn_feedback',
      inputs: ['response_ratings'],
      trigger: { kind: TriggerKind.OnIngest },
      transform: { type: TransformType.Sql, outputs: { rate_event_count: 'count(*)' } },
      response_schema: { type: 'object', properties: { rate_event_count: { type: 'number' } } },
      grain_key: 'response_id',
      enabled: true,
      generation: 5,
      created_at: '2026-08-20T14:39:05Z',
      updated_at: '2026-08-21T09:37:29Z',
    };

    const createDto: CreatePipelineDto = {
      name: 'new_pipeline',
      kind: PipelineKind.Enrich,
      target: 'turn_feedback',
      trigger: { kind: TriggerKind.OnIngest },
      transform: { type: TransformType.Sql, outputs: { rate_event_count: 'count(*)' } },
      enabled: false,
    };

    test('getPipelines unwraps the {pipelines} envelope, not {items}', async () => {
      fetch.mockResponseOnce(JSON.stringify({ pipelines: [pipeline] }), JSON_HEADERS);

      expect(await instance.getPipelines(undefined, TOKEN_MOCK)).toEqual(
        expect.objectContaining({ success: true, response: [pipeline] }),
      );
    });

    test('getPipelines reads a list under any other key as an unreadable body', async () => {
      fetch.mockResponseOnce(JSON.stringify({ items: [pipeline] }), JSON_HEADERS);

      const res = await instance.getPipelines(undefined, TOKEN_MOCK);

      expect(res.success).toBe(false);
      expect(res.response).toBeUndefined();
    });

    // Deployed builds disagree: some answer a bare array, some the wrapper.
    test('getPipelines accepts a bare array as well as the wrapper', async () => {
      fetch.mockResponseOnce(JSON.stringify([pipeline]), JSON_HEADERS);

      expect(await instance.getPipelines(undefined, TOKEN_MOCK)).toEqual(
        expect.objectContaining({ success: true, response: [pipeline] }),
      );
    });

    test('getPipelines reads an empty bare array as no pipelines rather than a failure', async () => {
      fetch.mockResponseOnce(JSON.stringify([]), JSON_HEADERS);

      expect(await instance.getPipelines(undefined, TOKEN_MOCK)).toEqual(
        expect.objectContaining({ success: true, response: [] }),
      );
    });

    test('getPipelines carries a refusal as status 403 so the page can render its own fallback', async () => {
      fetch.mockResponseOnce('', { status: 403 });

      const res = await instance.getPipelines(undefined, TOKEN_MOCK);

      expect(res).toEqual(expect.objectContaining({ success: false, status: 403 }));
      expect(res.response).toBeUndefined();
    });

    test('getPipelines carries any other failure with the service status and words', async () => {
      fetch.mockResponseOnce('{"error":"upstream","message":"registry timed out"}', { status: 500 });

      expect(await instance.getPipelines(undefined, TOKEN_MOCK)).toEqual(
        expect.objectContaining({
          success: false,
          status: 500,
          errorHeader: 'upstream',
          errorMessage: 'registry timed out',
        }),
      );
    });

    test('getPipelines omits enabled entirely when no preference is expressed', async () => {
      fetch.mockResponseOnce(JSON.stringify({ pipelines: [] }), JSON_HEADERS);

      await instance.getPipelines({ enabled: PipelineEnabledFilter.All }, TOKEN_MOCK);

      const url = fetch.mock.calls[0][0] as string;
      expect(url).not.toContain('enabled');
    });

    // The service refuses `view=compiled` in a listing that is not scoped to `kind=enrich`, and the
    // default `source` projection already carries every member the grid renders.
    test('getPipelines names no projection, so a cross-kind listing is not refused', async () => {
      fetch.mockResponseOnce(JSON.stringify({ pipelines: [] }), JSON_HEADERS);

      await instance.getPipelines(undefined, TOKEN_MOCK);

      expect(fetch.mock.calls[0][0] as string).not.toContain('view=');
    });

    test('getPipelines leaves no dangling query separator when no filter is set', async () => {
      fetch.mockResponseOnce(JSON.stringify({ pipelines: [] }), JSON_HEADERS);

      await instance.getPipelines(undefined, TOKEN_MOCK);

      expect(fetch.mock.calls[0][0] as string).toMatch(/\/v1\/pipelines$/);
    });

    test('getPipelines sends enabled=true for the enabled-only filter', async () => {
      fetch.mockResponseOnce(JSON.stringify({ pipelines: [] }), JSON_HEADERS);

      await instance.getPipelines({ enabled: PipelineEnabledFilter.Enabled }, TOKEN_MOCK);

      expect(fetch.mock.calls[0][0] as string).toContain('enabled=true');
    });

    test('getPipelines sends enabled=false for the disabled-only filter', async () => {
      fetch.mockResponseOnce(JSON.stringify({ pipelines: [] }), JSON_HEADERS);

      await instance.getPipelines({ enabled: PipelineEnabledFilter.Disabled }, TOKEN_MOCK);

      expect(fetch.mock.calls[0][0] as string).toContain('enabled=false');
    });

    test('getPipelines scopes the listing to one kind', async () => {
      fetch.mockResponseOnce(JSON.stringify({ pipelines: [] }), JSON_HEADERS);

      await instance.getPipelines({ kind: PipelineKind.Aggregate }, TOKEN_MOCK);

      expect(fetch.mock.calls[0][0] as string).toContain('kind=aggregate');
    });

    test('getPipelines combines every filter rather than one replacing the other', async () => {
      fetch.mockResponseOnce(JSON.stringify({ pipelines: [] }), JSON_HEADERS);

      await instance.getPipelines(
        {
          kind: PipelineKind.Enrich,
          enabled: PipelineEnabledFilter.Enabled,
          updatedSince: '2026-08-01T00:00:00Z',
        },
        TOKEN_MOCK,
      );

      const url = fetch.mock.calls[0][0] as string;
      expect(url).toContain('kind=enrich');
      expect(url).toContain('enabled=true');
      expect(url).toContain('updated_since=2026-08-01T00%3A00%3A00Z');
    });

    test('getPipelines sends updated_since alone when enabled is unfiltered', async () => {
      fetch.mockResponseOnce(JSON.stringify({ pipelines: [] }), JSON_HEADERS);

      await instance.getPipelines(
        { enabled: PipelineEnabledFilter.All, updatedSince: '2026-08-01T00:00:00Z' },
        TOKEN_MOCK,
      );

      const url = fetch.mock.calls[0][0] as string;
      expect(url).toContain('updated_since=');
      expect(url).not.toContain('enabled');
    });

    test('getPipeline reads the declaration first, then the compiled projection for an enrich pipeline', async () => {
      const declaration = { ...pipeline, response_schema: undefined, grain_key: undefined };
      fetch.mockResponseOnce(JSON.stringify(declaration), JSON_HEADERS);
      fetch.mockResponseOnce(JSON.stringify(pipeline), JSON_HEADERS);

      const res = await instance.getPipeline('turn feedback', TOKEN_MOCK);

      // The compiled answer is what the caller gets: it is the one carrying the resolved members.
      expect(res).toEqual(expect.objectContaining({ success: true, response: pipeline }));
      expect(fetch.mock.calls[0][0] as string).toContain('/v1/pipelines/turn%20feedback?view=source');
      expect(fetch.mock.calls[1][0] as string).toContain('/v1/pipelines/turn%20feedback?view=compiled');
      expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: 'GET' }));
    });

    // `view=compiled` is refused with 422 for every kind but `enrich`, so asking for it here would turn a
    // readable aggregate pipeline into a failed read — which the detail page renders as a 404.
    test('getPipeline reads an aggregate pipeline once and never asks for the compiled projection', async () => {
      const aggregate = {
        name: 'turns_rollup',
        kind: PipelineKind.Aggregate,
        target: 'turns',
        inputs: ['dial_usage_log'],
        trigger: { kind: TriggerKind.Schedule },
        enabled: true,
        generation: 8,
        created_at: '2026-08-14T13:47:58Z',
        updated_at: '2026-09-04T07:52:02Z',
      };
      fetch.mockResponseOnce(JSON.stringify(aggregate), JSON_HEADERS);

      const res = await instance.getPipeline('turns_rollup', TOKEN_MOCK);

      expect(res).toEqual(expect.objectContaining({ success: true, response: aggregate }));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0] as string).toContain('view=source');
    });

    // Downgrading to the declaration would leave the detail view printing `grain_key` and
    // `version_column` as "not set" — a false statement about an enrich pipeline, not a missing one.
    test('getPipeline reports a failed compiled read rather than falling back to the declaration', async () => {
      fetch.mockResponseOnce(JSON.stringify({ ...pipeline, response_schema: undefined }), JSON_HEADERS);
      fetch.mockResponseOnce('', { status: 422 });

      const res = await instance.getPipeline('turn_feedback_live', TOKEN_MOCK);

      expect(res).toEqual(expect.objectContaining({ success: false, status: 422 }));
      expect(res.response).toBeUndefined();
      // Both reads were issued, so it is the compiled one that failed — not the declaration.
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // A 2xx whose body is not a pipeline leaves `handleResponse` with no error to describe, so the read
    // reports the failure through an empty envelope rather than presenting an unusable object. The
    // detail page turns that into its not-found state, which is why both reads need the guard.
    test('getPipeline reports an unreadable declaration rather than an empty success', async () => {
      fetch.mockResponseOnce('', { status: 200 });

      const res = await instance.getPipeline('turn_feedback_live', TOKEN_MOCK);

      expect(res).toEqual(expect.objectContaining({ success: false }));
      expect(res.response).toBeUndefined();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('getPipeline reports an unreadable compiled answer rather than an empty success', async () => {
      fetch.mockResponseOnce(JSON.stringify({ ...pipeline, response_schema: undefined }), JSON_HEADERS);
      fetch.mockResponseOnce('', { status: 200 });

      const res = await instance.getPipeline('turn_feedback_live', TOKEN_MOCK);

      expect(res).toEqual(expect.objectContaining({ success: false }));
      expect(res.response).toBeUndefined();
    });

    test('getPipeline carries a refusal as status 403 rather than reporting the pipeline missing', async () => {
      fetch.mockResponseOnce('', { status: 403 });

      const res = await instance.getPipeline('turn_feedback_live', TOKEN_MOCK);

      expect(res).toEqual(expect.objectContaining({ success: false, status: 403 }));
      expect(res.response).toBeUndefined();
    });

    test('createPipeline POSTs the whole pipeline in one request', async () => {
      fetch.mockResponseOnce(JSON.stringify(pipeline), JSON_HEADERS);

      await instance.createPipeline(createDto, TOKEN_MOCK);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/pipelines'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify(createDto) }),
      );
    });

    test('updatePipeline PATCHes the name-addressed pipeline', async () => {
      fetch.mockResponseOnce(JSON.stringify(pipeline), JSON_HEADERS);

      await instance.updatePipeline('turn_feedback_live', createDto, TOKEN_MOCK);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/pipelines/turn_feedback_live'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify(createDto) }),
      );
    });

    test('deletePipeline issues DELETE on the encoded name URL', async () => {
      fetch.mockResponseOnce('');

      await instance.deletePipeline('turn_feedback_live', TOKEN_MOCK);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/pipelines/turn_feedback_live'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  // No evaluator call is exposed at all: the transform travels on the pipeline request, and a client
  // method for a surface that authors nothing is a way to reintroduce one by accident.
  test('exposes no call against any /v1/evaluators path', () => {
    const surface = Object.getOwnPropertyNames(Object.getPrototypeOf(instance));

    expect(surface.filter((name) => name.toLowerCase().includes('evaluator'))).toEqual([]);
  });
});
