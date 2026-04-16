import { describe, test, expect, vi } from 'vitest';

import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  MCP_REGISTRY_SERVER_VERSIONS,
  MCP_REGISTRY_SERVERS_LIST,
  McpRegistryApi,
} from '@/src/server/deployments/mcp-registry';
import {
  CONTAINER_MCP_REGISTRY_FILTER,
  IMAGE_MCP_REGISTRY_FILTER,
  TOOLSET_MCP_REGISTRY_FILTER,
} from '@/src/constants/deployments/mcp-registry';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('McpRegistryApi', () => {
  const instance = new McpRegistryApi({ host: TEST_URL });

  test('getContainerMcpServers sends POST with OCI and transport filters', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getContainerMcpServers({ limit: 100 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS_LIST),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          limit: 100,
          filter: CONTAINER_MCP_REGISTRY_FILTER,
        }),
      }),
    );
  });

  test('getContainerMcpServers includes search and cursor when provided', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getContainerMcpServers({ search: 'test', cursor: 'abc', limit: 5 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS_LIST),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          search: 'test',
          cursor: 'abc',
          limit: 5,
          filter: CONTAINER_MCP_REGISTRY_FILTER,
        }),
      }),
    );
  });

  test('getContainerMcpServers omits undefined search and empty cursor', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getContainerMcpServers({ search: undefined, cursor: '', limit: 100 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS_LIST),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          limit: 100,
          filter: CONTAINER_MCP_REGISTRY_FILTER,
        }),
      }),
    );
  });

  test('getImageMcpServers sends POST with repositoryExists filter', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getImageMcpServers({ limit: 100 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS_LIST),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          limit: 100,
          filter: IMAGE_MCP_REGISTRY_FILTER,
        }),
      }),
    );
  });

  test('getImageMcpServers includes search and cursor when provided', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getImageMcpServers({ search: 'github', cursor: 'xyz', limit: 50 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS_LIST),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          search: 'github',
          cursor: 'xyz',
          limit: 50,
          filter: IMAGE_MCP_REGISTRY_FILTER,
        }),
      }),
    );
  });

  test('getImageMcpServers omits undefined optional params', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getImageMcpServers({ search: undefined, cursor: '', limit: 100 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS_LIST),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          limit: 100,
          filter: IMAGE_MCP_REGISTRY_FILTER,
        }),
      }),
    );
  });

  test('getToolsetMcpServers sends POST with remoteTransportTypes filter', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getToolsetMcpServers({ limit: 100 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS_LIST),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          limit: 100,
          filter: TOOLSET_MCP_REGISTRY_FILTER,
        }),
      }),
    );
  });

  test('getToolsetMcpServers includes search and cursor when provided', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getToolsetMcpServers({ search: 'weather', cursor: 'cur1', limit: 10 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS_LIST),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          search: 'weather',
          cursor: 'cur1',
          limit: 10,
          filter: TOOLSET_MCP_REGISTRY_FILTER,
        }),
      }),
    );
  });

  test('getToolsetMcpServers omits undefined optional params', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getToolsetMcpServers({ search: undefined, cursor: '', limit: 100 }, TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVERS_LIST),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          limit: 100,
          filter: TOOLSET_MCP_REGISTRY_FILTER,
        }),
      }),
    );
  });

  test('getMcpServerVersion sends POST with serverName and version', async () => {
    fetch.mockResponseOnce(JSON.stringify({ servers: [], metadata: {} }));
    await instance.getMcpServerVersion('ai.aliengiraffe/spotdb', 'v0.1.0', TOKEN_MOCK);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(MCP_REGISTRY_SERVER_VERSIONS),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          serverName: 'ai.aliengiraffe/spotdb',
          version: 'v0.1.0',
        }),
      }),
    );
  });
});
