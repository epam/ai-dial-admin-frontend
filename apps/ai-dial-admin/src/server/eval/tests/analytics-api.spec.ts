import { AnalyticsResult } from '@/src/models/evaluation/run';
import { FilterDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { ANALYTICS_RESULTS_URL, AnalyticsApi } from '../analytics-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: AnalyticsApi', () => {
  const instance = new AnalyticsApi({ host: TEST_URL });

  const mockResult: AnalyticsResult = {
    id: 'result-1',
  } as AnalyticsResult;

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should call getTestCaseRunResults with filters and return results', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: [RESPONSE_MOCK] }));

    const filters: FilterDto[] = [
      { column: 'status', operator: FilterOperatorDto.EQUALS, value: 'PASSED' },
      { column: 'name', operator: FilterOperatorDto.CONTAINS, value: 'smoke test' },
    ];

    await instance.getTestCaseRunResults(filters, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ANALYTICS_RESULTS_URL}?filter=status:eq:PASSED&filter=name:co:smoke%20test&computation=latest`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getTestCaseRunResults with empty filters', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: [] }));

    await instance.getTestCaseRunResults([], TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ANALYTICS_RESULTS_URL}?&computation=latest`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getTestCaseRunResultDetails by id and return result', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const resultId = mockResult.id as string;
    await instance.getTestCaseRunResultDetails(resultId, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ANALYTICS_RESULTS_URL}/${resultId}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
