import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, deploymentConfigurationApi } from '@/src/app/api/api';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeleteInterceptors,
  createInterceptor,
  getInterceptor,
  getInterceptorConfigurationSchema,
  getInterceptors,
  removeInterceptor,
  updateInterceptor,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets interceptor :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getInterceptors action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getInterceptors('platform/');

    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.INTERCEPTOR, 'platform/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getInterceptor action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getInterceptor('platform/redactor', 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.INTERCEPTOR,
      'platform/redactor',
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createInterceptor action, stripping read-only projections', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createInterceptor({
      name: 'redactor',
      path: 'platform/redactor',
      folderId: 'platform/',
      status: DialModelResourceStatus.Valid,
      displayName: 'Redactor',
    });

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.INTERCEPTOR, 'redactor', {
      name: 'redactor',
      displayName: 'Redactor',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createInterceptor propagates a Core rejection unchanged', async () => {
    const rejection = { success: false, errorHeader: 'Bad Request', errorMessage: 'displayName is required' };
    (assetApi.put as any).mockResolvedValue(rejection);

    const result = await createInterceptor({ name: 'redactor', path: 'platform/redactor', folderId: 'platform/' });

    expect(result).toBe(rejection);
  });

  test('Should call updateInterceptor action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateInterceptor(
      { name: 'redactor', path: 'platform/redactor', folderId: 'platform/' },
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.INTERCEPTOR,
      'redactor',
      { name: 'redactor' },
      { etag: 'etag' },
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeInterceptor action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeInterceptor('platform/redactor', 'etag');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.INTERCEPTOR, 'platform/redactor', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getInterceptorConfigurationSchema action against Core, not the admin backend', async () => {
    (deploymentConfigurationApi.getConfigurationSchema as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getInterceptorConfigurationSchema('redactor');

    expect(deploymentConfigurationApi.getConfigurationSchema).toHaveBeenCalledWith(TOKEN_MOCK, 'redactor');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeleteInterceptors action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteInterceptors([{ path: 'platform/redactor' }]);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.INTERCEPTOR, 'platform/redactor');
    expect(result).toEqual({ success: true });
  });
});
