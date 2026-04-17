'use server';

import { cookies, headers } from 'next/headers';

import { telemetryApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TelemetryQuery } from '@/src/models/telemetry';

export async function getDashboardData(query: TelemetryQuery) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return telemetryApi.getDashboardData(query, token);
}
