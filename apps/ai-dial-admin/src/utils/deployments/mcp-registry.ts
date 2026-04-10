import { SUPPORTED_MCP_TRANSPORT_TYPES } from '@/src/constants/deployments/mcp-registry';
import { McpPackage, McpRemote, McpServer } from '@/src/types/deployments/mcp-registry';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { ToolsetTransport } from '@/src/types/toolset';

export const getPreferredOciPackage = (server: McpServer): McpPackage | undefined => {
  if (!server.packages?.length) {
    return undefined;
  }

  return (
    server.packages.find(
      (pkg) => pkg.registryType === 'oci' && pkg.transport?.type === SUPPORTED_MCP_TRANSPORT_TYPES[0],
    ) ||
    server.packages.find(
      (pkg) => pkg.registryType === 'oci' && SUPPORTED_MCP_TRANSPORT_TYPES.includes(pkg.transport?.type || ''),
    )
  );
};

export const mapTransportType = (transportType: string): CONTAINER_TRANSPORT | undefined => {
  switch (transportType) {
    case 'streamable-http':
      return CONTAINER_TRANSPORT.HTTP;
    case 'sse':
      return CONTAINER_TRANSPORT.SSE;
    default:
      return undefined;
  }
};

export const getPreferredRemote = (server: McpServer): McpRemote | undefined => {
  if (!server.remotes?.length) {
    return undefined;
  }

  return (
    server.remotes.find((remote) => remote.type === SUPPORTED_MCP_TRANSPORT_TYPES[0]) ||
    server.remotes.find((remote) => SUPPORTED_MCP_TRANSPORT_TYPES.includes(remote.type))
  );
};

export const mapRemoteTransportType = (type: string): ToolsetTransport | undefined => {
  switch (type) {
    case 'streamable-http':
      return ToolsetTransport.HTTP;
    case 'sse':
      return ToolsetTransport.SSE;
    default:
      return undefined;
  }
};
