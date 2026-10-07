import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import { CatalogResolutionPolicy } from '@/src/types/analytics/import';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { importAnalyticsConfig, previewAnalyticsImportConfig } from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock('@/src/app/api/api');

describe('Import config actions :: Analytics', () => {
  const body = new FormData();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
  });

  test('previewAnalyticsImportConfig passes the file, policy, confirmation and token through', async () => {
    const response = { success: true };
    vi.mocked(analyticsDataApi.previewCatalogImport).mockResolvedValue(response);

    const result = await previewAnalyticsImportConfig(body, CatalogResolutionPolicy.SKIP_IF_EXISTS, false);

    expect(analyticsDataApi.previewCatalogImport).toHaveBeenCalledWith(
      body,
      CatalogResolutionPolicy.SKIP_IF_EXISTS,
      false,
      TOKEN_MOCK,
    );
    expect(result).toBe(response);
  });

  test('importAnalyticsConfig passes the file, policy, confirmation and token through', async () => {
    const response = { success: true };
    vi.mocked(analyticsDataApi.importCatalog).mockResolvedValue(response);

    const result = await importAnalyticsConfig(body, CatalogResolutionPolicy.FAIL_IF_EXISTS, true);

    expect(analyticsDataApi.importCatalog).toHaveBeenCalledWith(
      body,
      CatalogResolutionPolicy.FAIL_IF_EXISTS,
      true,
      TOKEN_MOCK,
    );
    expect(result).toBe(response);
  });
});
