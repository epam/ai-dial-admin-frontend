import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { CatalogSchemasApi } from '../catalog-schemas-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: CatalogSchemasApi', () => {
  const instance = new CatalogSchemasApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('listSchemas reads the merged-configuration list route', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));

    await instance.listSchemas(TOKEN_MOCK);

    expect(fetch.mock.calls[0][0]).toContain('/v1/catalog_schemas/schemas');
  });

  test('listSchemas returns the option rows Core sends', async () => {
    const options = [{ $id: 'https://host/agent', 'dial:catalogDisplayName': 'Agent card' }];
    fetch.mockResponseOnce(JSON.stringify(options), { headers: { 'content-type': 'application/json' } });

    const result = await instance.listSchemas(TOKEN_MOCK);

    expect(result.success).toBeTruthy();
    expect(result.response).toEqual(options);
  });

  test('schema looks a schema up by id on the single-schema route', async () => {
    fetch.mockResponseOnce(JSON.stringify({ $id: 'https://host/agent' }));

    await instance.schema(TOKEN_MOCK, 'https://host/agent');

    expect(fetch.mock.calls[0][0]).toContain('/v1/catalog_schemas/schema?id=https%3A%2F%2Fhost%2Fagent');
  });

  test('schema encodes an id exactly once', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));

    await instance.schema(TOKEN_MOCK, 'https://host/a b');

    expect(fetch.mock.calls[0][0]).not.toContain('%25');
  });

  test('a failed read is reported rather than returned as an empty list', async () => {
    fetch.mockResponseOnce('Schema not found', { status: 404 });

    const result = await instance.schema(TOKEN_MOCK, 'https://host/missing');

    expect(result.success).toBeFalsy();
    expect(result.status).toBe(404);
  });
});
