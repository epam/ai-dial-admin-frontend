import { beforeEach, describe, expect, test, vi } from 'vitest';

import { catalogSchemasApi } from '@/src/app/api/api';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { readCatalogSchemaOptions } from '../read-options';

vi.mock('@/src/app/api/api');

const option = {
  $id: 'https://host/agent-card',
  'dial:catalogEntityType': CatalogEntityType.Agent,
  'dial:catalogDisplayName': 'Agent card',
};

describe('readCatalogSchemaOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns the options Core resolves from its merged configuration', async () => {
    (catalogSchemasApi.listSchemas as any).mockResolvedValue({ success: true, response: [option] });

    const result = await readCatalogSchemaOptions(TOKEN_MOCK);

    expect(catalogSchemasApi.listSchemas).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toEqual({ options: [option] });
  });

  test('reports a failed read rather than an empty catalogue', async () => {
    (catalogSchemasApi.listSchemas as any).mockResolvedValue({ success: false, errorMessage: 'nope' });

    const result = await readCatalogSchemaOptions(TOKEN_MOCK);

    expect(result).toEqual({ options: [], error: EntitiesI18nKey.OptionListUnavailable });
  });

  test('treats a response that is not a list as empty', async () => {
    (catalogSchemasApi.listSchemas as any).mockResolvedValue({ success: true, response: { nope: true } });

    const result = await readCatalogSchemaOptions(TOKEN_MOCK);

    expect(result).toEqual({ options: [] });
  });

  test('treats a missing response as empty', async () => {
    (catalogSchemasApi.listSchemas as any).mockResolvedValue({ success: true });

    const result = await readCatalogSchemaOptions(TOKEN_MOCK);

    expect(result).toEqual({ options: [] });
  });
});
