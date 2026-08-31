import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi } from '@/src/app/api/api';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { bulkDeleteRoutes, createRoute, getRoute, getRoutes, removeRoute, updateRoute } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets route :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getRoutes action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRoutes('platform/');

    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTE, 'platform/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getRoute action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRoute('platform/my-route', 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.ROUTE,
      'platform/my-route',
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createRoute action, stripping read-only projections', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createRoute({
      name: 'my-route',
      path: 'platform/my-route',
      folderId: 'platform/',
      status: DialModelResourceStatus.Valid,
      paths: ['/api'],
    });

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTE, 'my-route', {
      name: 'my-route',
      paths: ['/api'],
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createRoute action, stripping a description the generic create form seeds but Route has no field for', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createRoute({
      name: 'my-route',
      path: 'platform/my-route',
      folderId: 'platform/',
      description: '',
    } as any);

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTE, 'my-route', { name: 'my-route' });
  });

  test('createRoute propagates a Core rejection unchanged', async () => {
    const rejection = { success: false, errorHeader: 'Bad Request', errorMessage: 'paths is required' };
    (assetApi.put as any).mockResolvedValue(rejection);

    const result = await createRoute({ name: 'my-route', path: 'platform/my-route', folderId: 'platform/' });

    expect(result).toBe(rejection);
  });

  test('Should call updateRoute action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateRoute({ name: 'my-route', path: 'platform/my-route', folderId: 'platform/' }, 'etag');

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.ROUTE,
      'my-route',
      { name: 'my-route' },
      { etag: 'etag' },
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateRoute action, stripping author/createdAt/updatedAt — Core metadata fields the read merges in, not `Route.class` fields', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateRoute(
      {
        name: 'qwe',
        path: 'platform/qwe',
        folderId: 'platform/',
        rewritePath: false,
        paths: [],
        methods: [],
        upstreams: [],
        maxRetryAttempts: 2,
        order: 2147483647,
        attachmentPaths: { requestBody: [], responseBody: [] },
        author: 'Yauheni Osipau',
        createdAt: '1787660728755',
        updatedAt: '1787660728755',
      },
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.ROUTE,
      'qwe',
      {
        name: 'qwe',
        rewritePath: false,
        paths: [],
        methods: [],
        upstreams: [],
        maxRetryAttempts: 2,
        order: 2147483647,
        attachmentPaths: { requestBody: [], responseBody: [] },
      },
      { etag: 'etag' },
    );
  });

  test('Should call removeRoute action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeRoute('platform/my-route', 'etag');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTE, 'platform/my-route', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeleteRoutes action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteRoutes([{ path: 'platform/my-route' }]);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTE, 'platform/my-route');
    expect(result).toEqual({ success: true });
  });
});
