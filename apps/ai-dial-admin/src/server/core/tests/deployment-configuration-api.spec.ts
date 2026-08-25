import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DeploymentConfigurationApi } from '../deployment-configuration-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: DeploymentConfigurationApi', () => {
  const instance = new DeploymentConfigurationApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getConfigurationSchema calls the Core deployments/{name}/configuration route, not the admin-BE api/ path', async () => {
    fetch.mockResponseOnce(JSON.stringify({ type: 'object' }));

    await instance.getConfigurationSchema(TOKEN_MOCK, 'redactor');

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/deployments/redactor/configuration');
    expect(calledUrl).not.toContain('/api/');
  });

  test('getConfigurationSchema encodes a name containing special characters', async () => {
    fetch.mockResponseOnce(JSON.stringify({ type: 'object' }));

    await instance.getConfigurationSchema(TOKEN_MOCK, 'my interceptor');

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/deployments/my%20interceptor/configuration');
  });

  test('returns the parsed schema on success', async () => {
    fetch.mockResponseOnce(JSON.stringify({ type: 'object', properties: {} }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.getConfigurationSchema(TOKEN_MOCK, 'redactor');

    expect(result.success).toBe(true);
    expect(result.response).toEqual({ type: 'object', properties: {} });
  });
});
