import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { TelemetryApi } from '../telemetry-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: TelemetryApi', () => {
  const instance = new TelemetryApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('should fetch backend version', async () => {
    fetch.mockResponseOnce('1.2.3');

    await instance.getDashboardData(
      { $type: 'json', query: { expressions: ['_time'], from: 'analytics' } },
      TOKEN_MOCK,
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/metrics/datasets/dial_analytics_realtime/data'),
      expect.anything(),
    );
  });

  test('should serialize limit and offset into the request body when set', async () => {
    fetch.mockResponseOnce(JSON.stringify({ headers: [], data: [] }));

    const query = {
      $type: 'json',
      query: {
        expressions: ['_time'],
        from: 'analytics',
        limit: 100,
        offset: 200,
      },
    };
    await instance.getDashboardData(query, TOKEN_MOCK);

    const [, init] = fetch.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.query.limit).toBe(100);
    expect(body.query.offset).toBe(200);
  });

  test('should omit limit and offset when not set on the query', async () => {
    fetch.mockResponseOnce(JSON.stringify({ headers: [], data: [] }));

    const query = {
      $type: 'json',
      query: { expressions: ['_time'], from: 'analytics' },
    };
    await instance.getDashboardData(query, TOKEN_MOCK);

    const [, init] = fetch.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.query).not.toHaveProperty('limit');
    expect(body.query).not.toHaveProperty('offset');
  });

  test('should call getDatasets', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));

    await instance.getDatasets(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/metrics/datasets'),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
