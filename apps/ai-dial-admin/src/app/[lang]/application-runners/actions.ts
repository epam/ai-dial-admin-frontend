'use server';

import { cookies, headers } from 'next/headers';

import { applicationRunnersApi } from '@/src/app/api/api';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getAppRoutes } from '@/src/utils/entities/app-routes';

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
      'dial:applicationTypeRoutes': getAppRoutes(runner['dial:applicationTypeRoutes']),
    },
    token,
    etag,
  );
}

export async function getApplicationScheme(name: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.getApplicationScheme(name, token, etag);
}

export async function getResolvedApplicationScheme(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.getResolvedApplicationScheme(name, token);
}
export async function getCoreRunner(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.getCoreRunner(name, token);
}

export async function updateCoreRunner(runner: DialApplicationScheme, name: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.updateCoreRunner(runner, name, etag, token);
}
