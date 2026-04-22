import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { getUrlError } from '@/src/utils/validation/url-error';
import { DialModel } from '@/src/models/dial/model';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { Toolset } from '@/src/models/dial/toolset';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplication } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';

const isDialApplication = (
  entity: DialModel | DialInterceptor | Toolset | DialAdapter | DialApplication,
): entity is DialApplication => {
  return 'mcp' in entity || 'applicationProperties' in entity || 'viewerUrl' in entity || 'editorUrl' in entity;
};

export const isValidSourceField = (
  entity: DialModel | DialInterceptor | Toolset | DialAdapter | DialApplication,
): boolean => {
  const source = entity.source;

  if (source?.$type === SOURCE_TYPE.CONTAINER) {
    return !!source.containerId;
  }
  if (source?.$type === SOURCE_TYPE.ADAPTER) {
    return !!source.adapterName && !!source.completionEndpointPath;
  }
  if (source?.$type === SOURCE_TYPE.RUNNER) {
    return !!source.runnerName;
  }
  if (source?.$type === SOURCE_TYPE.MCP_REGISTRY) {
    return !!source.serverName;
  }
  if (source?.$type === SOURCE_TYPE.SCHEMA) {
    return !!source.applicationTypeSchemaId;
  }
  if (source?.$type === SOURCE_TYPE.ENDPOINTS) {
    if (isDialApplication(entity)) {
      const chatValid = entity.endpoint ? getUrlError(entity.endpoint, void 0, true) === null : false;
      const mcpValid = entity.mcp?.endpoint ? getUrlError(entity.mcp.endpoint, void 0, true) === null : false;
      return chatValid || mcpValid;
    }
    return getUrlError((entity as DialModel).endpoint || (entity as DialAdapter).baseEndpoint, void 0, true) === null;
  }
  return false;
};

export const getContainerRoute = (route: ApplicationRoute) => {
  switch (route) {
    case ApplicationRoute.Models:
      return ApplicationRoute.ModelServings;
    case ApplicationRoute.Adapters:
      return ApplicationRoute.AdapterContainers;
    case ApplicationRoute.Interceptors:
      return ApplicationRoute.InterceptorContainers;
    default:
      return ApplicationRoute.McpContainers;
  }
};
