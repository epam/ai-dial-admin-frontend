'use server';

import { cookies, headers } from 'next/headers';

import { metricsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getMetrics(page: number, size: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return metricsApi.getMetrics(page, size, token);
}

export async function getMetric(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return metricsApi.getMetric(id, token);
}
