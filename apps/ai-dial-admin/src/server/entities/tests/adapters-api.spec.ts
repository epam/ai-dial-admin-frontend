import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DialAdapter } from '@/src/models/dial/adapter';
import { ServerActionResponse } from '@/src/models/server-action';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { ADAPTERS_URL, AdaptersApi } from '../adapters-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const adapter: DialAdapter = {
  name: 'test-adapter',
  description: 'Test adapter',
} as DialAdapter;

describe('Server :: Adapters', () => {
  const instance = new AdaptersApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getAdaptersList with list of adapters', async () => {
    fetch.mockResponseOnce(JSON.stringify([adapter]));

    const result = await instance.getAdaptersList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(ADAPTERS_URL),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify([adapter]));
  });

  test('Should calls getAdaptersListAction returns server action response', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getAdaptersListAction(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(ADAPTERS_URL),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls createAdapter and posts new adapter', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createAdapter(adapter, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(ADAPTERS_URL),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(adapter) }),
    );
  });

  test('Should calls removeAdapter and deletes the adapter', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeAdapter(TOKEN_MOCK, adapter.name);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${ADAPTERS_URL}/${adapter.name}`),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should calls getAdapter and fetches a specific adapter', async () => {
    fetch.mockResponseOnce(JSON.stringify(adapter));

    const result = await instance.getAdapter(adapter.name || '', TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${ADAPTERS_URL}/${adapter.name}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(adapter));
  });

  test('Should calls updateAdapter and sends updated data via PUT', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateAdapter(adapter, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${ADAPTERS_URL}/${adapter.name}`),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(adapter),
      }),
    );
  });

  test('Should calls updateAdapter and sends updated data via PUT', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateAdapter({ ...adapter, name: void 0 }, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(ADAPTERS_URL),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...adapter, name: void 0 }),
      }),
    );
  });
});
