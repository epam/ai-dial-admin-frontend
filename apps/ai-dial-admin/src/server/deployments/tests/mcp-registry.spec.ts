import { describe, test, expect, vi } from 'vitest';

import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { MCP_REGISTRY_SERVERS, McpRegistryApi } from '@/src/server/deployments/mcp-registry';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('McpRegistryApi', () => {
  const instance = new McpRegistryApi({ host: TEST_URL });

  test('getMcpServers calls servers url', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getMcpServers({}, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS({})),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getMcpServers calls servers url with search param', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getMcpServers({ search: 'test', limit: '5' }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS({ search: 'test', limit: '5' })),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
