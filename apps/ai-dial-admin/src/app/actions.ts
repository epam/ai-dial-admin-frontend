'use server';

import { cookies, headers } from 'next/headers';

import { interceptorsApi, utilityApi } from '@/src/app/api/api';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function checkIsUniqueDeploymentName(name: string, route?: ApplicationRoute): Promise<boolean> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  const response =
    route === ApplicationRoute.Interceptors
      ? await interceptorsApi.checkInterceptorByName(name, token)
      : await utilityApi.checkDeploymentByName(name, token);

  return response === null;
}

export async function getAppProcessStatus() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.getAppProcessStatus(token);
}

export async function getCoreVersions() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.getCoreVersion(token);
}

export async function setCoreVersion(version?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const coreVersion = { coreConfigVersion: version };
  return utilityApi.setCoreVersion(coreVersion, token);
}

export async function getCoreSyncStatus(url: string | null, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  if (url) {
    return utilityApi.getEntitySyncStatus(url, token, etag);
  }
}
