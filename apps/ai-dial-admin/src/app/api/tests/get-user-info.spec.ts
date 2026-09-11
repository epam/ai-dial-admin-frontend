import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

describe('Server :: api :: getUserInfo', () => {
  beforeEach(() => {
    fetch.resetMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('calls the admin backend security-info endpoint when DIAL_ADMIN_API_URL is set', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'http://admin-be');
    fetch.mockResponseOnce(JSON.stringify({ userInfo: { id: '1', email: 'a@b.com', roles: [] } }), JSON_HEADERS);

    const { getUserInfo } = await import('@/src/app/api/api');
    await getUserInfo(TOKEN_MOCK);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/api/v1/security-info');
  });

  test('calls DIAL Core directly when DIAL_ADMIN_API_URL is not set', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', '');
    vi.stubEnv('DIAL_CORE_API_URL', 'http://core');
    fetch.mockResponseOnce(JSON.stringify({ roles: [], userId: '1' }), JSON_HEADERS);

    const { getUserInfo } = await import('@/src/app/api/api');
    await getUserInfo(TOKEN_MOCK);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('v1/user/info');
  });
});
