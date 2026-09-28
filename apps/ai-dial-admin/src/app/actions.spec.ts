import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { coreUtilityApi, interceptorsApi, utilityApi } from '@/src/app/api/api';
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
    (coreUtilityApi.checkDeploymentByName as any).mockResolvedValue(null);
    (interceptorsApi.checkInterceptorByName as any).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('Should call both deployment and interceptor endpoints for unique name check', async () => {
    const result = await checkIsUniqueDeploymentName('my-id');

    expect(getUserToken).toHaveBeenCalled();
    expect(coreUtilityApi.checkDeploymentByName).toHaveBeenCalledWith('my-id', TOKEN_MOCK);
    expect(interceptorsApi.checkInterceptorByName).toHaveBeenCalledWith('my-id', TOKEN_MOCK);
    expect(result).toBe(true);
  });

  test('Should return false when deployment already exists', async () => {
    (coreUtilityApi.checkDeploymentByName as any).mockResolvedValue({ status: 200 });

    const result = await checkIsUniqueDeploymentName('existing-id');

    expect(result).toBe(false);
  });

  test('Should return false when interceptor already exists', async () => {
    (interceptorsApi.checkInterceptorByName as any).mockResolvedValue({ status: 200 });

    const result = await checkIsUniqueDeploymentName('existing-id');

    expect(result).toBe(false);
  });

  test('Should return false when both deployment and interceptor already exist', async () => {
    (coreUtilityApi.checkDeploymentByName as any).mockResolvedValue({ status: 200 });
    (interceptorsApi.checkInterceptorByName as any).mockResolvedValue({ status: 200 });

    const result = await checkIsUniqueDeploymentName('existing-id');

    expect(result).toBe(false);
  });

  test('Should call getAppProcessStatus action', async () => {
    (utilityApi.getAppProcessStatus as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getAppProcessStatus();

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getAppProcessStatus).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call the Admin API for Core versions when it is configured', async () => {
    const response = { success: true, response: { defaultVersion: '1.0.0' } };
    vi.stubEnv('DIAL_ADMIN_API_URL', 'http://admin-api');
    (utilityApi.getCoreVersion as any).mockResolvedValue(response);

    const result = await getCoreVersions();

    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getCoreVersion).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(coreUtilityApi.getCoreVersion).not.toHaveBeenCalled();
    expect(result).toBe(response);
  });

  test('Should return the direct Core version as auto-detected when the Admin API is disabled', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', '');
    (coreUtilityApi.getCoreVersion as any).mockResolvedValue('1.2.3');

    const result = await getCoreVersions();

    expect(getUserToken).toHaveBeenCalled();
    expect(coreUtilityApi.getCoreVersion).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(utilityApi.getCoreVersion).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, response: { autoDetectedVersion: '1.2.3' } });
  });

  test('Should return an empty Core version response when direct Core version is unavailable', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', '');
    (coreUtilityApi.getCoreVersion as any).mockResolvedValue(null);

    const result = await getCoreVersions();

    expect(result).toEqual({ success: true, response: {} });
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
