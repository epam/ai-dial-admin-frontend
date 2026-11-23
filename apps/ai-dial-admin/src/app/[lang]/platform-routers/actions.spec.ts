import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { READABLE_CONFIG_FILE_TYPES } from '@/src/constants/config-file-core';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { RouterMode } from '@/src/models/dial/router';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeleteRouters,
  createRouter,
  getConfigFileRouter,
  getConfigFileRouters,
  getRouter,
  getRouters,
  removeRouter,
  updateRouter,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Platform routers :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getRouters action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRouters('platform/');

    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTER, 'platform/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getRouter action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRouter('cost-aware', 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTER, 'cost-aware', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should read config-file router names and one router by name', async () => {
    (configFileApi.listNames as any).mockResolvedValue(RESPONSE_MOCK);
    (configFileApi.getEntity as any).mockResolvedValue(RESPONSE_MOCK);

    await getConfigFileRouters();
    await getConfigFileRouter('r1');

    expect(configFileApi.listNames).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Routers);
    expect(configFileApi.getEntity).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Routers, 'r1');
  });

  test('createRouter strips the merge layer metadata and keeps Core content fields', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createRouter({
      name: 'cost-aware',
      mode: RouterMode.Decision,
      decision: { timeoutMs: 2000 },
      baseUrl: 'http://localhost:4848',
      _metadata: { name: 'cost-aware', path: 'cost-aware', folderId: '', status: DialModelResourceStatus.Valid },
    });

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTER, 'cost-aware', {
      name: 'cost-aware',
      mode: RouterMode.Decision,
      decision: { timeoutMs: 2000 },
      baseUrl: 'http://localhost:4848',
    });
  });

  test('createRouter propagates a Core rejection unchanged', async () => {
    const rejection = { success: false, errorHeader: 'Unprocessable Entity', errorMessage: 'decision requires mode' };
    (assetApi.put as any).mockResolvedValue(rejection);

    expect(await createRouter({ name: 'r1' })).toBe(rejection);
  });

  test('Should call updateRouter action with the etag', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateRouter({ name: 'r1' }, 'etag');

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTER, 'r1', { name: 'r1' }, { etag: 'etag' });
  });

  test('Should call removeRouter and bulkDeleteRouters actions', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    await removeRouter('r1', 'etag');
    const result = await bulkDeleteRouters([{ path: 'r1' }]);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTER, 'r1', 'etag');
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROUTER, 'r1');
    expect(result).toEqual({ success: true });
  });

  test('routers are a readable config-file type while keys stay refused', () => {
    expect(READABLE_CONFIG_FILE_TYPES.has(ConfigFileEntityType.Routers)).toBe(true);
    expect(READABLE_CONFIG_FILE_TYPES.has(ConfigFileEntityType.Keys)).toBe(false);
  });
});
