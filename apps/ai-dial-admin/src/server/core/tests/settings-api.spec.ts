import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { SettingsApi } from '../settings-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: SettingsApi', () => {
  const instance = new SettingsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('globalSettings calls the Core global-settings singleton, not the admin-BE api/ path', async () => {
    fetch.mockResponseOnce(JSON.stringify({ globalInterceptors: ['global'] }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.globalSettings(TOKEN_MOCK);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/settings/platform/global');
    expect(calledUrl).not.toContain('/api/');
    expect(result.response).toEqual({ globalInterceptors: ['global'] });
  });

  test('getSystemProperties reads the same singleton, conditional on the given etag', async () => {
    fetch.mockResponseOnce(JSON.stringify({ globalInterceptors: ['global'] }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.getSystemProperties(TOKEN_MOCK, 'etag');

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/settings/platform/global');
    expect(result.response).toEqual({ globalInterceptors: ['global'] });
  });

  test('updateSystemProperties PUTs to the same singleton', async () => {
    fetch.mockResponseOnce(JSON.stringify({ globalInterceptors: ['global'] }));

    const result = await instance.updateSystemProperties({ globalInterceptors: ['global'] }, TOKEN_MOCK, 'etag');

    const [calledUrl, options] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/settings/platform/global');
    expect(options?.method).toBe('PUT');
    expect(result.success).toBe(true);
  });
});
