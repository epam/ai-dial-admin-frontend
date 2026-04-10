import { McpServerFilterDto } from '@/src/types/deployments/mcp-registry';

export const CONTAINER_MCP_REGISTRY_FILTER: McpServerFilterDto = {
  packageRegistryTypes: ['oci'],
  packageTransportTypes: ['streamable-http', 'sse'],
};

export const IMAGE_MCP_REGISTRY_FILTER: McpServerFilterDto = {
  repositoryExists: true,
};
