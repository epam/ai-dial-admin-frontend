import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { ConfigEntityOrigin, ConfigFileEntityType, ConfigFileFailureReason } from '@/src/types/config-file-entity';

const getConfigEntityOptions = vi.fn();
const getGlobalInterceptors = vi.fn();

vi.mock('@/src/server/config-entities/read', () => ({
  getConfigEntityOptions: (...args: unknown[]) => getConfigEntityOptions(...args),
  getGlobalInterceptors: (...args: unknown[]) => getGlobalInterceptors(...args),
}));

const { readConfigEntities, readGlobalInterceptors } = await import('@/src/server/config-entities/read-page-options');

describe('readConfigEntities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads and maps the option list', async () => {
    getConfigEntityOptions.mockResolvedValue({
      success: true,
      data: {
        options: [{ name: 'interceptor-1', origin: ConfigEntityOrigin.Api }],
        failures: [],
      },
    });
    const warnings: EntitiesI18nKey[] = [];

    const result = await readConfigEntities(TOKEN_MOCK, ConfigFileEntityType.Interceptors, warnings);

    expect(getConfigEntityOptions).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Interceptors);
    expect(result).toEqual([{ name: 'interceptor-1', displayName: 'interceptor-1', origin: ConfigEntityOrigin.Api }]);
    expect(warnings).toEqual([]);
  });

  test('reports and returns nothing when the read fails outright', async () => {
    getConfigEntityOptions.mockResolvedValue({
      success: false,
      failure: { reason: ConfigFileFailureReason.RequestFailed, errorMessage: 'boom' },
    });
    const warnings: EntitiesI18nKey[] = [];

    const result = await readConfigEntities(TOKEN_MOCK, ConfigFileEntityType.Roles, warnings);

    expect(result).toEqual([]);
    expect(warnings).toEqual([EntitiesI18nKey.OptionListUnavailable]);
  });

  test('reports a partial read but still returns the surviving population', async () => {
    getConfigEntityOptions.mockResolvedValue({
      success: true,
      data: {
        options: [{ name: 'role-1', origin: ConfigEntityOrigin.ConfigFile }],
        failures: [{ reason: ConfigFileFailureReason.RequestFailed, errorMessage: 'partial' }],
      },
    });
    const warnings: EntitiesI18nKey[] = [];

    const result = await readConfigEntities(TOKEN_MOCK, ConfigFileEntityType.Roles, warnings);

    expect(result).toEqual([{ name: 'role-1', displayName: 'role-1', origin: ConfigEntityOrigin.ConfigFile }]);
    expect(warnings).toEqual([EntitiesI18nKey.OptionListPartial]);
  });
});

describe('readGlobalInterceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns the interceptor names on a successful read', async () => {
    getGlobalInterceptors.mockResolvedValue({ success: true, data: ['global-1'] });
    const warnings: EntitiesI18nKey[] = [];

    const result = await readGlobalInterceptors(TOKEN_MOCK, warnings);

    expect(result).toEqual(['global-1']);
    expect(warnings).toEqual([]);
  });

  test('reports a failed read and returns an empty chain', async () => {
    getGlobalInterceptors.mockResolvedValue({
      success: false,
      failure: { reason: ConfigFileFailureReason.RequestFailed, errorMessage: 'boom' },
    });
    const warnings: EntitiesI18nKey[] = [];

    const result = await readGlobalInterceptors(TOKEN_MOCK, warnings);

    expect(result).toEqual([]);
    expect(warnings).toEqual([EntitiesI18nKey.GlobalInterceptorsUnavailable]);
  });
});
