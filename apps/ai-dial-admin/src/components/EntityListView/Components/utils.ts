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

export const prepareEntityForDuplicate = (route: ApplicationRoute, entity: BaseEntity, prompt?: DialPrompt | null) => {
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
    return {
      ...entity,
      description: prompt?.description,
      content: prompt?.content,
    };
  }

  return entity;
};
