import { beforeEach, describe, expect, test, vi } from 'vitest';

import { utilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  checkIsUniqueDeploymentName,
  getAppProcessStatus,
  getCoreSyncStatus,
  getCoreVersions,
  setCoreVersion,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call checkIsUniqueDeploymentName action', async () => {
    (utilityApi.checkDeploymentByName as any).mockResolvedValue(null);

    const result = await checkIsUniqueDeploymentName('my-deployment');

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.checkDeploymentByName).toHaveBeenCalledWith('my-deployment', TOKEN_MOCK);
    expect(result).toBe(true);
  });

  test('Should call checkIsUniqueDeploymentName action and return false', async () => {
    (utilityApi.checkDeploymentByName as any).mockResolvedValue({ status: 200 });

    const result = await checkIsUniqueDeploymentName('existing-deployment');

    expect(result).toBe(false);
  });

  test('Should call getAppProcessStatus action', async () => {
    (utilityApi.getAppProcessStatus as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getAppProcessStatus();

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getAppProcessStatus).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getCoreVersions action', async () => {
    (utilityApi.getCoreVersion as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreVersions();

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getCoreVersion).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call setCoreVersion action', async () => {
    (utilityApi.setCoreVersion as any).mockResolvedValue(null);

    const result = await setCoreVersion('version');

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.setCoreVersion).toHaveBeenCalledWith({ coreConfigVersion: 'version' }, TOKEN_MOCK);
    expect(result).toBe(null);
  });

  test('Should call getCoreSyncStatus action', async () => {
    (utilityApi.getEntitySyncStatus as any).mockResolvedValue(null);

    const result = await getCoreSyncStatus('url', 'etag');

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getEntitySyncStatus).toHaveBeenCalledWith('url', TOKEN_MOCK, 'etag');
    expect(result).toBe(null);
  });
});
