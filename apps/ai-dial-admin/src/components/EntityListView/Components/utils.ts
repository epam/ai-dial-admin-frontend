import { RefObject } from 'react';

import { getApp } from '@/src/app/[lang]/assets-applications/actions';
import { getToolset } from '@/src/app/[lang]/assets-toolsets/actions';
import { getPrompt } from '@/src/app/[lang]/prompts/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { Asset, AssetApp, AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';

export const getData = async <T>(route: ApplicationRoute, ref: RefObject<T | undefined>) => {
  if (route === ApplicationRoute.Prompts) {
    const { folderId, name, version } = ref.current as DialPrompt;
    return await getPrompt(folderId, name as string, version);
  }

  if (route === ApplicationRoute.AssetsApplications) {
    const { folderId, name, version } = ref.current as AssetApp;
    return (await getApp(folderId, name as string, version, DEFAULT_ETAG)).response;
  }

  if (route === ApplicationRoute.AssetsToolsets) {
    const { folderId, name, version } = ref.current as AssetToolset;
    return (await getToolset(folderId, name as string, version, DEFAULT_ETAG)).response;
  }

  return null;
};

export const getCorrectPath = (entity?: Asset | null) => `${entity?.folderId}${entity?.name}__${entity?.version}`;

export const prepareEntityForDuplicate = async <T>(
  route: ApplicationRoute,
  entity: BaseEntity,
  ref: RefObject<T | undefined>,
) => {
  const fullEntity = await getData(route, ref);

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
    const path = getCorrectPath(entity as DialPrompt);
    return {
      ...entity,
      description: prompt?.description,
      content: prompt?.content,
      path,
    };
  }

  if (route === ApplicationRoute.AssetsApplications) {
    const app = fullEntity as AssetApp | null;
    const path = getCorrectPath(entity as AssetApp);

    return {
      ...app,
      ...entity,
      path,
    };
  }

  if (route === ApplicationRoute.AssetsToolsets) {
    const toolset = fullEntity as AssetToolset | null;
    const path = getCorrectPath(entity as AssetToolset);

    return {
      ...toolset,
      ...entity,
      path,
    };
  }

  return entity;
};
