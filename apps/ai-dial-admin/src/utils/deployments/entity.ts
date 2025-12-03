import { ApplicationRoute } from '@/src/types/routes';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { ENTITY_TRANSPORT } from '@/src/constants/deployments/containers';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';

export const getTranslatedType = (route: ApplicationRoute, t: (key: string) => string) => {
  if (route === ApplicationRoute.McpDeployments) {
    return t(EntitiesI18nKey.MCP);
  } else if (route === ApplicationRoute.InterceptorDeployments) {
    return t(EntitiesI18nKey.Interceptor);
  } else {
    return t(EntitiesI18nKey.Model);
  }
};

export const getTranslatedEntity = (route: ApplicationRoute, t: (key: string) => string) => {
  if (route === ApplicationRoute.McpDeployments) {
    return t(EntitiesI18nKey.Toolset);
  } else if (route === ApplicationRoute.InterceptorDeployments) {
    return t(EntitiesI18nKey.Interceptor);
  } else {
    return t(EntitiesI18nKey.Model);
  }
};

export const getIdFormat = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '_');
};

export const getEntityId = (container: Container, route: ApplicationRoute, t: (key: string) => string) => {
  return getIdFormat(getEntityName(container, route, t));
};

export const getEntityName = (container: Container, route: ApplicationRoute, t: (key: string) => string) => {
  return `${container.name} ${getTranslatedEntity(route, t)}`;
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
    source: { $type: SOURCE_TYPE.CONTAINER, containerId: container.id },
  };

  if (route === ApplicationRoute.ModelDeployments) {
    (template as DialModel).type = DialModelType.Chat;
    template.source = {
      ...(template.source as SOURCE_FIELD),
      completionEndpointPath: `${template.name}${getEndpointPostfix((template as DialModel).type)}`,
    };
    (template as DialModel).displayVersion = '';
  }

  if (route === ApplicationRoute.McpDeployments) {
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
  transport?: CONTAINER_TRANSPORT,
): AssetToolset => {
  const template: AssetToolset = {
    name: getEntityId(container, route, t),
    displayName: getEntityName(container, route, t),
    description: '',
    endpoint: container.url,
    version: '1.0.0',
    folderId: '',
    nodeType: DialFileNodeType.ITEM,
    path: '',
  };

  if (route === ApplicationRoute.McpDeployments) {
    if (transport) {
      (template as Toolset).transport = ENTITY_TRANSPORT[transport];
    }
  }

  return template;
};

export const splitFolderId = (folderId: string) => {
  const match = folderId.match(/^\/?[^/]+\//);
  const base = match ? match[0] : folderId + '/';
  const path = match ? folderId.slice(base.length) : '';
  return { base, path };
};
