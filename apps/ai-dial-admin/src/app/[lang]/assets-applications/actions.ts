'use server';

import { cookies, headers } from 'next/headers';

import { assetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ResourceType } from '@/src/types/folder';

export async function getApps(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getAssetList(token, path, ResourceType.APPLICATION);
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
