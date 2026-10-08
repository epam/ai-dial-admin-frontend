import { McpServerFilterDto } from '@/src/types/deployments/mcp-registry';

// One grid block = one registry request, so the first screen waits for as few registry pages as possible
export const MCP_REGISTRY_PAGE_SIZE = 30;

export const SUPPORTED_MCP_TRANSPORT_TYPES = ['streamable-http', 'sse'];

export const CONTAINER_MCP_REGISTRY_FILTER: McpServerFilterDto = {
  packageRegistryTypes: ['oci'],
  packageTransportTypes: SUPPORTED_MCP_TRANSPORT_TYPES,
};

export const IMAGE_MCP_REGISTRY_REPO_FILTER: McpServerFilterDto = {
  repositoryExists: true,
};

export const IMAGE_MCP_REGISTRY_OCI_FILTER: McpServerFilterDto = {
  packageRegistryTypes: ['oci'],
};

export const TOOLSET_MCP_REGISTRY_FILTER: McpServerFilterDto = {
  remoteTransportTypes: SUPPORTED_MCP_TRANSPORT_TYPES,
};
