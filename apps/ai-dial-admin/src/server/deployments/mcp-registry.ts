import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { McpServersRequestDto } from '@/src/types/deployments/mcp-registry';

export const MCP_REGISTRY_SERVERS_LIST = `${API}/mcp-registry/servers/list`;

const CONTAINER_FILTER = {
  packageRegistryTypes: ['oci'],
  packageTransportTypes: ['streamable-http', 'sse'],
};

export class McpRegistryApi extends BaseApi {
  getContainerMcpServers(
    params: { search?: string; cursor?: string; limit?: number },
    token: Token,
  ): Promise<ServerActionResponse> {
    const body: McpServersRequestDto = {
      ...(params.search ? { search: params.search } : {}),
      ...(params.cursor ? { cursor: params.cursor } : {}),
      ...(params.limit != null ? { limit: params.limit } : {}),
      filter: CONTAINER_FILTER,
    };

    return this.postAction(MCP_REGISTRY_SERVERS_LIST, body, token);
  }
}
