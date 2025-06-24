import { utilityApi } from '@/src/app/api/api';
import { IMPORT_CONFIG_URL, PREVIEW_IMPORT_CONFIG_URL } from '@/src/server/utility-api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, vi, test } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { importJsonConfigs, importZipConfig, previewJsonConfigs, previewZipConfig } from './actions';

const fetch = createFetchMock(vi);
fetch.enableMocks();

vi.mock('@/src/app/api/api', () => ({
  utilityApi: {
    importJsonConfigs: vi.fn(),
    importZipConfig: vi.fn(),
  },
}));

vi.mock('@/src/utils/auth/auth-request', () => ({
  getUserToken: vi.fn(),
}));

vi.mock('@/src/utils/env/get-auth-toggle', () => ({
  getIsEnableAuthToggle: vi.fn(),
}));

describe('Import Config :: server actions', () => {
  const mockFormData = {} as FormData;

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.resetMocks();
    getUserToken.mockResolvedValue(TOKEN_MOCK);
    getIsEnableAuthToggle.mockReturnValue(true);
  });

  test('Should call importJsonConfigs with correct params', async () => {
    utilityApi.importJsonConfigs.mockResolvedValue('json-result');
    const result = await importJsonConfigs(mockFormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.importJsonConfigs).toHaveBeenCalledWith(IMPORT_CONFIG_URL, TOKEN_MOCK, mockFormData);
    expect(result).toBe('json-result');
  });

  test('Should call importZipConfig with correct params', async () => {
    utilityApi.importZipConfig.mockResolvedValue('zip-result');
    const result = await importZipConfig(mockFormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.importZipConfig).toHaveBeenCalledWith(IMPORT_CONFIG_URL, TOKEN_MOCK, mockFormData);
    expect(result).toBe('zip-result');
  });

  test('Should call previewJsonConfigs with correct params', async () => {
    utilityApi.importJsonConfigs.mockResolvedValue('preview-json-result');
    const result = await previewJsonConfigs(mockFormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.importJsonConfigs).toHaveBeenCalledWith(PREVIEW_IMPORT_CONFIG_URL, TOKEN_MOCK, mockFormData);
    expect(result).toBe('preview-json-result');
  });

  test('Should call previewZipConfig with correct params', async () => {
    utilityApi.importZipConfig.mockResolvedValue('preview-zip-result');
    const result = await previewZipConfig(mockFormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.importZipConfig).toHaveBeenCalledWith(PREVIEW_IMPORT_CONFIG_URL, TOKEN_MOCK, mockFormData);
    expect(result).toBe('preview-zip-result');
  });
});
