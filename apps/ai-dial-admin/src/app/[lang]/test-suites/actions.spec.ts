import { beforeEach, describe, expect, test, vi } from 'vitest';

import { testSuitesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { createTestSuite, removeTestSuite, updateTestSuite } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('TestSuites :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call removeTestSuite action', async () => {
    (testSuitesApi.removeTestSuite as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeTestSuite('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.removeTestSuite).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createTestSuite action', async () => {
    (testSuitesApi.createTestSuite as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createTestSuite({ id: 'aaa' });
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.createTestSuite).toHaveBeenCalledWith({ id: 'aaa' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateTestSuite action', async () => {
    (testSuitesApi.updateTestSuite as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await updateTestSuite({ id: 'test', description: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.updateTestSuite).toHaveBeenCalledWith({ id: 'test', description: 'test' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
