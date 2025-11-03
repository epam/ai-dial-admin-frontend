'use server';

import { cookies, headers } from 'next/headers';

import { routesApi } from '@/src/app/api/api';
import { DialRoute } from '@/src/models/dial/route';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { removeEmptyValues } from '@/src/components/Routes/utils';

export async function removeRoute(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return routesApi.removeRoute(token, name);
}

export async function updateRoute(route: DialRoute, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return routesApi.updateRoute(removeEmptyValues(route), token, etag);
}

export async function createRoute(route: DialRoute) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return routesApi.createRoute(route, token);
}

export async function getCoreRoute(name: string, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return routesApi.getCoreRoute(name, eTag, token);
}

export async function updateCoreRoute(route: DialRoute, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return routesApi.updateCoreRoute(route, eTag, token);
}
