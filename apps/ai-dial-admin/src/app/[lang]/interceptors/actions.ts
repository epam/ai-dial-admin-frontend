'use server';
import { cookies, headers } from 'next/headers';

import { interceptorsApi } from '@/src/app/api/api';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getInterceptorsList() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.getInterceptorsListAction(token);
}

export async function removeInterceptor(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.removeInterceptor(token, name);
}

export async function getCoreInterceptor(interceptor: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.getCoreInterceptor(interceptor, token);
}

export async function updateCoreInterceptor(interceptor: DialInterceptor, name: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.updateCoreInterceptor(interceptor, name, etag, token);
}

export async function updateInterceptor(interceptor: DialInterceptor, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const newInterceptor = {
    ...interceptor,
    defaults: { ...interceptor.defaults },
  };
  return interceptorsApi.updateInterceptor(newInterceptor, token, etag);
}

export async function createInterceptor(interceptor: DialInterceptor) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.createInterceptor(interceptor, token);
}

export async function getConfigurationSchema(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.getConfigurationSchema(name, token);
}
