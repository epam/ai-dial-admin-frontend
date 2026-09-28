'use server';

import { cookies, headers } from 'next/headers';

import { coreUtilityApi, interceptorsApi, utilityApi } from '@/src/app/api/api';
import { CoreVersions } from '@/src/models/core-version';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function checkIsUniqueDeploymentName(name: string): Promise<boolean> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  const [deploymentResponse, interceptorResponse] = await Promise.all([
    coreUtilityApi.checkDeploymentByName(name, token),
    interceptorsApi.checkInterceptorByName(name, token),
  ]);

  return deploymentResponse === null && interceptorResponse === null;
}

export async function getBeVersion() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.getBeVersion(token);
}

export async function getAppProcessStatus() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.getAppProcessStatus(token);
}

export async function getCoreVersions() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  if (process.env.DIAL_ADMIN_API_URL) {
    return utilityApi.getCoreVersion(token);
  }

  const version = await coreUtilityApi.getCoreVersion(token);
  const response: CoreVersions = version ? { autoDetectedVersion: version } : {};
  return { success: true, response };
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
