import { describe, test, expect, vi } from 'vitest';
import { DeploymentsApi, BASE_CONTAINERS_URL } from '../deployments-api';
import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();
describe('DeploymentsApi', () => {
  const instance = new DeploymentsApi({ host: TEST_URL });

  test('calls getInterceptorContainers with correct URL and token', async () => {
    fetch.mockResponseOnce(['container1']);
    await instance.getInterceptorContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=INTERCEPTOR`),
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  test('calls getModelContainers with correct URL and token', async () => {
    fetch.mockResponseOnce(['container2']);
    await instance.getModelContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=NIM`),
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  test('calls getMcpContainers with correct URL and token', async () => {
    fetch.mockResponseOnce(['container2']);
    await instance.getMcpContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${BASE_CONTAINERS_URL}?type=MCP`),
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });
});
