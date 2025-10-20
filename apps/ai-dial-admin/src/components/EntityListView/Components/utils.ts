import { RefObject } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { getPrompt } from '@/src/app/[lang]/prompts/actions';
import { getApp } from '@/src/app/[lang]/assets-applications/actions';
import { AssetApp } from '@/src/models/dial/deployment-asset';

export const getData = async (route: ApplicationRoute, ref: RefObject<T | undefined>) => {
  if (route === ApplicationRoute.Prompts) {
    const { folderId, name, version } = ref.current as DialPrompt;
    return await getPrompt(folderId, name as string, version);
  }

  if (route === ApplicationRoute.AssetsApplications) {
    const { folderId, name, version } = ref.current as AssetApp;
    return await getApp(folderId, name as string, version, '*');
  }

  return null;
};

export const prepareEntityForDuplicate = <T>(
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
    return {
      ...entity,
      description: prompt?.description,
      content: prompt?.content,
    };
  }

  if (route === ApplicationRoute.AssetsApplications) {
    const app = fullEntity as AssetApp | null;
    return {
      ...entity,
      endpoint: app?.endpoint,
    };
  }

  return entity;
};
