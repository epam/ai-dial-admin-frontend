import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { CoreUtilityApi } from '../core-utility-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: CoreUtilityApi', () => {
  const instance = new CoreUtilityApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('checkDeploymentByName calls the Core deployments route, not the admin-BE api/ path', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'my-app' }));

    await instance.checkDeploymentByName('my-app', TOKEN_MOCK);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/deployments/my-app');
    expect(calledUrl).not.toContain('/api/');
  });

  test('checkDeploymentByName resolves to null when the deployment does not exist', async () => {
    fetch.mockResponseOnce('Not Found', { status: 404 });

    const result = await instance.checkDeploymentByName('missing-app', TOKEN_MOCK);
    expect(result).toBeNull();
  });

  test('getAllDeployments calls the Core deployments route', async () => {
    fetch.mockResponseOnce(JSON.stringify([{ name: 'model1' }]), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.getAllDeployments(TOKEN_MOCK);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/deployments');
    expect(result.response).toEqual([{ name: 'model1' }]);
  });

  test('getUserInfo maps a JWT caller into id/email', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        roles: ['admin'],
        userId: 'user-1',
        userClaims: { email: ['user@example.com'] },
      }),
      { headers: { 'content-type': 'application/json' } },
    );

    const result = await instance.getUserInfo(TOKEN_MOCK);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/user/info');
    expect(result.response?.userInfo).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      roles: [],
    });
  });

  test('getUserInfo falls back to the project as id for an API-key caller', async () => {
    fetch.mockResponseOnce(JSON.stringify({ roles: ['some-role'], project: 'proj-1' }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.getUserInfo(TOKEN_MOCK);

    expect(result.response?.userInfo).toEqual({ id: 'proj-1', email: '', roles: [] });
  });

  test('getUserInfo passes through a failed response unchanged', async () => {
    fetch.mockResponseOnce('Unauthorized', { status: 401 });

    const result = await instance.getUserInfo(TOKEN_MOCK);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });
});
