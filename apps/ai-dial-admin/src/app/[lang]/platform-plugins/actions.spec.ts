import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeletePlugins,
  createPlugin,
  getConfigFilePlugin,
  getConfigFilePlugins,
  getPlugin,
  getPlugins,
  removePlugin,
  updatePlugin,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets plugin :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
  });

  test('getPlugins lists the plugin resources with the token', async () => {
    const listed: Awaited<ReturnType<typeof assetApi.list>> = [];
    vi.mocked(assetApi.list).mockResolvedValue(listed);

    const result = await getPlugins('platform/');

    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PLUGIN, 'platform/');
    expect(result).toBe(listed);
  });

  test('getPlugin reads the merged entity with its etag', async () => {
    vi.mocked(assetApi.getMergedWithEtag).mockResolvedValue(RESPONSE_MOCK);

    const result = await getPlugin('my-plugin', 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PLUGIN, 'my-plugin', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('reads config-file plugin names and one entry by name', async () => {
    vi.mocked(configFileApi.listNames).mockResolvedValue({ success: true, data: ['my-plugin'] });
    vi.mocked(configFileApi.getEntity).mockResolvedValue({ success: true, data: { type: 'forward' } });

    const names = await getConfigFilePlugins();
    await getConfigFilePlugin('my-plugin');

    expect(names).toEqual({ success: true, data: ['my-plugin'] });
    expect(configFileApi.listNames).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Plugins);
    expect(configFileApi.getEntity).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Plugins, 'my-plugin');
  });

  test('createPlugin sends only type and settings, with no name, timestamps or _metadata', async () => {
    vi.mocked(assetApi.put).mockResolvedValue(RESPONSE_MOCK);

    const result = await createPlugin({
      name: 'my-plugin',
      type: 'forward',
      settings: { deployment: 'gpt-4' },
      createdAt: '1',
      updatedAt: '2',
      _metadata: {
        name: 'my-plugin',
        path: 'my-plugin',
        folderId: '',
        status: DialModelResourceStatus.Valid,
      },
    });

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PLUGIN, 'my-plugin', {
      type: 'forward',
      settings: { deployment: 'gpt-4' },
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createPlugin trims the type and defaults settings to an empty object', async () => {
    vi.mocked(assetApi.put).mockResolvedValue(RESPONSE_MOCK);

    await createPlugin({ name: 'my-plugin', type: '  forward  ' });

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PLUGIN, 'my-plugin', {
      type: 'forward',
      settings: {},
    });
  });

  test('createPlugin propagates a Core rejection unchanged', async () => {
    const rejection = { success: false, errorHeader: 'Unprocessable Entity', errorMessage: 'Unknown plugin type' };
    vi.mocked(assetApi.put).mockResolvedValue(rejection);

    const result = await createPlugin({ name: 'my-plugin', type: 'nope' });

    expect(result).toBe(rejection);
  });

  test('updatePlugin addresses the resource by its metadata name and carries the etag', async () => {
    vi.mocked(assetApi.put).mockResolvedValue(RESPONSE_MOCK);

    await updatePlugin({ type: 'forward', _metadata: { name: 'my-plugin', path: 'my-plugin', folderId: '' } }, 'etag');

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.PLUGIN,
      'my-plugin',
      { type: 'forward', settings: {} },
      { etag: 'etag' },
    );
  });

  test('removePlugin deletes the resource with its etag', async () => {
    vi.mocked(assetApi.delete).mockResolvedValue(RESPONSE_MOCK);

    const result = await removePlugin('my-plugin', 'etag');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PLUGIN, 'my-plugin', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('bulkDeletePlugins deletes only plugin resources', async () => {
    vi.mocked(assetApi.delete).mockResolvedValue({ success: true });

    const result = await bulkDeletePlugins([{ path: 'my-plugin' }]);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PLUGIN, 'my-plugin');
    expect(result).toEqual({ success: true });
  });
});
