import { reloadConfig, checkIsUniqueDeploymentName, getAppProcessStatus } from './actions';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { utilityApi } from '@/src/app/api/api';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

jest.mock('@/src/utils/auth/auth-request');
jest.mock('@/src/utils/env/get-auth-toggle');
jest.mock('@/src/app/api/api');

describe('utility server functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserToken as jest.Mock).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as jest.Mock).mockReturnValue(true);
  });

  it('reloadConfig should call utilityApi.reloadConfig with token', async () => {
    const mockResponse = { success: true };
    (utilityApi.reloadConfig as jest.Mock).mockResolvedValue(mockResponse);

    const result = await reloadConfig();

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.reloadConfig).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(mockResponse);
  });

  it('checkIsUniqueDeploymentName should return true when response is null', async () => {
    (utilityApi.checkDeploymentByName as jest.Mock).mockResolvedValue(null);

    const result = await checkIsUniqueDeploymentName('my-deployment');

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.checkDeploymentByName).toHaveBeenCalledWith('my-deployment', TOKEN_MOCK);
    expect(result).toBe(true);
  });

  it('checkIsUniqueDeploymentName should return false when response is not null', async () => {
    (utilityApi.checkDeploymentByName as jest.Mock).mockResolvedValue({ status: 200 });

    const result = await checkIsUniqueDeploymentName('existing-deployment');

    expect(result).toBe(false);
  });

  it('getAppProcessStatus should return status data', async () => {
    const mockStatus = { status: 'IDLE' };
    (utilityApi.getAppProcessStatus as jest.Mock).mockResolvedValue(mockStatus);

    const result = await getAppProcessStatus();

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getAppProcessStatus).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(mockStatus);
  });
});
