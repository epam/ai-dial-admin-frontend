import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, configFileApi, deploymentConfigurationApi } from '@/src/app/api/api';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeleteInterceptors,
  createInterceptor,
  getConfigFileInterceptor,
  getConfigFileInterceptors,
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

  test('Should call getConfigFileInterceptors action', async () => {
    (configFileApi.listNames as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getConfigFileInterceptors();

    expect(getUserToken).toHaveBeenCalled();
    expect(configFileApi.listNames).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Interceptors);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getConfigFileInterceptor action', async () => {
    (configFileApi.getEntity as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getConfigFileInterceptor('my-interceptor');

    expect(getUserToken).toHaveBeenCalled();
    expect(configFileApi.getEntity).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ConfigFileEntityType.Interceptors,
      'my-interceptor',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });
});

describe('Assets interceptor :: catalog metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);
  });

  test.each([
    ['create', (interceptor: any) => createInterceptor(interceptor)],
    ['update', (interceptor: any) => updateInterceptor(interceptor, 'etag')],
  ])('carries catalogSchemaId and catalogProperties through a %s', async (_label, action) => {
    await action({
      name: 'redactor',
      path: 'platform/redactor',
      folderId: 'platform/',
      catalogSchemaId: 'https://host/interceptor-card',
      catalogProperties: { tag: 'Featured' },
    });

    const [, , , body] = (assetApi.put as any).mock.calls[0];
    expect(body).toMatchObject({
      catalogSchemaId: 'https://host/interceptor-card',
      catalogProperties: { tag: 'Featured' },
    });
  });

  test('leaves an interceptor carrying no catalog metadata untouched', async () => {
    await updateInterceptor({ name: 'redactor', path: 'platform/redactor', folderId: 'platform/' }, 'etag');

    const [, , , body] = (assetApi.put as any).mock.calls[0];
    expect(body).not.toHaveProperty('catalogSchemaId');
    expect(body).not.toHaveProperty('catalogProperties');
  });
});
