'use server';

import { cookies, headers } from 'next/headers';

import { assetsApi } from '@/src/app/api/api';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getToolsets(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getAssetList(token, path, ResourceType.TOOLSET);
}

export async function getToolset(folderId: string, name: string, version: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const toolsets = await assetsApi.getAssetList(token, `${folderId}/`, ResourceType.TOOLSET);
  const path = toolsets?.find((toolset) => toolset.name === name && (toolset as AssetToolset).version === version)
    ?.path as string;

  return assetsApi.getAssetWithEtag(token, path, ResourceType.TOOLSET, etag);
}

export async function updateToolset(toolset: AssetToolset, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.updateAssetWithEtag(token, toolset, ResourceType.TOOLSET, etag);
}

export async function removeToolset(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.removeAssetWithEtag(token, path, ResourceType.TOOLSET, etag);
}

export async function bulkDeleteToolsets(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.bulkDeleteAssets(token, paths, ResourceType.TOOLSET);
}

export async function moveToolsets(paths: string[], newPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.moveAssets(token, paths, newPath, ResourceType.TOOLSET);
}
