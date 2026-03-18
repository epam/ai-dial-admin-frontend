import { McpPackage, McpServer } from '@/src/types/deployments/mcp-registry';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';

const SUPPORTED_TRANSPORTS = ['streamable-http', 'sse'];

export const hasOciPackage = (server: McpServer): boolean => {
  return !!server.packages?.some((pkg) => pkg.registryType === 'oci');
};

export const hasSupportedTransport = (server: McpServer): boolean => {
  return !!server.packages?.some(
    (pkg) => pkg.registryType === 'oci' && pkg.transport?.type && SUPPORTED_TRANSPORTS.includes(pkg.transport.type),
  );
};

export const isServerSelectable = (server: McpServer): boolean => {
  return hasOciPackage(server) && hasSupportedTransport(server);
};

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
