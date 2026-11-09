import { beforeEach, describe, expect, test, vi } from 'vitest';

import { coreUtilityApi } from '@/src/app/api/api';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { CallerDeploymentKind } from '@/src/server/core/core-utility-api';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { readCallerOptions } from '../read-caller-options';

vi.mock('@/src/app/api/api');

describe('readCallerOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('maps the caller-scoped lists to the picker shapes', async () => {
    vi.mocked(coreUtilityApi.getCallerDeployments).mockImplementation(async (_token, kind) => ({
      success: true,
      response: {
        data:
          kind === CallerDeploymentKind.Models
            ? [{ id: 'gpt', display_name: 'GPT' }]
            : [{ id: 'app-without-display-name' }],
      },
    }));
    vi.mocked(coreUtilityApi.getRunnerSchemas).mockResolvedValue({ success: true, response: [{ $id: 'runner' }] });
    const warnings: EntitiesI18nKey[] = [];

    const result = await readCallerOptions(TOKEN_MOCK, warnings);

    expect(result).toEqual({
      models: [{ name: 'gpt', displayName: 'GPT' }],
      applications: [{ name: 'app-without-display-name', displayName: 'app-without-display-name' }],
      schemes: [{ $id: 'runner' }],
    });
    expect(warnings).toEqual([]);
  });

  test('degrades each failed read to an empty list and warns once per failure', async () => {
    vi.mocked(coreUtilityApi.getCallerDeployments).mockResolvedValue({ success: false, errorMessage: 'boom' });
    vi.mocked(coreUtilityApi.getRunnerSchemas).mockResolvedValue({ success: false, errorMessage: 'boom' });
    const warnings: EntitiesI18nKey[] = [];

    const result = await readCallerOptions(TOKEN_MOCK, warnings);

    expect(result).toEqual({ models: [], applications: [], schemes: [] });
    expect(warnings).toEqual(Array(3).fill(EntitiesI18nKey.OptionListUnavailable));
  });
});
