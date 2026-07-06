import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { MODEL_SERVING_SOURCE_TYPE } from '@/src/components/SourceField/constants';
import { getUrlError } from '@/src/utils/validation/url-error';
import { DialModel } from '@/src/models/dial/model';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { Toolset } from '@/src/models/dial/toolset';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplication } from '@/src/models/dial/application';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_TYPE, INFERENCE_TASK } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getEndpointPostfix, getEndpointPrefix } from '@/src/utils/models/model-endpoint';

/**
 * A container can back a chat-completion Model only when its backend-detected capability allows it.
 * Inference containers carry an explicit `inferenceTask`; an explicit NONE (incapable) or
 * TEXT_CLASSIFICATION (an MCP toolset, not a model) is excluded. Containers without the field
 * (e.g. NIM) are unaffected and remain selectable.
 */
export const isModelCapableContainer = (container: Container): boolean => {
  return (
    container.inferenceTask !== INFERENCE_TASK.NONE && container.inferenceTask !== INFERENCE_TASK.TEXT_CLASSIFICATION
  );
};

export const isMcpContainer = (container: Container): boolean => container.$type === CONTAINER_TYPE.MCP;

/**
 * A Model Serving container can back a toolset only when its backend-detected capability is
 * text-classification (an MCP toolset); text-generation / none inference and NIM are excluded.
 */
export const isTextClassificationInferenceContainer = (container: Container): boolean =>
  container.$type === CONTAINER_TYPE.HF && container.inferenceTask === INFERENCE_TASK.TEXT_CLASSIFICATION;

export const isToolsetCapableContainer = (container: Container): boolean =>
  isMcpContainer(container) || isTextClassificationInferenceContainer(container);

/**
 * Both toolset container options ("MCP Container" and "Model Serving") persist as
 * {@link SOURCE_TYPE.CONTAINER}; this recognises either selector value.
 */
export const isContainerFamilySource = (value?: string): boolean =>
  value === SOURCE_TYPE.CONTAINER || value === MODEL_SERVING_SOURCE_TYPE;

export const isDialApplication = (
  entity: DialModel | DialInterceptor | Toolset | DialAdapter | DialApplication,
): entity is DialApplication => {
  return 'mcp' in entity || 'applicationProperties' in entity || 'viewerUrl' in entity || 'editorUrl' in entity;
};

export const isValidSourceField = (
  entity: DialModel | DialInterceptor | Toolset | DialAdapter | DialApplication,
  view?: ApplicationRoute,
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
    if (view === ApplicationRoute.Models) {
      const model = entity as DialModel;
      const endpointError = getUrlError(model.endpoint, void 0, !model.responsesEndpoint);
      const responsesEndpointError = getUrlError(model.responsesEndpoint, void 0, !model.endpoint);
      return endpointError === null && responsesEndpointError === null;
    }

    if (isDialApplication(entity)) {
      const chatValid = entity.endpoint ? getUrlError(entity.endpoint, void 0, true) === null : false;
      const mcpValid = entity.mcp?.endpoint ? getUrlError(entity.mcp.endpoint, void 0, true) === null : false;
      return chatValid || mcpValid;
    }
    return getUrlError((entity as DialModel).endpoint || (entity as DialAdapter).baseEndpoint, void 0, true) === null;
  }
  return false;
};

export const buildContainerSelection = <T extends DialInterceptor | DialModel | DialApplication>(
  view: ApplicationRoute,
  entity: T,
  id: string | undefined,
  container: Container | undefined,
): T => {
  switch (view) {
    case ApplicationRoute.Applications:
      return {
        ...entity,
        source: {
          ...entity.source,
          $type: SOURCE_TYPE.CONTAINER,
          containerId: id,
        },
      } as T;
    default: {
      const source = {
        ...entity.source,
        $type: entity.source?.$type || SOURCE_TYPE.CONTAINER,
        containerId: id,
      };
      if (view === ApplicationRoute.Models) {
        source.completionEndpointPath = `${getEndpointPrefix(container?.$type)}${getEndpointPostfix((entity as DialModel).type)}`;
      }
      return {
        ...entity,
        endpoint: '',
        configurationEndpoint: '',
        baseEndpoint: '',
        source,
      } as T;
    }
  }
};

export const getContainerRoute = (route: ApplicationRoute) => {
  switch (route) {
    case ApplicationRoute.Models:
      return ApplicationRoute.ModelServings;
    case ApplicationRoute.Adapters:
      return ApplicationRoute.AdapterContainers;
    case ApplicationRoute.Interceptors:
      return ApplicationRoute.InterceptorContainers;
    case ApplicationRoute.Applications:
      return ApplicationRoute.ApplicationContainers;
    default:
      return ApplicationRoute.McpContainers;
  }
};

/**
 * Resolves the detail-page route from the container's own type rather than the entity view.
 * A toolset's container source may be an MCP container or a Model Serving (inference) container,
 * so the "Go to container" link must follow the real type. Falls back to the view-based route
 * when the container is unknown (e.g. deleted).
 */
export const getRouteForContainer = (
  container: Container | null | undefined,
  view: ApplicationRoute,
): ApplicationRoute => {
  switch (container?.$type) {
    case CONTAINER_TYPE.MCP:
      return ApplicationRoute.McpContainers;
    case CONTAINER_TYPE.HF:
    case CONTAINER_TYPE.NIM:
      return ApplicationRoute.ModelServings;
    case CONTAINER_TYPE.INTERCEPTOR:
      return ApplicationRoute.InterceptorContainers;
    case CONTAINER_TYPE.ADAPTER:
      return ApplicationRoute.AdapterContainers;
    case CONTAINER_TYPE.APPLICATION:
      return ApplicationRoute.ApplicationContainers;
    default:
      return getContainerRoute(view);
  }
};
