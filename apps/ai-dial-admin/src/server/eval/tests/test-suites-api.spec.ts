import { DeploymentType } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import {
  DEPLOYMENTS_URL,
  DEPLOYMENT_TOOLS_URL,
  METRIC_DECLARATIONS_URL,
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

  test('Should calls updateTestSuite with id payload', async () => {
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

  test('Should call getDeployments', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.getDeployments(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${DEPLOYMENTS_URL}`, expect.objectContaining({ method: 'GET' }));
  });

  test('Should call getDeployments with type and interface filter', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getDeployments(TOKEN_MOCK, DeploymentType.Application, 'mcp');
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DEPLOYMENTS_URL}?type=dial-application&interface=mcp`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getDeploymentTools', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getDeploymentTools('deploy-1', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DEPLOYMENT_TOOLS_URL('deploy-1')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getDeployment', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.getDeployment('id', 'type', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DEPLOYMENTS_URL}/type/id`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getTestSuiteTemplateVariables', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));
    await instance.getTestSuiteTemplateVariables('id', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_TEMPLATE_VARIABLES_URL('id')}`,
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
