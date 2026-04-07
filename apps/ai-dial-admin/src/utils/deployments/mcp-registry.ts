import { McpPackage, McpServer } from '@/src/types/deployments/mcp-registry';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';

export const getPreferredOciPackage = (server: McpServer): McpPackage | undefined => {
  if (!server.packages?.length) {
    return undefined;
  }

  return (
    server.packages.find((pkg) => pkg.registryType === 'oci' && pkg.transport?.type === 'streamable-http') ||
    server.packages.find((pkg) => pkg.registryType === 'oci' && pkg.transport?.type === 'sse')
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
