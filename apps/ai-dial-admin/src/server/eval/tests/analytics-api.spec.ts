import { AnalyticsResult } from '@/src/models/evaluation/run';
import { FilterDto } from '@/src/models/request';
import { FilterOperatorDto } from '@/src/types/request';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import {
  ANALYTICS_HEALTH_DISTRIBUTION_URL,
  ANALYTICS_METRIC_SCORES_COMPARISON_URL,
  ANALYTICS_RESULTS_URL,
  ANALYTICS_RUN_METRIC_SNAPSHOTS_URL,
  ANALYTICS_RUN_TRENDS_URL,
  AnalyticsApi,
} from '../analytics-api';

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
      `${TEST_URL}${ANALYTICS_RESULTS_URL}?filter=status:eq:PASSED&filter=name:co:smoke%20test&computation=latest&size=1000`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getTestCaseRunResults with empty filters', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: [] }));

    await instance.getTestCaseRunResults([], TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ANALYTICS_RESULTS_URL}?&computation=latest&size=1000`,
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

  test('Should call getMetricSnapshots with filters and build correct URL', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));

    const filters: FilterDto[] = [{ column: 'runId', operator: FilterOperatorDto.EQUALS, value: 'run-1' }];

    await instance.getMetricSnapshots(filters, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ANALYTICS_RUN_METRIC_SNAPSHOTS_URL}?filter=runId:eq:run-1`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getMetricSnapshots with empty filters', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));

    await instance.getMetricSnapshots([], TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ANALYTICS_RUN_METRIC_SNAPSHOTS_URL}?`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getMetricScoresComparison with both run ids', async () => {
    fetch.mockResponseOnce(JSON.stringify({ runs: [] }));

    await instance.getMetricScoresComparison(['run-a', 'run-b'], TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ANALYTICS_METRIC_SCORES_COMPARISON_URL}?runIds=run-a%2Crun-b`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should call getRunTrends with the page and size and return the page', async () => {
    const page = { content: [], page: 2, size: 10, totalElements: 0, totalPages: 0 };
    fetch.mockResponseOnce(JSON.stringify(page), { headers: { 'content-type': 'application/json' } });

    const result = await instance.getRunTrends(2, 10, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ANALYTICS_RUN_TRENDS_URL}?page=2&size=10`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(page);
  });

  test('Should return null from getRunTrends when the request fails', async () => {
    fetch.mockResponseOnce('', { status: 500 });

    expect(await instance.getRunTrends(0, 10, TOKEN_MOCK)).toBeNull();
  });

  test('Should call getHealthDistribution with the weeks and threshold and return the body', async () => {
    const body = {
      threshold: 0.75,
      weeks: [{ weekStart: 1762128000000, healthyCount: 3, failingCount: 1, suiteCount: 4 }],
    };
    fetch.mockResponseOnce(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

    const result = await instance.getHealthDistribution(5, 0.75, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${ANALYTICS_HEALTH_DISTRIBUTION_URL}?weeks=5&threshold=0.75`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(body);
  });

  test('Should return null from getHealthDistribution when the request fails', async () => {
    fetch.mockResponseOnce('', { status: 500 });

    expect(await instance.getHealthDistribution(5, 0.75, TOKEN_MOCK)).toBeNull();
  });
});
