import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getCatalogSchema, getConfigFileCatalogSchema } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { assetApi, configFileApi } from '@/src/app/api/api';
import { CONFIG_FILE_ENTITY_VIEWS } from '@/src/constants/config-file-entity-views';
import { READABLE_CONFIG_FILE_TYPES } from '@/src/constants/config-file-core';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Catalog schemas :: config-file population', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  /**
   * The type is readable while the view is not covered: this set guards every `ConfigFileApi` read,
   * including the single read the detail route falls back to (Issue #4605).
   */
  test('is a readable config-file type', () => {
    expect(READABLE_CONFIG_FILE_TYPES.has(ConfigFileEntityType.CatalogSchemas)).toBe(true);
  });

  test('is not a covered config-file entity view, so the page renders no toggle', () => {
    expect(CONFIG_FILE_ENTITY_VIEWS.has(ApplicationRoute.PlatformCatalogSchemas)).toBe(false);
  });

  test('the seven covered views are exactly the ones expected', () => {
    expect([...CONFIG_FILE_ENTITY_VIEWS]).toHaveLength(7);
    expect(CONFIG_FILE_ENTITY_VIEWS.has(ApplicationRoute.PlatformKeys)).toBe(false);
  });

  test('reads one file-declared schema by name', async () => {
    (configFileApi.getEntity as any).mockResolvedValue(RESPONSE_MOCK);

    await getConfigFileCatalogSchema('agent-card');

    expect(configFileApi.getEntity).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.CatalogSchemas, 'agent-card');
  });

  test('resolves a config-file schema by the $id its own map is keyed by', async () => {
    (configFileApi.getEntity as any).mockResolvedValue({ success: true, data: {} });

    await getConfigFileCatalogSchema('https://dial.epam.com/catalog-schemas/agent');

    expect(configFileApi.getEntity).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ConfigFileEntityType.CatalogSchemas,
      'https://dial.epam.com/catalog-schemas/agent',
    );
  });

  test('reads the API-written half under the encoded resource name, keeping it one blob name', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);
    const encoded = encodeURIComponent('https://dial.epam.com/catalog-schemas/agent');

    await getCatalogSchema(encoded, 'etag');

    const [, , path] = (assetApi.getMergedWithEtag as any).mock.calls[0];
    expect(path).toEqual(encoded);
    expect(path).not.toContain('/');
  });
});
