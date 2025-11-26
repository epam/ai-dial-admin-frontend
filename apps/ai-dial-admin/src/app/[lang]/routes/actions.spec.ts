import { beforeEach, describe, expect, test, vi } from 'vitest';

import { routesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { createRoute, getCoreRoute, removeRoute, updateCoreRoute, updateRoute } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Routes :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });
  test('Should call getCoreRoute action', async () => {
    (routesApi.getCoreRoute as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreRoute('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(routesApi.getCoreRoute).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeRoute action', async () => {
    (routesApi.removeRoute as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeRoute('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(routesApi.removeRoute).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createRoute action', async () => {
    (routesApi.createRoute as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createRoute({ name: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(routesApi.createRoute).toHaveBeenCalledWith({ name: 'test' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateRoute action', async () => {
    (routesApi.updateRoute as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateRoute({ name: 'test' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(routesApi.updateRoute).toHaveBeenCalledWith({ name: 'test' }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateCoreRoute action', async () => {
    (routesApi.updateCoreRoute as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateCoreRoute({ name: 'test' }, 'test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(routesApi.updateCoreRoute).toHaveBeenCalledWith({ name: 'test' }, 'test', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
