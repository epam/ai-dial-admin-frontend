'use server';
import { cookies, headers } from 'next/headers';

import { interceptorsApi, deploymentsApi } from '@/src/app/api/api';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { convertDefaultsToRecord } from '@/src/components/Defaults/utils';

export async function getInterceptorsList() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.getInterceptorsList(token);
}

export async function removeInterceptor(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.removeInterceptor(token, name);
}

export async function updateInterceptor(interceptor: DialInterceptor, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const defaults = interceptor.defaultsTemp
    ? { ...convertDefaultsToRecord(interceptor.defaultsTemp) }
    : { ...interceptor.defaults };
  const newInterceptor = {
    ...interceptor,
    defaults,
  };
  delete newInterceptor.defaultsTemp;
  return interceptorsApi.updateInterceptor(newInterceptor, token, etag);
}

export async function createInterceptor(interceptor: DialInterceptor) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorsApi.createInterceptor(interceptor, token);
}

export async function getInterceptorContainers() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return deploymentsApi.getInterceptorContainers(token);
}
