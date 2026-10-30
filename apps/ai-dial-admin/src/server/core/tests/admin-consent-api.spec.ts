import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { ResourceAccess } from '@/src/models/dial/resource-dependency';
import { AdminConsentApi, toAdminConsentStatus } from '../admin-consent-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

describe('Server :: Core :: AdminConsentApi', () => {
  const instance = new AdminConsentApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getStatus calls GET v1/consent/applications/{path}/admin-consent', async () => {
    fetch.mockResponseOnce(JSON.stringify({ consented: false }), JSON_HEADERS);

    const result = await instance.getStatus(TOKEN_MOCK, 'public/my app__1.0');

    const [calledUrl, options] = fetch.mock.calls[0];
    expect(calledUrl).toContain('v1/consent/applications/public/my%20app__1.0/admin-consent');
    expect(options?.method).toBe('GET');
    expect(result).toMatchObject({ success: true, response: { consented: false } });
  });

  test('getStatus maps approved targets from url to path', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        consented: true,
        grantedBy: 'admin',
        grantedAt: 1700000000000,
        grantedResources: [{ url: 'skills/{current-user}/', access: ['WRITE', 'READ'] }],
      }),
      JSON_HEADERS,
    );

    const result = await instance.getStatus(TOKEN_MOCK, 'public/app');

    expect(result.response).toEqual({
      consented: true,
      grantedBy: 'admin',
      grantedAt: 1700000000000,
      grantedResources: [{ path: 'skills/{current-user}/', access: [ResourceAccess.Write, ResourceAccess.Read] }],
    });
  });

  test('getStatus reports a failure with its status instead of a body', async () => {
    fetch.mockResponseOnce('Only administrators may consent', { status: 403 });

    const result = await instance.getStatus(TOKEN_MOCK, 'public/app');

    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(result.response).toBeUndefined();
  });

  test('grant calls POST on the admin-consent endpoint', async () => {
    fetch.mockResponseOnce('', { status: 200 });

    const result = await instance.grant(TOKEN_MOCK, 'public/app');

    const [calledUrl, options] = fetch.mock.calls[0];
    expect(calledUrl).toContain('v1/consent/applications/public/app/admin-consent');
    expect(options?.method).toBe('POST');
    expect(result.success).toBe(true);
  });

  test('withdraw calls DELETE on the admin-consent endpoint', async () => {
    fetch.mockResponseOnce('', { status: 200 });

    const result = await instance.withdraw(TOKEN_MOCK, 'public/app');

    const [calledUrl, options] = fetch.mock.calls[0];
    expect(calledUrl).toContain('v1/consent/applications/public/app/admin-consent');
    expect(options?.method).toBe('DELETE');
    expect(result.success).toBe(true);
  });

  test('grant reports a Core rejection', async () => {
    fetch.mockResponseOnce('Application declares no resource dependencies', { status: 400 });

    const result = await instance.grant(TOKEN_MOCK, 'public/app');

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
  });
});

describe('toAdminConsentStatus', () => {
  test('leaves a status without a record untouched', () => {
    expect(toAdminConsentStatus({ consented: false })).toEqual({ consented: false });
  });

  test('defaults missing access to an empty list', () => {
    expect(
      toAdminConsentStatus({ consented: false, stale: true, grantedResources: [{ url: 'files/public/x' }] }),
    ).toEqual({
      consented: false,
      stale: true,
      grantedResources: [{ path: 'files/public/x', access: [] }],
    });
  });
});
