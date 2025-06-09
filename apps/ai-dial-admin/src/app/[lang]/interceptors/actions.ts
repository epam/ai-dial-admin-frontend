'use server';
import { cookies, headers } from 'next/headers';

import { interceptorsApi } from '@/src/app/api/api';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function removeInterceptor(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.removeInterceptor(token, name);
}

export async function updateInterceptor(interceptor: DialInterceptor) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.updateInterceptor(interceptor, token);
}

export async function createInterceptor(interceptor: DialInterceptor) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.createInterceptor(interceptor, token);
}
