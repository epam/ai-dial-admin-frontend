import { beforeEach, describe, expect, test, vi } from 'vitest';

import { testSuitesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createTestCase,
  createTestSuite,
  deleteTestSuiteMetric,
  getDeployment,
  getDeployments,
  getMetricDeclarations,
  getMetricLatestVersion,
  getRuns,
  getTestSuiteMetricDetails,
  getTestSuiteMetricDetailsWithSchema,
  getTestSuiteMetrics,
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
  createTestSuiteMetric,
  updateTestSuiteMetric,
} from './actions';
import { TestCaseConflictStrategy, TestCaseImportMode } from '../../../types/evaluation';

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
    const result = await importTestCase('id', new FormData(), TestCaseImportMode.MERGE, TestCaseConflictStrategy.SKIP);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.importTestCase).toHaveBeenCalledWith(
      'id',
      new FormData(),
      TOKEN_MOCK,
      TestCaseImportMode.MERGE,
      TestCaseConflictStrategy.SKIP,
    );
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

  test('Should call createTestCase action', async () => {
    (testSuitesApi.createTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const body = { testCaseName: 'Case', data: [] };
    const result = await createTestCase('suite-id', body as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.createTestCase).toHaveBeenCalledWith('suite-id', body, TOKEN_MOCK, undefined);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createTestCase action with includeWarnings', async () => {
    (testSuitesApi.createTestCase as any).mockResolvedValue(RESPONSE_MOCK);
    const body = { testCaseName: 'Case', data: [] };
    const result = await createTestCase('suite-id', body as any, true);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.createTestCase).toHaveBeenCalledWith('suite-id', body, TOKEN_MOCK, true);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getMetricDeclarations action', async () => {
    (testSuitesApi.getMetricDeclarations as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getMetricDeclarations(0, 10);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getMetricDeclarations).toHaveBeenCalledWith(0, 10, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getMetricLatestVersion action', async () => {
    (testSuitesApi.getMetricLatestVersion as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getMetricLatestVersion('metric-id');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getMetricLatestVersion).toHaveBeenCalledWith('metric-id', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestSuiteMetrics action', async () => {
    (testSuitesApi.getTestSuiteMetrics as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getTestSuiteMetrics('suite-id', 0, 10);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestSuiteMetrics).toHaveBeenCalledWith('suite-id', 0, 10, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestSuiteMetricDetails action', async () => {
    (testSuitesApi.getTestSuiteMetricDetails as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getTestSuiteMetricDetails('suite-id', 'metric-id');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestSuiteMetricDetails).toHaveBeenCalledWith('suite-id', 'metric-id', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTestSuiteMetricDetailsWithSchema action', async () => {
    (testSuitesApi.getTestSuiteMetricDetailsWithSchema as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getTestSuiteMetricDetailsWithSchema('suite-id', 'metric-id');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.getTestSuiteMetricDetailsWithSchema).toHaveBeenCalledWith(
      'suite-id',
      'metric-id',
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createTestSuiteMetric action', async () => {
    (testSuitesApi.createTestSuiteMetric as any).mockResolvedValue(RESPONSE_MOCK);
    const metric = { name: 'My Metric', metricDeclarationId: 'decl-id' };
    const result = await createTestSuiteMetric('suite-id', metric as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.createTestSuiteMetric).toHaveBeenCalledWith('suite-id', metric, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateTestSuiteMetric action', async () => {
    (testSuitesApi.updateTestSuiteMetric as any).mockResolvedValue(RESPONSE_MOCK);
    const metric = { id: 'metric-id', name: 'Updated Metric' };
    const result = await updateTestSuiteMetric('suite-id', metric as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.updateTestSuiteMetric).toHaveBeenCalledWith('suite-id', metric, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call deleteTestSuiteMetric action', async () => {
    (testSuitesApi.deleteTestSuiteMetric as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await deleteTestSuiteMetric('suite-id', 'metric-id');
    expect(getUserToken).toHaveBeenCalled();
    expect(testSuitesApi.deleteTestSuiteMetric).toHaveBeenCalledWith('suite-id', 'metric-id', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
