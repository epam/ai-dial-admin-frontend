import { ApplicationRoute } from '@/src/types/routes';
import { EntitiesI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { ENTITY_TRANSPORT } from '@/src/constants/deployments/containers';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { IMAGE_TYPE } from '@/src/types/deployments/images';

export const getEntityRoute = (route: ApplicationRoute) => {
  if (route === ApplicationRoute.McpContainers) {
    return ApplicationRoute.Toolsets;
  }
  if (route === ApplicationRoute.InterceptorContainers) {
    return ApplicationRoute.Interceptors;
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
  return ApplicationRoute.ModelServings;
};

export const getTranslatedType = (route: ApplicationRoute, t: (key: string) => string) => {
  if (route === ApplicationRoute.McpContainers) {
    return t(EntitiesI18nKey.MCP);
  }
  if (route === ApplicationRoute.InterceptorContainers) {
    return t(EntitiesI18nKey.Interceptor);
  }
  return t(EntitiesI18nKey.Model);
};

export const getTranslatedDeploymentType = (route: ApplicationRoute, t: (key: string) => string): string => {
  if (route === ApplicationRoute.ModelServings) {
    return t(EntitiesI18nKey.Serving);
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
  return t(EntitiesI18nKey.Model);
};

export const getIdFormat = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '_');
};

export const getEntityId = (container: Container, route: ApplicationRoute, t: (key: string) => string) => {
  return getIdFormat(getEntityName(container, route, t));
};

export const getEntityName = (container: Container, route: ApplicationRoute, t: (key: string) => string) => {
  return `${container.displayName} ${getTranslatedEntity(route, t)}`;
};

export const getEntityTemplate = (
  route: ApplicationRoute,
  container: Container,
  t: (key: string, options?: Record<string, string | number>) => string,
  transport?: CONTAINER_TRANSPORT,
): DialModel | Toolset | DialInterceptor => {
  const template: DialModel | Toolset | DialInterceptor = {
    name: getEntityId(container, route, t),
    displayName: getEntityName(container, route, t),
    description: '',
    source: { $type: SOURCE_TYPE.CONTAINER, containerId: container.name },
  };

  if (route === ApplicationRoute.ModelServings) {
    (template as DialModel).type = DialModelType.Chat;
    template.source = {
      ...(template.source as SOURCE_FIELD),
      completionEndpointPath: `openai/v1${getEndpointPostfix((template as DialModel).type)}`,
    };
    (template as DialModel).overrideName = container.name;
    (template as DialModel).displayVersion = '';
  }

  if (route === ApplicationRoute.McpContainers) {
    if (transport) {
      (template as Toolset).transport = ENTITY_TRANSPORT[transport];
    }
  }

  return template;
};

export const getAssetTemplate = (
  route: ApplicationRoute,
  container: Container,
  t: (key: string, options?: Record<string, string | number>) => string,
  transport: CONTAINER_TRANSPORT,
): Partial<AssetToolset> => {
  return {
    name: getEntityId(container, route, t),
    displayName: getEntityName(container, route, t),
    endpoint: container.url,
    transport: ENTITY_TRANSPORT[transport],
  };
};

export const splitFolderId = (folderId: string) => {
  const match = folderId.match(/^\/?[^/]+\//);
  const base = match ? match[0] : folderId + '/';
  const path = match ? folderId.slice(base.length) : '';
  return { base, path };
};
