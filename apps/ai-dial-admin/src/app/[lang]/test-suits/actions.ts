'use server';

import { cookies, headers } from 'next/headers';

import { routesApi } from '@/src/app/api/api';
import { DialRoute } from '@/src/models/dial/route';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

// TODO: replace api
export async function removeSuit(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return routesApi.removeRoute(token, name);
}

export async function createSuit(route: DialRoute) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return routesApi.createRoute(route, token);
}
