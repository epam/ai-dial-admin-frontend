import { Metric } from '@/src/models/evaluation/metric';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { METRICS_URL, METRIC_URL, MetricsApi } from '../metrics-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: MetricsApi', () => {
  const instance = new MetricsApi({ host: TEST_URL });

  const mockMetric: Metric = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'tess',
    description: 'Test',
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getMetrics and return list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockMetric]));

    await instance.getMetrics(1, 10, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${METRICS_URL}?page=1&size=10&includeTotalCount=true`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls getMetric by name and return metric', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockMetric));

    await instance.getMetric(mockMetric.id as string, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${METRIC_URL(mockMetric.id as string)}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
