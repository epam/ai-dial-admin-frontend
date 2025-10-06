'use server';

import { cookies, headers } from 'next/headers';

import { assetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ResourceType } from '@/src/types/resource-type';
import { DialAssetApp } from '@/src/models/dial/asset-app';

export async function getApps(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getAssetList(token, path, ResourceType.APPLICATION);
}

export async function getApp(folderId: string, name: string, version: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const apps = await assetsApi.getAssetList(token, `${folderId}/`, ResourceType.APPLICATION);
  const path = apps?.find((app) => app.name === name && (app as DialAssetApp).version === version)?.path as string;

  return assetsApi.getAsset(token, path, ResourceType.APPLICATION);
}

export async function updateApp(app: DialAssetApp) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.updateAsset(token, app, ResourceType.APPLICATION);
}

export async function removeApp(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.removeAsset(token, path, ResourceType.APPLICATION);
}

export async function bulkDeleteApps(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.bulkDeleteAssets(token, paths, ResourceType.APPLICATION);
}

export async function moveApps(paths: string[], newPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.moveAssets(token, paths, newPath, ResourceType.APPLICATION);
}
