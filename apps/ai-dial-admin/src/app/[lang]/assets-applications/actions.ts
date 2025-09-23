'use server';

import { cookies, headers } from 'next/headers';

import { assetAppsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getApps(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetAppsApi.getAppsList(token, path);
}

export async function removeApp(path?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetAppsApi.removeApp(token, path);
}

export async function moveApps(paths: string[], newPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetAppsApi.moveApps(token, paths, newPath);
}

export async function bulkDeleteApps(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await assetAppsApi.bulkDeleteApps(token, paths);
}
