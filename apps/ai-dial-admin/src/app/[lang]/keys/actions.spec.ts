import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createKey, removeKey, updateKey, getCoreKey, updateCoreKey } from './actions';
import { keysApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Keys :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getCoreKey action', async () => {
    (keysApi.getCoreKey as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreKey('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(keysApi.getCoreKey).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeKey action', async () => {
    (keysApi.removeKey as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeKey('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(keysApi.removeKey).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createKey action', async () => {
    (keysApi.createKey as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createKey({ name: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(keysApi.createKey).toHaveBeenCalledWith({ name: 'test' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateKey action', async () => {
    (keysApi.updateKey as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateKey({ key: 'key', project: 'project', secured: false }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(keysApi.updateKey).toHaveBeenCalledWith(
      { key: 'key', project: 'project', secured: false },
      TOKEN_MOCK,
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateCoreKey action', async () => {
    (keysApi.updateCoreKey as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateCoreKey({ key: 'key', project: 'project', secured: false }, 'test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(keysApi.updateCoreKey).toHaveBeenCalledWith(
      { key: 'key', project: 'project', secured: false },
      'test',
      'etag',
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });
});
