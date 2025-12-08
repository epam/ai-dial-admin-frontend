import { beforeEach, describe, expect, test, vi } from 'vitest';

import { interceptorsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createInterceptor,
  getConfigurationSchema,
  getCoreInterceptor,
  getInterceptorsList,
  removeInterceptor,
  updateCoreInterceptor,
  updateInterceptor,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Interceptors :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getCoreInterceptor action', async () => {
    (interceptorsApi.getCoreInterceptor as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreInterceptor('interceptor');
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorsApi.getCoreInterceptor).toHaveBeenCalledWith('interceptor', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getInterceptorsList action', async () => {
    (interceptorsApi.getInterceptorsList as any).mockResolvedValue(RESPONSE_MOCK);

    await getInterceptorsList();
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorsApi.getInterceptorsListAction).toHaveBeenCalledWith(TOKEN_MOCK);
  });

  test('Should call removeInterceptor action', async () => {
    (interceptorsApi.removeInterceptor as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeInterceptor('interceptor');
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorsApi.removeInterceptor).toHaveBeenCalledWith(TOKEN_MOCK, 'interceptor');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createInterceptor action', async () => {
    (interceptorsApi.createInterceptor as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createInterceptor({ name: 'interceptor' });
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorsApi.createInterceptor).toHaveBeenCalledWith({ name: 'interceptor' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateCoreInterceptor action', async () => {
    (interceptorsApi.updateCoreInterceptor as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateCoreInterceptor({}, 'interceptor', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorsApi.updateCoreInterceptor).toHaveBeenCalledWith({}, 'interceptor', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateInterceptor action', async () => {
    (interceptorsApi.updateInterceptor as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateInterceptor({}, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorsApi.updateInterceptor).toHaveBeenCalledWith({ defaults: {} }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateInterceptor action', async () => {
    (interceptorsApi.updateInterceptor as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateInterceptor({ defaultsTemp: [{ key: 'key', type: 'type', value: 'value' }] }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorsApi.updateInterceptor).toHaveBeenCalledWith({ defaults: { key: 'value' } }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getConfigurationSchema action', async () => {
    (interceptorsApi.getConfigurationSchema as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getConfigurationSchema('name');
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorsApi.getConfigurationSchema).toHaveBeenCalledWith('name', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
