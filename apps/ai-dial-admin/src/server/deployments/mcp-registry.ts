import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const MCP_REGISTRY_SERVERS_BASE = `${API}/mcp-registry/servers`;
export const MCP_REGISTRY_SERVERS = (params: Record<string, string>) => {
  const queryString = new URLSearchParams(params).toString();

  return `${MCP_REGISTRY_SERVERS_BASE}?${queryString}`;
};

export class McpRegistryApi extends BaseApi {
  getMcpServers(params: Record<string, string>, token: Token): Promise<ServerActionResponse> {
    return this.getAction(MCP_REGISTRY_SERVERS(params), token);
  }
}
