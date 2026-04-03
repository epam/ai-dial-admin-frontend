import { TestSuite } from '@/src/models/evaluation/test-suite';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import {
  DEPLOYMENTS_URL,
  METRIC_DECLARATIONS_URL,
  TEST_CASES_URL,
  TEST_CASE_TEMPLATE_VARIABLES_URL,
  TEST_CASE_TRY_OUT_URL,
  TEST_CASE_URL,
  TEST_SUITES_RUNS_URL,
  TEST_SUITES_URL,
  TEST_SUITE_METRICS_URL,
  TEST_SUITE_RUN_URL,
  TEST_SUITE_TEMPLATE_VARIABLES_URL,
  TEST_SUITE_TRY_OUT_URL,
  TEST_SUITE_URL,
  TestSuitesApi,
} from '../test-suites-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: TestSuiteApi', () => {
  const instance = new TestSuitesApi({ host: TEST_URL });

  const mockTestSuite: TestSuite = {
    id: 'tess',
    description: 'Test',
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getTestSuites and return list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockTestSuite]));

    await instance.getTestSuites(0, 10, [], [], TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITES_URL}?page=0&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls getRuns and return list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockTestSuite]));

    await instance.getRuns(0, 10, [], [], TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITES_RUNS_URL}?page=0&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls runTestSuite and return list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockTestSuite]));

    await instance.runTestSuite(TOKEN_MOCK, 'id', 1);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_RUN_URL('id')}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('Should calls getTestSuite by name and return testSuite', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));

    await instance.getTestSuite(mockTestSuite.id as string, 'etag', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL(mockTestSuite.id)}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls createTestSuite with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createTestSuite(mockTestSuite, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITES_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockTestSuite),
      }),
    );
  });

  test('Should calls updateTestSuite with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateTestSuite({ ...mockTestSuite, id: void 0 }, 'etag', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL()}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...mockTestSuite, id: void 0 }),
      }),
    );
  });

  test('Should calls updateTestSuite with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateTestSuite(mockTestSuite, 'etag', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL(mockTestSuite.id)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockTestSuite),
      }),
    );
  });

  test('Should calls removeTestSuite with DELETE method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeTestSuite(mockTestSuite.id || '', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL(mockTestSuite.id)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should calls getTestCases', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockTestSuite]));
    await instance.getTestCases('id', 0, 10, [], [], TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASES_URL('id')}?page=0&size=10&includeTotalCount=true&includeWarnings=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls getTestCase', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.getTestCase('id', 'testCaseId', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASE_URL('id', 'testCaseId')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls getTestCase', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.getTestCase('id', void 0 as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASE_URL('id', '')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getDeployments', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.getDeployments(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${DEPLOYMENTS_URL}`, expect.objectContaining({ method: 'GET' }));
  });

  test('Should call getDeployment', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.getDeployment('id', 'type', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DEPLOYMENTS_URL}/type/id`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call importTestCase', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.importTestCase(
      'id',
      new FormData(),
      TOKEN_MOCK,
      TestCaseImportMode.OVERRIDE,
      TestCaseConflictStrategy.FAIL,
    );
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASES_URL('id')}/import?importMode=OVERRIDE&conflictStrategy=FAIL`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('Should call importTestCasePreview', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.importTestCasePreview('id', new FormData(), TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASES_URL('id')}/import/preview`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('Should call removeTestCase', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.removeTestCase('id', 'caseId', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASE_URL('id', 'caseId')}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should call createTestCase without includeWarnings', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const testCasePayload = { testCaseName: 'Case Name', data: [] };

    await instance.createTestCase('id', testCasePayload as any, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASES_URL('id')}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(testCasePayload),
      }),
    );
  });

  test('Should call createTestCase with includeWarnings', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const testCasePayload = { testCaseName: 'Case Name', data: [] };

    await instance.createTestCase('id', testCasePayload as any, TOKEN_MOCK, true);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASES_URL('id')}?includeWarnings=true`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(testCasePayload),
      }),
    );
  });

  test('Should call updateTestCases', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const testCases = [{ id: 'caseId', name: 'Case Name' }];

    await instance.updateTestCases('id', testCases as any, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASES_URL('id')}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(testCases),
      }),
    );
  });

  test('Should call exportTestCasesCsv', async () => {
    const streamResponse = new Response(null, { status: 200 });
    const streamSpy = vi.spyOn(instance as any, 'streamRequest').mockResolvedValue(streamResponse);

    const result = await instance.exportTestCasesCsv('suite-id', TOKEN_MOCK);

    expect(streamSpy).toHaveBeenCalledWith(
      `${TEST_CASES_URL('suite-id')}/export.csv`,
      'test_suite_suite-id_export.csv',
      TOKEN_MOCK,
    );
    expect(result).toBe(streamResponse);
  });

  test('Should call getTestSuiteTemplateVariables', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.getTestSuiteTemplateVariables('id', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_TEMPLATE_VARIABLES_URL('id')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getTestCaseTemplateVariables', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.getTestCaseTemplateVariables('id', 'caseId', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASE_TEMPLATE_VARIABLES_URL('id', 'caseId')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call tryOutTestSuite', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.tryOutTestSuite('id', { variables: {} }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_TRY_OUT_URL('id')}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('Should call tryOutTestCase', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.tryOutTestCase('id', 'caseId', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_CASE_TRY_OUT_URL('id', 'caseId')}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('Should call getMetricDeclarations', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: [], totalElements: 0 }));
    await instance.getMetricDeclarations(0, 10, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${METRIC_DECLARATIONS_URL}?page=0&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getMetricLatestVersion', async () => {
    fetch.mockResponseOnce(JSON.stringify({ id: 'metric-id' }));
    await instance.getMetricLatestVersion('metric-id', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${METRIC_DECLARATIONS_URL}/metric-id/latest`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getTestSuiteMetrics', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: [], totalElements: 0 }));
    await instance.getTestSuiteMetrics('suite-id', 0, 10, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_METRICS_URL('suite-id')}?page=0&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getTestSuiteMetricDetails', async () => {
    fetch.mockResponseOnce(JSON.stringify({ id: 'metric-id' }));
    await instance.getTestSuiteMetricDetails('suite-id', 'metric-id', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_METRICS_URL('suite-id')}/metric-id`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getTestSuiteMetricDetailsWithSchema', async () => {
    fetch.mockResponseOnce(JSON.stringify({ id: 'metric-id' }));
    await instance.getTestSuiteMetricDetailsWithSchema('suite-id', 'metric-id', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_METRICS_URL('suite-id')}/metric-id/aggregated`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call createTestSuiteMetric', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const metric = { name: 'My Metric', metricDeclarationId: 'decl-id' };
    await instance.createTestSuiteMetric('suite-id', metric as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_METRICS_URL('suite-id')}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(metric),
      }),
    );
  });

  test('Should call updateTestSuiteMetric', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const metric = { id: 'metric-id', name: 'Updated Metric' };
    await instance.updateTestSuiteMetric('suite-id', metric as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_METRICS_URL('suite-id')}/metric-id`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(metric),
      }),
    );
  });

  test('Should call deleteTestSuiteMetric', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    await instance.deleteTestSuiteMetric('suite-id', 'metric-id', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_METRICS_URL('suite-id')}/metric-id`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should call getTestSuiteFiles', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockTestSuite]));
    await instance.getTestSuiteFiles('id', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL('id')}/files`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call uploadTestSuiteFiles', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    await instance.uploadTestSuiteFiles('id', new FormData(), TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL('id')}/files`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('Should call removeTestSuiteFile', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    await instance.removeTestSuiteFile('id', 'fileName', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL('id')}/files/fileName`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should call duplicateTestSuite', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    const body = { name: 'Cloned Suite' };
    await instance.duplicateTestSuite('id', body as any, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITES_URL}/id/clone`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  });
});
