import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import {
  DEPLOYMENTS_URL,
  TEST_CASES_URL,
  TEST_CASE_URL,
  TEST_SUITES_URL,
  TEST_SUITE_URL,
  TestSuitesApi,
} from '../test-suites-api';
import { TestSuite } from '@/src/models/evaluation/test-suite';

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

  test('Should calls getTestSuite by name and return testSuite', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));

    await instance.getTestSuite(mockTestSuite.id as string, TOKEN_MOCK);

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

    await instance.updateTestSuite({ ...mockTestSuite, id: void 0 }, TOKEN_MOCK);

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

    await instance.updateTestSuite(mockTestSuite, TOKEN_MOCK);

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
      `${TEST_URL}${TEST_CASES_URL('id')}?page=0&size=10&includeTotalCount=true`,
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
});
