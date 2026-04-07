import { RefObject } from 'react';

import { getApplication } from '@/src/app/[lang]/applications/actions';
import { getApp } from '@/src/app/[lang]/assets-applications/actions';
import { getToolset } from '@/src/app/[lang]/assets-toolsets/actions';
import { getPrompt } from '@/src/app/[lang]/prompts/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { DialApplication } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { AssetWithVersion, AssetApp, AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-view';

export const getData = async <T>(route: ApplicationRoute, ref: RefObject<T | undefined>) => {
  if (route === ApplicationRoute.Prompts) {
    const { folderId, name, version } = ref.current as DialPrompt;
    return (await getPrompt(folderId, name as string, version, DEFAULT_ETAG)).response;
  }

  if (route === ApplicationRoute.AssetsApplications) {
    const { folderId, name, version } = ref.current as AssetApp;
    return (await getApp(folderId, name as string, version, DEFAULT_ETAG)).response;
  }

  if (route === ApplicationRoute.AssetsToolsets) {
    const { folderId, name, version } = ref.current as AssetToolset;
    return (await getToolset(folderId, name as string, version, DEFAULT_ETAG)).response;
  }

  if (route === ApplicationRoute.Applications) {
    const { name } = ref.current as DialApplication;
    return (await getApplication(name as string, DEFAULT_ETAG)).response;
  }

  return null;
};

export const getCorrectPath = (entity?: AssetWithVersion | null) =>
  `${entity?.folderId}${entity?.name}__${entity?.version}`;

export const preparePathForAsset = (entity: BaseEntity, route: ApplicationRoute) => {
  if (isAssetWithVersion(route)) {
    return {
      ...entity,
      path: getCorrectPath(entity as AssetWithVersion),
    };
  }
  return entity;
};

export const prepareEntityForDuplicate = async <T>(
  route: ApplicationRoute,
  entity: BaseEntity,
  ref: RefObject<T | undefined>,
) => {
  const fullEntity = await getData(route, ref);

  if (route === ApplicationRoute.Applications) {
    return fullEntity;
  }

  if (route === ApplicationRoute.Roles) {
    return {
      ...entity,
      limits: {},
      share: {},
      grantedKeys: [],
    };
  }

  if (route === ApplicationRoute.Interceptors) {
    return {
      ...entity,
      entities: [],
      applicationTypeSchemas: [],
    };
  }

  if (route === ApplicationRoute.Keys) {
    return {
      ...entity,
      roles: [],
    };
  }

  if (route === ApplicationRoute.Prompts) {
    const prompt = fullEntity as DialPrompt | null;
    return {
      ...entity,
      description: prompt?.description,
      content: prompt?.content,
    };
  }

  if (route === ApplicationRoute.AssetsApplications) {
    const app = fullEntity as AssetApp | null;
    delete app?.reference;

    return {
      ...app,
      ...entity,
    };
  }

  if (route === ApplicationRoute.AssetsToolsets) {
    const toolset = fullEntity as AssetToolset | null;

    return {
      ...toolset,
      ...entity,
    };
  }

  if (route === ApplicationRoute.Toolsets) {
    const toolset = entity as Toolset;
    return {
      ...entity,
      authSettings: toolset.authSettings
        ? {
            ...toolset.authSettings,
            globalAuthStatus: undefined,
            userLevelAuthStatus: undefined,
            clientSecret: '',
            apiKeyHeader:
              toolset.authSettings.authenticationType === ToolsetAuthType.API_KEY
                ? ''
                : toolset.authSettings.apiKeyHeader,
          }
        : undefined,
    };
  }

  if (route === ApplicationRoute.Adapters) {
    return {
      ...entity,
      models: [],
    };
  }

  if (route === ApplicationRoute.ApplicationRunners) {
    return {
      ...entity,
      applications: [],
    };
  }

  if (route === ApplicationRoute.InterceptorTemplates) {
    return {
      ...entity,
      interceptors: [],
    };
  }

  return entity;
};
