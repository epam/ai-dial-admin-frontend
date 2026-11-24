import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { ConfigEntityOrigin, ConfigFileEntityType, ConfigFileFailureReason } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import * as configEntityRead from '../read';
import { getConfigEntityOptions } from '../read';
import { readPluginOptions } from '../read-plugin-options';

vi.mock('@/src/app/api/api');

describe('readPluginOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns bare plugin names with the caller token', async () => {
    vi.mocked(assetApi.getMetadata).mockResolvedValue({ items: [{ name: 'platform_plugin' }] } as never);
    vi.mocked(configFileApi.listNames).mockResolvedValue({ success: true, data: ['file-plugin'] });

    expect(await readPluginOptions(TOKEN_MOCK)).toEqual({ options: ['platform_plugin', 'file-plugin'] });
    expect(assetApi.getMetadata).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PLUGIN, '', {
      recursive: false,
      nextToken: undefined,
    });
    expect(configFileApi.listNames).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Plugins);
  });

  test('returns an empty list without a warning when both sources are empty', async () => {
    vi.mocked(assetApi.getMetadata).mockResolvedValue({ items: [] } as never);
    vi.mocked(configFileApi.listNames).mockResolvedValue({ success: true, data: [] });

    expect(await readPluginOptions(TOKEN_MOCK)).toEqual({ options: [] });
  });

  test('returns surviving names and a partial warning when a source fails', async () => {
    vi.mocked(assetApi.getMetadata).mockResolvedValue(null);
    vi.mocked(configFileApi.listNames).mockResolvedValue({ success: true, data: ['file-plugin'] });

    expect(await readPluginOptions(TOKEN_MOCK)).toEqual({
      options: ['file-plugin'],
      error: EntitiesI18nKey.OptionListPartial,
    });
  });

  test('returns an unavailable warning when both sources fail', async () => {
    vi.mocked(assetApi.getMetadata).mockResolvedValue(null);
    vi.mocked(configFileApi.listNames).mockResolvedValue({
      success: false,
      failure: { reason: ConfigFileFailureReason.RequestFailed, errorMessage: 'Forbidden' },
    });

    expect(await readPluginOptions(TOKEN_MOCK)).toEqual({ options: [], error: EntitiesI18nKey.OptionListUnavailable });
  });

  test('returns an unavailable warning on an unexpected reader exception', async () => {
    const reader = vi.spyOn(configEntityRead, 'getConfigEntityOptions').mockRejectedValueOnce(new Error('unexpected'));
    try {
      expect(await readPluginOptions(TOKEN_MOCK)).toEqual({
        options: [],
        error: EntitiesI18nKey.OptionListUnavailable,
      });
      expect(reader).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Plugins);
    } finally {
      reader.mockRestore();
    }
  });
});

describe('getConfigEntityOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DIAL_ADMIN_API_URL', undefined);
  });

  test('includes config-file options when the admin backend URL is unset', async () => {
    vi.mocked(assetApi.getMetadata).mockResolvedValue({ items: [{ name: 'api-role' }] } as never);
    vi.mocked(configFileApi.listNames).mockResolvedValue({ success: true, data: ['config-role'] });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Roles);

    expect(configFileApi.listNames).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Roles);
    expect(result).toEqual({
      success: true,
      data: {
        options: [
          { name: 'api-role', origin: ConfigEntityOrigin.Api },
          { name: 'config-role', origin: ConfigEntityOrigin.ConfigFile },
        ],
        failures: [],
      },
    });
  });

  test('reads the platform model population before merging it with config-file models', async () => {
    vi.mocked(assetApi.getMetadata).mockResolvedValue({ items: [{ name: 'api-model' }] } as never);
    vi.mocked(configFileApi.listNames).mockResolvedValue({ success: true, data: ['config-model'] });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Models);

    expect(assetApi.getMetadata).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.MODEL, '', {
      recursive: false,
      nextToken: undefined,
    });
    expect(result).toEqual({
      success: true,
      data: {
        options: [
          { name: 'api-model', origin: ConfigEntityOrigin.Api },
          { name: 'config-model', origin: ConfigEntityOrigin.ConfigFile },
        ],
        failures: [],
      },
    });
  });

  test('reads every plugin metadata page and merges duplicate names with Platform precedence', async () => {
    vi.mocked(assetApi.getMetadata)
      .mockResolvedValueOnce({ items: [{ name: 'shared' }, { name: 'first' }], nextToken: 'page-2' } as never)
      .mockResolvedValueOnce({ items: [{ name: 'second' }, { name: 'shared' }] } as never);
    vi.mocked(configFileApi.listNames).mockResolvedValue({ success: true, data: ['shared', 'file', 'file'] });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Plugins);

    expect(assetApi.getMetadata).toHaveBeenCalledTimes(2);
    expect(assetApi.getMetadata).toHaveBeenNthCalledWith(1, TOKEN_MOCK, ResourceType.PLUGIN, '', {
      recursive: false,
      nextToken: undefined,
    });
    expect(assetApi.getMetadata).toHaveBeenNthCalledWith(2, TOKEN_MOCK, ResourceType.PLUGIN, '', {
      recursive: false,
      nextToken: 'page-2',
    });
    expect(configFileApi.listNames).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Plugins);
    expect(assetApi.list).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: {
        options: [
          { name: 'shared', origin: ConfigEntityOrigin.Api },
          { name: 'first', origin: ConfigEntityOrigin.Api },
          { name: 'second', origin: ConfigEntityOrigin.Api },
          { name: 'file', origin: ConfigEntityOrigin.ConfigFile },
        ],
        failures: [],
      },
    });
  });

  test('returns a successful empty plugin list when both sources are empty', async () => {
    vi.mocked(assetApi.getMetadata).mockResolvedValue({ items: [] } as never);
    vi.mocked(configFileApi.listNames).mockResolvedValue({ success: true, data: [] });

    expect(await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Plugins)).toEqual({
      success: true,
      data: { options: [], failures: [] },
    });
  });

  test('reports a failed later plugin metadata page and retains config-file options', async () => {
    vi.mocked(assetApi.getMetadata)
      .mockResolvedValueOnce({ items: [{ name: 'incomplete' }], nextToken: 'page-2' } as never)
      .mockResolvedValueOnce(null);
    vi.mocked(configFileApi.listNames).mockResolvedValue({ success: true, data: ['file'] });

    expect(await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Plugins)).toEqual({
      success: true,
      data: {
        options: [{ name: 'file', origin: ConfigEntityOrigin.ConfigFile }],
        failures: [
          {
            reason: ConfigFileFailureReason.RequestFailed,
            errorMessage: 'Metadata listing for "plugins" could not be read from DIAL Core',
          },
        ],
      },
    });
    expect(assetApi.list).not.toHaveBeenCalled();
  });

  test('retains plugin metadata when config-file access is denied', async () => {
    vi.mocked(assetApi.getMetadata).mockResolvedValue({ items: [{ name: 'platform' }] } as never);
    vi.mocked(configFileApi.listNames).mockResolvedValue({
      success: false,
      failure: { reason: ConfigFileFailureReason.RequestFailed, status: 403, errorMessage: 'Forbidden' },
    });

    expect(await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Plugins)).toEqual({
      success: true,
      data: {
        options: [{ name: 'platform', origin: ConfigEntityOrigin.Api }],
        failures: [{ reason: ConfigFileFailureReason.RequestFailed, status: 403, errorMessage: 'Forbidden' }],
      },
    });
  });

  test('reports both failures when neither plugin source can be read', async () => {
    vi.mocked(assetApi.getMetadata).mockRejectedValue(new Error('metadata unavailable'));
    vi.mocked(configFileApi.listNames).mockRejectedValue(new Error('file unavailable'));

    expect(await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Plugins)).toEqual({
      success: false,
      failure: {
        reason: ConfigFileFailureReason.RequestFailed,
        errorMessage: 'metadata unavailable; file unavailable',
      },
    });
  });

  test('reports a config-file failure while retaining API-written options without the admin backend URL', async () => {
    vi.mocked(assetApi.getMetadata).mockResolvedValue({ items: [{ name: 'api-role' }] } as never);
    vi.mocked(configFileApi.listNames).mockResolvedValue({
      success: false,
      failure: { reason: ConfigFileFailureReason.RequestFailed, errorMessage: 'Core unavailable' },
    });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Roles);

    expect(configFileApi.listNames).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Roles);
    expect(result).toEqual({
      success: true,
      data: {
        options: [{ name: 'api-role', origin: ConfigEntityOrigin.Api }],
        failures: [{ reason: ConfigFileFailureReason.RequestFailed, errorMessage: 'Core unavailable' }],
      },
    });
  });
});
