'use server';

import { cookies, headers } from 'next/headers';

import { modelsApi, adaptersApi } from '@/src/app/api/api';
import { DEFAULT_ROLE_LIMITS } from '@/src/constants/role';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getModels() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.getModelsList(token);
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

export async function updateModel(model: DialModel) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.updateModel(model, token);
}

export async function createModel(model: DialModel) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return modelsApi.createModel(
    {
      ...model,
      ...DEFAULT_ROLE_LIMITS,
      type: model.type || DialModelType.Chat,
    },
    token,
  );
}
