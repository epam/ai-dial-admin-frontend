import { beforeEach, describe, expect, test, vi } from 'vitest';

import { testSuitesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createTestSuite,
  getTestCase,
  getTestCases,
  getTestSuite,
  getTestSuites,
  removeTestSuite,
  updateTestSuite,
} from './actions';

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

  test('Should call getTestSuite action with undefined description', async () => {
    (testSuitesApi.getTestSuite as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getTestSuite('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestSuite).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestSuites action', async () => {
    (testSuitesApi.getTestSuites as any).mockResolvedValue([RESPONSE_MOCK]);
    const result = await getTestSuites(1, 10);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestSuites).toHaveBeenCalledWith(1, 10, TOKEN_MOCK);
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('Should call getTestCases action', async () => {
    (testSuitesApi.getTestCases as any).mockResolvedValue([RESPONSE_MOCK]);
    const result = await getTestCases('test', 1, 10);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestCases).toHaveBeenCalledWith('test', 1, 10, TOKEN_MOCK);
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('Should call getTestCase action', async () => {
    (testSuitesApi.getTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getTestCase('test', 'case');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestCase).toHaveBeenCalledWith('test', 'case', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestCase action with undefined test case id', async () => {
    (testSuitesApi.getTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getTestCase('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestCase).toHaveBeenCalledWith('test', void 0, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
