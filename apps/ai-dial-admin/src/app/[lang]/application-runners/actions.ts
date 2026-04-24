'use server';

import { cookies, headers } from 'next/headers';

import { applicationRunnersApi } from '@/src/app/api/api';
import { ApplicationMCPConfigDelivery, DialApplicationScheme } from '@/src/models/dial/application';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getAppRoutes } from '@/src/utils/entities/app-routes';

const transformApplicationSchemeForServer = (scheme: DialApplicationScheme): DialApplicationScheme => {
  const mcp = scheme['dial:applicationTypeMcp'];
  if (!mcp) return scheme;

  const configDelivery = mcp['dial:mcpConfigDelivery'];
  if (!configDelivery) return scheme;

  return {
    ...scheme,
    'dial:applicationTypeMcp': {
      ...mcp,
      'dial:mcpConfigDelivery': configDelivery.toUpperCase() as ApplicationMCPConfigDelivery,
    },
  };
};

export async function removeApplicationScheme(id?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.removeApplicationScheme(token, id);
}

export async function createApplicationScheme(scheme: DialApplicationScheme) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationRunnersApi.createApplicationScheme(transformApplicationSchemeForServer(scheme), token);
}

export async function updateApplicationScheme(runner: DialApplicationScheme, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const transformedRunner = transformApplicationSchemeForServer(runner);
  return applicationRunnersApi.updateApplicationScheme(
    {
      ...transformedRunner,
      'dial:applicationTypeRoutes': getAppRoutes(transformedRunner['dial:applicationTypeRoutes']),
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
  return applicationRunnersApi.updateCoreRunner(transformApplicationSchemeForServer(runner), name, etag, token);
}
