import { beforeEach, describe, expect, test, vi } from 'vitest';

import { testSuitesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createTestSuite,
  getDeployment,
  getDeployments,
  getRuns,
  getTestSuiteTemplateVariables,
  getTestCase,
  getTestCases,
  getTestSuite,
  getTestSuites,
  importTestCase,
  importTestCasePreview,
  removeTestCase,
  removeTestSuite,
  runTestSuite,
  tryOutTestSuite,
  updateTestCases,
  updateTestSuite,
  getTestCaseTemplateVariables,
  tryOutTestCase,
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
    const result = await updateTestSuite({ id: 'test', description: 'test' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.updateTestSuite).toHaveBeenCalledWith({ id: 'test', description: 'test' }, 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestSuite action with undefined description', async () => {
    (testSuitesApi.getTestSuite as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getTestSuite('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestSuite).toHaveBeenCalledWith('test', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestSuites action', async () => {
    (testSuitesApi.getTestSuites as any).mockResolvedValue([RESPONSE_MOCK]);
    const result = await getTestSuites(1, 10, [], []);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestSuites).toHaveBeenCalledWith(1, 10, [], [], TOKEN_MOCK);
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('Should call getRuns action', async () => {
    (testSuitesApi.getRuns as any).mockResolvedValue([RESPONSE_MOCK]);
    const result = await getRuns(1, 10, [], []);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getRuns).toHaveBeenCalledWith(1, 10, [], [], TOKEN_MOCK);
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('Should call runTestSuite action', async () => {
    (testSuitesApi.runTestSuite as any).mockResolvedValue([RESPONSE_MOCK]);
    const result = await runTestSuite('test', 1);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.runTestSuite).toHaveBeenCalledWith(TOKEN_MOCK, 'test', 1);
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('Should call getTestCases action', async () => {
    (testSuitesApi.getTestCases as any).mockResolvedValue([RESPONSE_MOCK]);
    const result = await getTestCases('test', 1, 10, [], []);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestCases).toHaveBeenCalledWith('test', 1, 10, [], [], TOKEN_MOCK);
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

  test('Should call getDeployments action ', async () => {
    (testSuitesApi.getDeployments as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getDeployments();
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getDeployments).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getDeployment action ', async () => {
    (testSuitesApi.getDeployment as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getDeployment('id', 'type');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getDeployment).toHaveBeenCalledWith('id', 'type', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call importTestCase action ', async () => {
    (testSuitesApi.importTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await importTestCase('id', new FormData());
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.importTestCase).toHaveBeenCalledWith('id', new FormData(), TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call importTestCasePreview action ', async () => {
    (testSuitesApi.importTestCasePreview as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await importTestCasePreview('id', new FormData());
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.importTestCasePreview).toHaveBeenCalledWith('id', new FormData(), TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeTestCase action ', async () => {
    (testSuitesApi.removeTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await removeTestCase('id', 'caseId');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.removeTestCase).toHaveBeenCalledWith('id', 'caseId', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateTestCases action ', async () => {
    (testSuitesApi.updateTestCases as any).mockResolvedValue(RESPONSE_MOCK);
    const testCases = [{ id: 'caseId' }];
    const result = await updateTestCases('id', testCases as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.updateTestCases).toHaveBeenCalledWith('id', testCases, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestSuiteTemplateVariables action ', async () => {
    (testSuitesApi.getTestSuiteTemplateVariables as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getTestSuiteTemplateVariables('id');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestSuiteTemplateVariables).toHaveBeenCalledWith('id', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestCaseTemplateVariables action ', async () => {
    (testSuitesApi.getTestCaseTemplateVariables as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getTestCaseTemplateVariables('id', 'caseId');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestCaseTemplateVariables).toHaveBeenCalledWith('id', 'caseId', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call tryOutTestSuite action ', async () => {
    (testSuitesApi.tryOutTestSuite as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await tryOutTestSuite('id', { variables: {} });
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.tryOutTestSuite).toHaveBeenCalledWith('id', { variables: {} }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call tryOutTestCase action ', async () => {
    (testSuitesApi.tryOutTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await tryOutTestCase('id', 'caseId');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.tryOutTestCase).toHaveBeenCalledWith('id', 'caseId', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
