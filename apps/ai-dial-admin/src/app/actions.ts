'use server';

import { cookies, headers } from 'next/headers';

import { interceptorsApi, utilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function checkIsUniqueDeploymentName(name: string): Promise<boolean> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  const [deploymentResponse, interceptorResponse] = await Promise.all([
    utilityApi.checkDeploymentByName(name, token),
    interceptorsApi.checkInterceptorByName(name, token),
  ]);

  return deploymentResponse === null && interceptorResponse === null;
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
