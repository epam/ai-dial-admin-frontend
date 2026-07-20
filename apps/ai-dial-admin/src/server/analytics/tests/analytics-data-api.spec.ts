import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
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

  test('createTable POSTs the create payload to /v1/tables', async () => {
    const dto: CreateTableDto = {
      name: 'events',
      type: AnalyticsTableType.Source,
      columns: [{ source_name: 'ts', name: 'timestamp', type: AnalyticsFieldType.Timestamp }],
    };
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const res = await instance.createTable(dto, TOKEN_MOCK);

    expect(res).toEqual({ response: JSON.stringify({ success: true }), success: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/tables'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(dto) }),
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
});
