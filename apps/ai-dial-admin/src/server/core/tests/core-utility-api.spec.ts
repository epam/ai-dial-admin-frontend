import { CORE_TEST_URL, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { CallerDeploymentKind, CoreUtilityApi } from '../core-utility-api';

const JSON_HEADERS = { 'content-type': 'application/json' };

/** The SDK hands `fetch` a `Request`; its `url` is the final, already-interpolated path. */
const requestedUrl = (): string => (fetch.mock.calls[0][0] as Request).url;

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: CoreUtilityApi', () => {
  const instance = new CoreUtilityApi({ host: TEST_URL });
  // `getUserInfo` goes through the SDK, which needs an absolute host.
  const sdkInstance = new CoreUtilityApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getCoreVersion calls the Core version route and returns its plain-text response', async () => {
    fetch.mockResponseOnce('1.2.3', { headers: { 'content-type': 'text/plain' } });

    const result = await instance.getCoreVersion(TOKEN_MOCK);

    expect(result).toBe('1.2.3');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/version'),
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: 'text/plain', authorization: 'Bearer access_token_mock' }),
      }),
    );

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).not.toContain('/api/');
  });

  test('getCoreVersion returns the version when Core sends it without a content type', async () => {
    fetch.mockResponseOnce('0.43.0');

    const result = await instance.getCoreVersion(TOKEN_MOCK);

    expect(result).toBe('0.43.0');
  });

  test('getCoreVersion returns null when Core rejects the request', async () => {
    fetch.mockResponseOnce('Unavailable', { status: 503 });

    const result = await instance.getCoreVersion(TOKEN_MOCK);

    expect(result).toBeNull();
  });

  test('getCoreVersion returns null when the request throws', async () => {
    fetch.mockRejectOnce(new Error('Network error'));

    const result = await instance.getCoreVersion(TOKEN_MOCK);

    expect(result).toBeNull();
  });

  test('getUserInfo maps a JWT caller into id/email and carries no roles', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        roles: ['admin'],
        userId: 'user-1',
        userClaims: { email: ['user@example.com'] },
      }),
      { headers: { 'content-type': 'application/json' } },
    );

    const result = await sdkInstance.getUserInfo(TOKEN_MOCK);

    // The SDK hands `fetch` a `Request`, not a URL string.
    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://core.test/v1/user/info', method: 'GET' }),
      expect.anything(),
    );
    expect(result.response?.userInfo).toEqual({ id: 'user-1', email: 'user@example.com' });
  });

  test('getUserInfo falls back to the project as id for an API-key caller', async () => {
    fetch.mockResponseOnce(JSON.stringify({ roles: ['some-role'], project: 'proj-1' }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await sdkInstance.getUserInfo(TOKEN_MOCK);

    expect(result.response?.userInfo).toEqual({ id: 'proj-1', email: '' });
  });

  test('getUserInfo passes through a failed response unchanged', async () => {
    fetch.mockResponseOnce('Unauthorized', { status: 401 });

    const result = await sdkInstance.getUserInfo(TOKEN_MOCK);

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.response).toBeUndefined();
  });
  test('getUserRoleAssignments calls the Core user role-assignments route and returns the access', async () => {
    const body = { adminAccess: 'NONE', items: [{ id: '1', name: 'Acme', folder: 'public/Acme/', roles: [] }] };
    fetch.mockResponseOnce(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

    const result = await instance.getUserRoleAssignments(TOKEN_MOCK);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/user/role-assignments');
    expect(calledUrl).not.toContain('/api/');
    expect(result.response).toEqual(body);
  });

  test('getRunnerSchemas reads the caller-scoped schema list from Core', async () => {
    const body = [{ $id: 'runner' }];
    fetch.mockResponseOnce(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

    const result = await instance.getRunnerSchemas(TOKEN_MOCK);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/application_type_schemas/schemas');
    expect(result.response).toEqual(body);
  });

  test.each([CallerDeploymentKind.Models, CallerDeploymentKind.Applications])(
    'getCallerDeployments reads the caller-scoped %s list from Core',
    async (kind) => {
      const body = { data: [{ id: 'a', display_name: 'A' }] };
      fetch.mockResponseOnce(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

      const result = await instance.getCallerDeployments(TOKEN_MOCK, kind);

      const [calledUrl] = fetch.mock.calls[0];
      expect(calledUrl).toContain(`/openai/${kind}`);
      expect(result.response).toEqual(body);
    },
  );

  test('getUserRoleAssignments keeps the 404 status when org units are off', async () => {
    fetch.mockResponseOnce('Not Found', { status: 404 });

    const result = await instance.getUserRoleAssignments(TOKEN_MOCK);

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
  });
});

describe.each([
  ['checkDeploymentByName', (api: CoreUtilityApi) => api.checkDeploymentByName.bind(api)],
  ['getDeploymentById', (api: CoreUtilityApi) => api.getDeploymentById.bind(api)],
])('Server :: Core :: CoreUtilityApi.%s', (_, lookup) => {
  const call = lookup(new CoreUtilityApi({ host: CORE_TEST_URL }));

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('GETs the Core deployment route, not the OpenAI one, and returns the body', async () => {
    const body = { object: 'model', id: 'gpt-4' };
    fetch.mockResponseOnce(JSON.stringify(body), { headers: JSON_HEADERS });

    const result = await call('gpt-4', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://core.test/v1/deployments/gpt-4', method: 'GET' }),
      expect.anything(),
    );
    expect(result).toEqual(body);
  });

  test('resolves a missing deployment to null', async () => {
    fetch.mockResponseOnce('', { status: 404, headers: { 'content-length': '0' } });

    expect(await call('missing', TOKEN_MOCK)).toBeNull();
  });

  test('resolves a forbidden lookup to undefined, so a name is not reported as free', async () => {
    fetch.mockResponseOnce('Forbidden', { status: 403 });

    expect(await call('secret', TOKEN_MOCK)).toBeUndefined();
  });

  test('resolves any other failure to null', async () => {
    fetch.mockResponseOnce(JSON.stringify({ error: { message: 'boom' } }), { status: 500, headers: JSON_HEADERS });

    expect(await call('broken', TOKEN_MOCK)).toBeNull();
  });

  test('resolves an aborted lookup to null', async () => {
    fetch.mockRejectOnce(new DOMException('Aborted', 'AbortError'));

    expect(await call('gpt-4', TOKEN_MOCK)).toBeNull();
  });
});

describe('Server :: Core :: CoreUtilityApi deployment lookup encoding', () => {
  const instance = new CoreUtilityApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockResponseOnce('', { status: 404, headers: { 'content-length': '0' } });
  });

  test.each([
    ['a?b', 'a%3Fb'],
    ['a#b', 'a%23b'],
    ['50%', '50%25'],
    ['my app', 'my%20app'],
  ])('checkDeploymentByName keeps %s one encoded segment', async (name, encoded) => {
    await instance.checkDeploymentByName(name, TOKEN_MOCK);

    const url = new URL(requestedUrl());
    expect(url.pathname).toBe(`/v1/deployments/${encoded}`);
    expect(url.search).toBe('');
    expect(url.hash).toBe('');
  });

  test('checkDeploymentByName leaves a slash as a path separator', async () => {
    await instance.checkDeploymentByName('a/b', TOKEN_MOCK);

    expect(requestedUrl()).toBe('http://core.test/v1/deployments/a/b');
  });

  test('getDeploymentById sends a Core-issued id unchanged, without encoding it twice', async () => {
    await instance.getDeploymentById('applications/bucket/My%20App', TOKEN_MOCK);

    expect(requestedUrl()).toBe('http://core.test/v1/deployments/applications/bucket/My%20App');
  });
});
