import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { TEST_SUITES_URL, TEST_SUITE_URL, TestSuitesApi } from '../test-suites-api';
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

    const result = await instance.getTestSuites(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${TEST_SUITES_URL}`, expect.objectContaining({ method: 'GET' }));
  });

  test('Should calls getTestSuite by name and return testSuite', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTestSuite));

    const result = await instance.getTestSuite(mockTestSuite.id as string, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL(mockTestSuite.id)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockTestSuite));
  });

  test('Should calls createTestSuite with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createTestSuite(mockTestSuite, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL(mockTestSuite.id)}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockTestSuite),
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

    await instance.removeTestSuite(mockTestSuite.id, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TEST_SUITE_URL(mockTestSuite.id)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
