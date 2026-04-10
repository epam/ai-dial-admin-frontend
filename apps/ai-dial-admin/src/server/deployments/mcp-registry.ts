import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { CONTAINER_MCP_REGISTRY_FILTER, IMAGE_MCP_REGISTRY_FILTER } from '@/src/constants/deployments/mcp-registry';
import { McpServersRequestDto } from '@/src/types/deployments/mcp-registry';

export const MCP_REGISTRY_SERVERS_LIST = `${API}/mcp-registry/servers/list`;

export class McpRegistryApi extends BaseApi {
  getContainerMcpServers(
    params: { search?: string; cursor?: string; limit?: number },
    token: Token,
  ): Promise<ServerActionResponse> {
    const body: McpServersRequestDto = {
      ...(params.search ? { search: params.search } : {}),
      ...(params.cursor ? { cursor: params.cursor } : {}),
      ...(params.limit != null ? { limit: params.limit } : {}),
      filter: CONTAINER_MCP_REGISTRY_FILTER,
    };

    return this.postAction(MCP_REGISTRY_SERVERS_LIST, body, token);
  }

  getImageMcpServers(
    params: { search?: string; cursor?: string; limit?: number },
    token: Token,
  ): Promise<ServerActionResponse> {
    const body: McpServersRequestDto = {
      ...(params.search ? { search: params.search } : {}),
      ...(params.cursor ? { cursor: params.cursor } : {}),
      ...(params.limit != null ? { limit: params.limit } : {}),
      filter: IMAGE_MCP_REGISTRY_FILTER,
    };

    return this.postAction(MCP_REGISTRY_SERVERS_LIST, body, token);
  }
}
