import { utilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { checkIsUniqueDeploymentName, getAppProcessStatus, reloadConfig } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserToken.mockResolvedValue(TOKEN_MOCK);
    getIsEnableAuthToggle.mockReturnValue(true);
  });

  test('reloadConfig should call utilityApi.reloadConfig with token', async () => {
    const mockResponse = { success: true };
    utilityApi.reloadConfig.mockResolvedValue(mockResponse);

    const result = await reloadConfig();

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.reloadConfig).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(mockResponse);
  });

  test('checkIsUniqueDeploymentName should return true when response is null', async () => {
    utilityApi.checkDeploymentByName.mockResolvedValue(null);

    const result = await checkIsUniqueDeploymentName('my-deployment');

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.checkDeploymentByName).toHaveBeenCalledWith('my-deployment', TOKEN_MOCK);
    expect(result).toBe(true);
  });

  test('checkIsUniqueDeploymentName should return false when response is not null', async () => {
    utilityApi.checkDeploymentByName.mockResolvedValue({ status: 200 });

    const result = await checkIsUniqueDeploymentName('existing-deployment');

    expect(result).toBe(false);
  });

  test('getAppProcessStatus should return status data', async () => {
    const mockStatus = { status: 'IDLE' };
    utilityApi.getAppProcessStatus.mockResolvedValue(mockStatus);

    const result = await getAppProcessStatus();

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getAppProcessStatus).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(mockStatus);
  });
});
