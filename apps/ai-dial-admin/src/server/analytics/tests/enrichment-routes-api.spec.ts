import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { EnrichmentRoutesSettingDto } from '@/src/models/analytics/enrichment-routes';
import { ENRICHMENT_ROUTES_URL, EnrichmentRoutesApi } from '@/src/server/analytics/enrichment-routes-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

const ROUTES = [{ deployment: 'insights-app', route: 'insights' }];

const stored: EnrichmentRoutesSettingDto = {
  routes: ROUTES,
  updated_at: '2026-11-11T10:00:00Z',
  updated_by: 'admin',
};

const errorBody = (status: number, error: string, message: string) => ({
  status,
  body: JSON.stringify({ error, message }),
  ...JSON_HEADERS,
});

describe('Server :: EnrichmentRoutesApi', () => {
  const instance = new EnrichmentRoutesApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getRoutes issues GET v1/settings/app-routes and returns the stored pairs', async () => {
    fetch.mockResponseOnce(JSON.stringify(stored), JSON_HEADERS);

    const read = await instance.getRoutes(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${ENRICHMENT_ROUTES_URL}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(read).toEqual(expect.objectContaining({ success: true, response: ROUTES }));
  });

  test('getRoutes answers success with no list when none is stored', async () => {
    fetch.mockResponseOnce(() => errorBody(404, 'setting_not_found', 'The app-routes setting is not configured'));

    expect(await instance.getRoutes(TOKEN_MOCK)).toEqual({ success: true });
  });

  test('getRoutes reports a refused read as a failure', async () => {
    fetch.mockResponseOnce(() => errorBody(403, 'forbidden', 'Missing SETTINGS_READ'));

    const read = await instance.getRoutes(TOKEN_MOCK);

    expect(read.success).toBe(false);
    expect(read.response).toBeUndefined();
  });

  test('putRoutes sends the pairs alone and returns what the service stored', async () => {
    fetch.mockResponseOnce(JSON.stringify(stored), JSON_HEADERS);

    const write = await instance.putRoutes(ROUTES, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/${ENRICHMENT_ROUTES_URL}`),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ routes: ROUTES }) }),
    );
    expect(write).toEqual(expect.objectContaining({ success: true, response: ROUTES }));
  });

  test('putRoutes passes the service message through when a pair is still in use', async () => {
    const message = 'app-routes drops a pair an enabled pipeline calls: nightly-insights';
    fetch.mockResponseOnce(() => errorBody(409, 'app_route_in_use', message));

    const write = await instance.putRoutes([], TOKEN_MOCK);

    expect(write.success).toBe(false);
    expect(write.status).toBe(409);
    expect(write.errorMessage).toContain(message);
  });
});
