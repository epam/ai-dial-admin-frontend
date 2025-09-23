import { ServerActionResponse } from '@/src/models/server-action';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { APP_DELETE_BULK_URL, APP_DELETE_URL, APP_LIST_URL, ApplicationAssetsApi } from '../application-assets-api';
import { DialAssetApp } from '@/src/models/dial/asset-app';

const fetch = createFetchMock(vi);
fetch.enableMocks();
describe('AssetAppsApi', () => {
  const instance = new ApplicationAssetsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getAppsList and returns prompts', async () => {
    const mockPrompts: DialAssetApp[] = [{ id: '1', name: 'Test' } as DialAssetApp];

    fetchMock.mockResponseOnce(JSON.stringify({ items: mockPrompts }));

    await instance.getAppsList(TOKEN_MOCK, '/apps');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${APP_LIST_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/apps' }),
      }),
    );
  });

  test('Should calls removeApp and calls POST and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeApp(TOKEN_MOCK, '/apps/someApp');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${APP_DELETE_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/apps/someApp' }),
      }),
    );
  });

  test('Should calls moveApps and sends POST requests per file and returns responses', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponse(JSON.stringify(mockResponse));

    const paths = ['/old/app1', '/old/app2'];
    await instance.moveApps(TOKEN_MOCK, paths, '/new');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('Should calls bulkDeleteApps and sends POST request and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponse(JSON.stringify(mockResponse));

    const paths = [{ path: '/old/app1' }, { path: '/old/app2' }];
    await instance.bulkDeleteApps(TOKEN_MOCK, paths);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${APP_DELETE_BULK_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ paths: [{ path: '/old/app1' }, { path: '/old/app2' }] }),
      }),
    );
  });
});
