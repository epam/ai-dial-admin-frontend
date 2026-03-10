'use server';

import { cookies, headers } from 'next/headers';

import { modelsApi, adaptersApi } from '@/src/app/api/api';
import { DEFAULT_ROLE_LIMITS } from '@/src/constants/role';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { convertDefaultsToRecord } from '@/src/components/Defaults/utils';
import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';

export async function getModelsListAction() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.getModelsListAction(token);
}

export async function getModelsList() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.getModelsList(token);
}

export async function getModel(name: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.getModel(name, token, etag);
}

export async function getModelsTopics() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.getModelsTopics(token);
}

export async function getModelsAdapters() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return adaptersApi.getAdaptersListAction(token);
}

export async function getModelsTokenizers() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.getModelsTokenizers(token);
}

export async function removeModel(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.removeModel(token, name);
}

export async function updateModel(model: DialModel, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const defaults = model.defaultsTemp ? { ...convertDefaultsToRecord(model.defaultsTemp) } : { ...model.defaults };
  const newModel = {
    ...model,
    defaults,
  };
  delete newModel.defaultsTemp;
  return modelsApi.updateModel(newModel, token, etag);
}

export async function createModel(model: DialModel, duplicate?: boolean) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const type = model.type || DialModelType.Chat;
  return modelsApi.createModel(
    {
      ...model,
      ...DEFAULT_ROLE_LIMITS,
      type,
      source: {
        ...model.source,
        completionEndpointPath:
          model.source?.$type === SOURCE_TYPE.CONTAINER || duplicate
            ? model.source?.completionEndpointPath
            : `${model.name}${getEndpointPostfix(type)}`,
      } as SOURCE_FIELD,
    },
    token,
  );
}

export async function getCoreModel(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.getCoreModel(name, token);
}

export async function updateCoreModel(model: DialModel, name: string, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.updateCoreModel(model, name, eTag, token);
}
