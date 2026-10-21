import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getRoute, getRoutes } from '@/src/app/[lang]/test-suites/actions';
import { assetApi } from '@/src/app/api/api';
import { BucketType } from '@/src/models/dial/asset-list-item';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/app/api/api');

describe('getRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
  });

  test('lists platform routes from Core with the user token', async () => {
    const routes = [
      {
        name: 'search-route',
        folderId: 'platform/',
        path: 'search-route',
        bucket: BucketType.Platform,
      },
    ];
    vi.mocked(assetApi.list).mockResolvedValue(routes);

    await expect(getRoutes()).resolves.toBe(routes);

    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTE, 'platform/');
  });

  test('propagates a Core failure to the caller', async () => {
    const error = new Error('Core route list failed');
    vi.mocked(assetApi.list).mockRejectedValue(error);

    await expect(getRoutes()).rejects.toThrow(error);
  });
});

describe('getRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
  });

  test('loads the selected platform route from Core with the user token', async () => {
    const route = { name: 'search-route', methods: ['GET'], paths: ['/search'] };
    vi.mocked(assetApi.getMerged).mockResolvedValue(route);

    await expect(getRoute('search-route')).resolves.toBe(route);

    expect(assetApi.getMerged).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTE, 'search-route');
  });

  test('propagates a selected-route failure to the caller', async () => {
    const error = new Error('Core route read failed');
    vi.mocked(assetApi.getMerged).mockRejectedValue(error);

    await expect(getRoute('search-route')).rejects.toThrow(error);
  });
});
