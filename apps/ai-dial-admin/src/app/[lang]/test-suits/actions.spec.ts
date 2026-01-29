import { beforeEach, describe, expect, test, vi } from 'vitest';

import { testSuitsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { createSuit, removeSuit, updateTestSuit } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('TestSuits :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call removeSuit action', async () => {
    (testSuitsApi.removeTestSuit as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeSuit('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitsApi.removeTestSuit).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createSuit action', async () => {
    (testSuitsApi.createTestSuit as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createSuit({ id: 'aaa' });
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitsApi.createTestSuit).toHaveBeenCalledWith({ id: 'aaa' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateTestSuit action', async () => {
    (testSuitsApi.updateTestSuit as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateTestSuit({ id: 'test', description: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitsApi.updateTestSuit).toHaveBeenCalledWith({ id: 'test', description: 'test' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
