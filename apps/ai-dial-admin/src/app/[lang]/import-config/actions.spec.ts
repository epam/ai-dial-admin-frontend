import { beforeEach, describe, expect, test, vi } from 'vitest';

import { utilityApi } from '@/src/app/api/api';
import {
  IMPORT_CONFIG_URL,
  IMPORT_ZIP_CONFIG_URL,
  PREVIEW_IMPORT_CONFIG_URL,
  PREVIEW_IMPORT_ZIP_CONFIG_URL,
} from '@/src/server/utility-api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { importJsonConfigs, importZipConfig, previewJsonConfigs, previewZipConfig } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Import Config :: server actions', () => {
  const mockFormData = new FormData();

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call importJsonConfigs with correct params', async () => {
    (utilityApi.importJsonConfigs as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await importJsonConfigs(mockFormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.importJsonConfigs).toHaveBeenCalledWith(IMPORT_CONFIG_URL, TOKEN_MOCK, mockFormData);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call importZipConfig with correct params', async () => {
    (utilityApi.importZipConfig as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await importZipConfig(mockFormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.importZipConfig).toHaveBeenCalledWith(IMPORT_ZIP_CONFIG_URL, TOKEN_MOCK, mockFormData);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call previewJsonConfigs with correct params', async () => {
    (utilityApi.importJsonConfigs as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await previewJsonConfigs(mockFormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.importJsonConfigs).toHaveBeenCalledWith(PREVIEW_IMPORT_CONFIG_URL, TOKEN_MOCK, mockFormData);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call previewZipConfig with correct params', async () => {
    (utilityApi.importZipConfig as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await previewZipConfig(mockFormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.importZipConfig).toHaveBeenCalledWith(PREVIEW_IMPORT_ZIP_CONFIG_URL, TOKEN_MOCK, mockFormData);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
