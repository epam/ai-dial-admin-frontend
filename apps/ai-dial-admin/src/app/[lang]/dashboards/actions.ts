'use server';

import { cookies, headers } from 'next/headers';

import { telemetryApi } from '@/src/app/api/api';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TelemetryQuery } from '@/src/models/telemetry';

/** Whether the analytics service refuses the current user, for a surface rendered on the client. */
export async function getIsAnalyticsForbidden(): Promise<boolean> {
  return isAnalyticsForbidden();
}

export async function getDashboardData(query: TelemetryQuery) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return telemetryApi.getDashboardData(query, token);
}
