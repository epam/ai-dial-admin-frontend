import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { ConfigEntityOrigin, ConfigFileEntityType, ConfigFileFailureReason } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { getConfigEntityOptions } from '../read';

vi.mock('@/src/app/api/api');

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
