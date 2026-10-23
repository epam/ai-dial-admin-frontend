import { ApplicationRoute } from '@/src/types/routes';
import { EntitiesI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { Container, ContainerAssetTemplate } from '@/src/models/deployments/containers';
import { CONTAINER_TRANSPORT, INFERENCE_TASK } from '@/src/types/deployments/containers';
import { ToolsetTransport } from '@/src/types/toolset';
import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getEndpointPostfix, getEndpointPrefix } from '@/src/utils/models/model-endpoint';
import {
  CONTAINER_ASSET_LABELS,
  ENTITY_TRANSPORT,
  SERVING_MCP_ENDPOINT_PATH,
} from '@/src/constants/deployments/containers';
import { DeploymentInterfaceType, DialResourceInterface } from '@/src/models/dial/interfaces';
import { DialModelResourceType } from '@/src/models/dial/resource';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplication } from '@/src/models/dial/application';
import { ALLOW_ALL_DOMAINS } from '@/src/components/Deployments/Common/Whitelists/Whitelists';
import { Image } from '@/src/models/deployments/images';
import { WHITELIST_POLICY } from '@/src/types/deployments/entity';

export const getEntityRoute = (route: ApplicationRoute) => {
  if (route === ApplicationRoute.McpContainers) {
    return ApplicationRoute.Toolsets;
  }
  if (route === ApplicationRoute.InterceptorContainers) {
    return ApplicationRoute.Interceptors;
  }
  if (route === ApplicationRoute.AdapterContainers) {
    return ApplicationRoute.Adapters;
  }
  if (route === ApplicationRoute.ApplicationContainers) {
    return ApplicationRoute.Applications;
  }
  return ApplicationRoute.Models;
};

export const getDeploymentEntityKey = (route: ApplicationRoute, t: (key: string) => string) => {
  if (route === ApplicationRoute.McpContainers || route === ApplicationRoute.InterceptorContainers) {
    return t(EntitiesI18nKey.Container);
  }
  if (route === ApplicationRoute.ModelServings) {
    return t(EntitiesI18nKey.Serving);
  }
  return t(ImagesI18nKey.ImageWhitelistType);
};

export const getRouteByType = (type: IMAGE_TYPE): ApplicationRoute => {
  if (type === IMAGE_TYPE.MCP) {
    return ApplicationRoute.McpContainers;
  }
  if (type === IMAGE_TYPE.INTERCEPTOR) {
    return ApplicationRoute.InterceptorContainers;
  }
  if (type === IMAGE_TYPE.ADAPTER) {
    return ApplicationRoute.AdapterContainers;
  }
  if (type === IMAGE_TYPE.APPLICATION) {
    return ApplicationRoute.ApplicationContainers;
  }
  return ApplicationRoute.ModelServings;
};

export const getTranslatedType = (route: ApplicationRoute, t: (key: string) => string) => {
  if (route === ApplicationRoute.McpContainers) {
    return t(EntitiesI18nKey.MCP);
  }
  if (route === ApplicationRoute.InterceptorContainers) {
    return t(EntitiesI18nKey.Interceptor);
  }
  if (route === ApplicationRoute.AdapterContainers) {
    return t(EntitiesI18nKey.Adapter);
  }
  if (route === ApplicationRoute.ApplicationContainers) {
    return t(EntitiesI18nKey.Application);
  }
  return t(EntitiesI18nKey.Model);
};

export const getTranslatedDeploymentType = (route: ApplicationRoute, t: (key: string) => string): string => {
  if (route === ApplicationRoute.ModelServings) {
    return t(EntitiesI18nKey.Serving);
  }
  if (route === ApplicationRoute.Images) {
    return t(ImagesI18nKey.Image);
  }
  return t(EntitiesI18nKey.Container);
};

export const getTranslatedEntity = (route: ApplicationRoute, t: (key: string) => string) => {
  if (route === ApplicationRoute.McpContainers) {
    return t(EntitiesI18nKey.Toolset);
  }
  if (route === ApplicationRoute.InterceptorContainers) {
    return t(EntitiesI18nKey.Interceptor);
  }
  if (route === ApplicationRoute.AdapterContainers) {
    return t(EntitiesI18nKey.Adapter);
  }
  if (route === ApplicationRoute.ApplicationContainers) {
    return t(EntitiesI18nKey.Application);
  }
  return t(EntitiesI18nKey.Model);
};

export const getIdFormat = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '_');
};

export const getEntityId = (container: Container) => {
  return getIdFormat(getEntityName(container));
};

export const getEntityName = (container: Container) => {
  return `${container.displayName}`;
};

export const getEntityTemplate = (
  route: ApplicationRoute,
  container: Container,
  t: (key: string, options?: Record<string, string | number>) => string,
  transport?: CONTAINER_TRANSPORT,
): DialModel | Toolset | DialInterceptor | DialApplication => {
  if (route === ApplicationRoute.ApplicationContainers) {
    const appTemplate: DialApplication = {
      name: getEntityId(container),
      displayName: getEntityName(container),
      description: '',
      source: {
        $type: SOURCE_TYPE.CONTAINER,
        containerId: container.name,
      },
    };
    return appTemplate;
  }

  const template: DialModel | Toolset | DialInterceptor = {
    name: getEntityId(container),
    displayName: getEntityName(container),
    description: '',
    source: { $type: SOURCE_TYPE.CONTAINER, containerId: container.name },
  };

  if (route === ApplicationRoute.ModelServings) {
    // A text-classification serving is consumed as an MCP toolset, not a chat model. The backend
    // exposes no endpoint/transport for it (spec 024 FR-006), so fill a fixed MCP template.
    if (container.inferenceTask === INFERENCE_TASK.TEXT_CLASSIFICATION) {
      (template as Toolset).transport = ToolsetTransport.HTTP;
      template.source = {
        $type: SOURCE_TYPE.CONTAINER,
        containerId: container.name,
        // Backend ToolSetContainerSource reads `completionEndpointPath`; it concatenates it with the
        // container URL to build the toolset endpoint (container.url + /mcp), same as an MCP container.
        completionEndpointPath: SERVING_MCP_ENDPOINT_PATH,
      };
      return template;
    }

    (template as DialModel).type = DialModelType.Chat;
    template.source = {
      ...(template.source as SOURCE_FIELD),
      completionEndpointPath: `${getEndpointPrefix()}${getEndpointPostfix((template as DialModel).type)}`,
    };
    (template as DialModel).overrideName = container.name;
    (template as DialModel).displayVersion = '';
  }

  if (route === ApplicationRoute.McpContainers) {
    if (transport) {
      (template as Toolset).transport = ENTITY_TRANSPORT[transport];
    }
  }

  if (route === ApplicationRoute.AdapterContainers) {
    ((template as DialAdapter).source as SOURCE_FIELD).completionEndpointPath = 'v1';
  }

  return template;
};

const isClassificationServing = (route: ApplicationRoute, container: Container) =>
  route === ApplicationRoute.ModelServings && container.inferenceTask === INFERENCE_TASK.TEXT_CLASSIFICATION;

/** The asset view whose create flow turns this container into a Core asset. */
export const getAssetView = (route: ApplicationRoute, container: Container): keyof typeof CONTAINER_ASSET_LABELS => {
  if (route === ApplicationRoute.McpContainers || isClassificationServing(route, container)) {
    return ApplicationRoute.AssetsToolsets;
  }
  if (route === ApplicationRoute.InterceptorContainers) {
    return ApplicationRoute.PlatformInterceptors;
  }
  if (route === ApplicationRoute.ApplicationContainers) {
    return ApplicationRoute.AssetsApplications;
  }
  return ApplicationRoute.PlatformModels;
};

/** Label for the Core asset option next to the admin-backend one. */
export const getTranslatedAssetOption = (route: ApplicationRoute, container: Container, t: (key: string) => string) =>
  t(CONTAINER_ASSET_LABELS[getAssetView(route, container)].option);

/** Entity label for the single Core-only create button. */
export const getTranslatedAssetEntity = (route: ApplicationRoute, container: Container, t: (key: string) => string) =>
  t(CONTAINER_ASSET_LABELS[getAssetView(route, container)].entity);

// An entry with no `base_url` of its own routes through the entity-level base URL — the shape
// InterfacesField produces for a freshly added row.
const getChatInterfaces = (): Record<string, DialResourceInterface> => ({
  [DeploymentInterfaceType.OpenAIChatCompletions]: {} as DialResourceInterface,
});

/**
 * Pre-fills the Core asset a running container becomes. With `baseUrl` + an interface Core calls
 * `<url>/openai/deployments/<name>/chat/completions` — the path adapter and SDK containers serve —
 * so no `endpoint` or `overrideName` is set for them. A Model Serving runtime listens on
 * `/openai/v1/...` instead and picks the model from the body, hence the full endpoint and override.
 * Roles are left to the create flow, which starts a platform asset unavailable.
 */
export const getAssetTemplate = (
  route: ApplicationRoute,
  container: Container,
  transport?: CONTAINER_TRANSPORT,
): ContainerAssetTemplate => {
  const name = getEntityId(container);
  const displayName = getEntityName(container);
  // Core reads an empty string as a present, broken URL, so a missing one stays absent.
  const url = container.url || undefined;
  const withPath = (path: string) => (url ? `${url}${path}` : undefined);

  if (route === ApplicationRoute.McpContainers) {
    return { name, displayName, endpoint: url, transport: transport ? ENTITY_TRANSPORT[transport] : undefined };
  }

  if (route === ApplicationRoute.InterceptorContainers) {
    return { name, displayName, baseUrl: url, interfaces: getChatInterfaces() };
  }

  if (route === ApplicationRoute.ApplicationContainers) {
    return { name, displayName, base_url: url, interfaces: getChatInterfaces() };
  }

  if (route === ApplicationRoute.ModelServings) {
    if (isClassificationServing(route, container)) {
      return { name, displayName, endpoint: withPath(SERVING_MCP_ENDPOINT_PATH), transport: ToolsetTransport.HTTP };
    }

    return {
      name,
      displayName,
      type: DialModelResourceType.Chat,
      endpoint: withPath(`/${getEndpointPrefix()}${getEndpointPostfix(DialModelType.Chat)}`),
      overrideName: container.name,
    };
  }

  return { name, displayName, type: DialModelResourceType.Chat, baseUrl: url, interfaces: getChatInterfaces() };
};

export const splitFolderId = (folderId: string) => {
  const match = folderId.match(/^\/?[^/]+\//);
  const base = match ? match[0] : folderId + '/';
  const path = match ? folderId.slice(base.length) : '';
  return { base, path };
};

export const getCurrentPolicy = (entity: Image | Container) => {
  return entity.allowedDomains?.includes(ALLOW_ALL_DOMAINS) ? WHITELIST_POLICY.ALL : WHITELIST_POLICY.CUSTOM;
};
