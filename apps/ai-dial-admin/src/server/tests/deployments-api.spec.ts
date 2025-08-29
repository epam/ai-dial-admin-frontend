import { describe, it, expect, vi } from 'vitest';
import { DeploymentsApi, BASE_CONTAINERS_URL } from '../deployments-api';
import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();
describe('DeploymentsApi', () => {
  const instance = new DeploymentsApi({ host: TEST_URL });

  it('calls getInterceptorContainers with correct URL and token', async () => {
    fetch.mockResponseOnce(['container1']);
    const result = await instance.getInterceptorContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(`${BASE_CONTAINERS_URL}?imageDefinitionType=INTERCEPTOR`, TOKEN_MOCK);
    expect(result).toEqual(['container1']);
  });

  it('calls getMcpContainers with correct URL and token', async () => {
    fetch.mockResponseOnce(['container2']);
    const result = await instance.getMcpContainers(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(`${BASE_CONTAINERS_URL}?imageDefinitionType=MCP`, TOKEN_MOCK);
    expect(result).toEqual(['container2']);
  });
});
