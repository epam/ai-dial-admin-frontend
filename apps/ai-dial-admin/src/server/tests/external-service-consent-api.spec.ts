import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { ExternalServiceConsentApi } from '../core/external-service-consent-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ExternalServiceConsentApi', () => {
  const instance = new ExternalServiceConsentApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('grants consent with a POST to the consent endpoint', async () => {
    fetch.mockResponseOnce('true');

    const res = await instance.grant(TOKEN_MOCK, 'public/my-app', 'dial');

    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('v1/applications/public/my-app/external-services/dial/consent'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('withdraws consent with a DELETE to the same endpoint', async () => {
    fetch.mockResponseOnce('true');

    const res = await instance.withdraw(TOKEN_MOCK, 'public/my-app', 'dial');

    expect(res.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('v1/applications/public/my-app/external-services/dial/consent'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('a withdrawal that removed nothing is still a success', async () => {
    fetch.mockResponseOnce('false');

    const res = await instance.withdraw(TOKEN_MOCK, 'public/my-app', 'dial');

    expect(res.success).toBe(true);
  });

  test('encodes each path segment of an application path containing a space', async () => {
    fetch.mockResponseOnce('true');

    await instance.grant(TOKEN_MOCK, 'public/als code apps/my app', 'dial');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('v1/applications/public/als%20code%20apps/my%20app/external-services/dial/consent'),
      expect.anything(),
    );
  });

  test('encodes the service id', async () => {
    fetch.mockResponseOnce('true');

    await instance.grant(TOKEN_MOCK, 'public/my-app', 'dial native');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('external-services/dial%20native/consent'),
      expect.anything(),
    );
  });

  test('surfaces a 404 from a stale declaration', async () => {
    fetch.mockResponseOnce('Not found', { status: 404 });

    const res = await instance.grant(TOKEN_MOCK, 'public/my-app', 'dial');

    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });
});
