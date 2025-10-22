'use server';

import { cookies, headers } from 'next/headers';

import { assetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ResourceType } from '@/src/types/resource-type';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { convertDefaultsToRecord } from '@/src/components/Defaults/utils';

export async function getApps(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getAssetList(token, path, ResourceType.APPLICATION);
}

export async function createApp(toolset: AssetApp) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.createAsset(toolset, ResourceType.APPLICATION, token);
}

export async function getApp(folderId: string, name: string, version: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const apps = await assetsApi.getAssetList(token, `${folderId}/`, ResourceType.APPLICATION);
  const path = apps?.find((app) => app.name === name && (app as AssetApp).version === version)?.path as string;

  return assetsApi.getAssetWithEtag(token, path, ResourceType.APPLICATION, etag);
}

export async function updateApp(app: AssetApp, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  const defaults = app.defaultsTemp ? { ...convertDefaultsToRecord(app.defaultsTemp) } : { ...app.defaults };

  const application = {
    ...app,
    routes: app.routes?.map((route) => ({ ...route, name: route.displayName || route.name })),
    defaults,
  };
  delete application.defaultsTemp;
  return assetsApi.updateAssetWithEtag(token, application, ResourceType.APPLICATION, etag);
}

export async function removeApp(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.removeAssetWithEtag(token, path, ResourceType.APPLICATION, etag);
}

export async function bulkDeleteApps(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.bulkDeleteAssets(token, paths, ResourceType.APPLICATION);
}

export async function moveApps(paths: string[], newPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.moveAssets(token, paths, newPath, ResourceType.APPLICATION);
}
