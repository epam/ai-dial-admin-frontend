'use server';

import { cookies, headers } from 'next/headers';

import { applicationRunnersApi } from '@/src/app/api/api';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function removeApplicationScheme(id?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.removeApplicationScheme(token, id);
}

export async function createApplicationScheme(scheme: DialApplicationScheme) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.createApplicationScheme(scheme, token);
}

export async function updateApplicationScheme(runner: DialApplicationScheme, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.updateApplicationScheme(
    {
      ...runner,
      'dial:applicationTypeRoutes': runner['dial:applicationTypeRoutes']?.map((route) => ({
        ...route,
        name: route.displayName || route.name,
      })),
    },
    token,
    etag,
  );
}

export async function getCoreRunner(name: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.getCoreRunner(name, etag, token);
}

export async function updateCoreRunner(toolset: DialApplicationScheme, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.updateCoreRunner(toolset, etag, token);
}
