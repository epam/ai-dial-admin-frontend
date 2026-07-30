'use server';

import { cookies, headers } from 'next/headers';

import { assetApi } from '@/src/app/api/api';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DialModelResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

function toModelPayload(model: DialModelResource) {
  const { status: __status, path: __path, folderId: __folderId, ...payload } = model;
  return payload;
}

export async function getModels(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.MODEL, path);
}

export async function createModel(model: DialModelResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.MODEL, model.name, toModelPayload(model));
}

export async function getModel(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<AssetModel>(token, ResourceType.MODEL, path, etag);
}

export async function updateModel(model: DialModelResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.MODEL, model.name, toModelPayload(model), { etag });
}

export async function removeModel(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.MODEL, path, etag);
}

export async function bulkDeleteModels(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.MODEL, paths);
}
