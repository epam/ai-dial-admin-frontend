'use server';

import { cookies, headers } from 'next/headers';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { interceptorTemplatesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getInterceptorTemplatesList() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorTemplatesApi.getInterceptorTemplatesList(token);
}

export async function getInterceptorTemplate(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorTemplatesApi.getInterceptorTemplate(name, token);
}

export async function createInterceptorTemplate(template: InterceptorTemplate) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorTemplatesApi.createInterceptorTemplate(template, token);
}

export async function updateInterceptorTemplate(template: InterceptorTemplate) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorTemplatesApi.updateInterceptorTemplate(template, token);
}

export async function deleteInterceptorTemplate(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return interceptorTemplatesApi.deleteInterceptorTemplate(token, name);
}
