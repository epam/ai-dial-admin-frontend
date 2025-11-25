import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { rolesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { createRole, removeRole, updateRole, getCoreRole, updateCoreRole } from './actions';

const fetch = createFetchMock(vi);
vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Roles :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getCoreRole action', async () => {
    (rolesApi.getCoreRole as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreRole('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(rolesApi.getCoreRole).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeRole action', async () => {
    (rolesApi.removeRole as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeRole('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(rolesApi.removeRole).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createRole action', async () => {
    (rolesApi.createRole as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createRole({ name: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(rolesApi.createRole).toHaveBeenCalledWith({ name: 'test' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateRole action', async () => {
    (rolesApi.updateRole as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateRole({ name: 'test' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(rolesApi.updateRole).toHaveBeenCalledWith({ name: 'test' }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateCoreRole action', async () => {
    (rolesApi.updateCoreRole as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateCoreRole({ name: 'test' }, 'test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(rolesApi.updateCoreRole).toHaveBeenCalledWith({ name: 'test' }, 'test', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
