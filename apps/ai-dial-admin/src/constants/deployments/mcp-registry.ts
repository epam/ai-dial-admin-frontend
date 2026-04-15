import { McpServerFilterDto } from '@/src/types/deployments/mcp-registry';

export const SUPPORTED_MCP_TRANSPORT_TYPES = ['streamable-http', 'sse'];

export const CONTAINER_MCP_REGISTRY_FILTER: McpServerFilterDto = {
  packageRegistryTypes: ['oci'],
  packageTransportTypes: SUPPORTED_MCP_TRANSPORT_TYPES,
};

export const IMAGE_MCP_REGISTRY_FILTER: McpServerFilterDto = {
  repositoryExists: true,
};

export const TOOLSET_MCP_REGISTRY_FILTER: McpServerFilterDto = {
  remoteTransportTypes: SUPPORTED_MCP_TRANSPORT_TYPES,
};
