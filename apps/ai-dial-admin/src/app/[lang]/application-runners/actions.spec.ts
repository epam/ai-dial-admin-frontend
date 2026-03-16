import { beforeEach, describe, expect, test, vi } from 'vitest';

import { applicationRunnersApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createApplicationScheme,
  getApplicationScheme,
  getCoreRunner,
  getResolvedApplicationScheme,
  removeApplicationScheme,
  updateApplicationScheme,
  updateCoreRunner,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Applications schemes :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getCoreRunner action', async () => {
    (applicationRunnersApi.getCoreRunner as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreRunner('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.getCoreRunner).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeApplicationScheme action', async () => {
    (applicationRunnersApi.removeApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeApplicationScheme('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.removeApplicationScheme).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createApplicationScheme action', async () => {
    (applicationRunnersApi.createApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createApplicationScheme({ $id: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.createApplicationScheme).toHaveBeenCalledWith({ $id: 'test' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateApplicationScheme action', async () => {
    (applicationRunnersApi.updateApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateApplicationScheme({ $id: 'test' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.updateApplicationScheme).toHaveBeenCalledWith({ $id: 'test' }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateCoreRunner action', async () => {
    (applicationRunnersApi.updateCoreRunner as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateCoreRunner({ $id: 'test' }, 'test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.updateCoreRunner).toHaveBeenCalledWith({ $id: 'test' }, 'test', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getApplicationScheme action', async () => {
    (applicationRunnersApi.getApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getApplicationScheme('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.getApplicationScheme).toHaveBeenCalledWith('test', TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getResolvedApplicationScheme action', async () => {
    (applicationRunnersApi.getResolvedApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getResolvedApplicationScheme('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.getResolvedApplicationScheme).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
