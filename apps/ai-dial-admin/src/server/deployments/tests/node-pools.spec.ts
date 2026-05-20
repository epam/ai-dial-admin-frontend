import { describe, test, expect, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

import { NodePoolsApi, BASE_NODE_POOLS_URL } from '../node-pools';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('NodePoolsApi', () => {
  const instance = new NodePoolsApi({ host: TEST_URL });

  test('getNodePools calls base url with GET', async () => {
    fetch.mockResponseOnce(JSON.stringify([]));
    await instance.getNodePools(TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(BASE_NODE_POOLS_URL),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
